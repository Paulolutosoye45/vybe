# December Issa Vybe — Teaser (Next.js)

A premium, interactive teaser for FirstBank's Vybe Hub, built as a real Next.js
application with a real database — not a static page. Two games (The Run Up,
an endless runner; The Vybe Wheel, a spin-to-win reward mechanic), a points
ledger, a referral system, and a live state leaderboard, all backed by actual
API routes and a real schema.

This document tells you exactly what has been tested, what hasn't, and why
a couple of technical choices differ from the original plan.

---

## Quick start

```bash
npm install
npx drizzle-kit migrate   # creates dev.db and all tables
npm run dev                # http://localhost:3000
```

That's it — no external database to provision, no API keys required to see
the whole thing working end to end.

To reset the database at any point:
```bash
rm dev.db dev.db-shm dev.db-wal
npx drizzle-kit migrate
```

---

## Viewing the database (localhost only)

`npx drizzle-kit migrate` **applies** schema changes — it doesn't show you
any data. To actually browse the rows in your local `dev.db` (players,
game sessions, the points ledger, referral events), use **Drizzle Studio**
instead:

```bash
npm run db:studio
```

This opens a free visual browser at **`https://local.drizzle.studio`**.
The page itself loads from Drizzle's servers, but the actual data stays on
your machine — the studio page talks to a small local server that
`drizzle-kit studio` starts for you, which reads directly from the
`dev.db` file sitting in this project folder. Your database contents
never leave your computer. Close the terminal running the command and the
local server stops, and the page can no longer reach any data.

What you'll see there: every table in `src/lib/schema.ts` (`players`,
`game_sessions`, `wheel_spins`, `points_ledger`, `referral_codes`,
`referral_events`, `state_aggregate`, `global_aggregate`), fully browsable
and editable, which is the fastest way to confirm a signup, a game run, or
a referral actually landed correctly while you're testing.

**This is a local-development tool, not a production one.** A few things
change once `DATABASE_URL` points at a real Postgres instance instead of
the local SQLite file:

- `npx drizzle-kit studio` still technically works against Postgres, but
  pointing a browser-based studio at a live production database — even
  read-only — is not something to do casually. Treat it the same as you
  would running a raw SQL client against prod: fine for a specific,
  deliberate look with the right people aware, not a routine habit.
- For production, the normal path is your Postgres provider's own
  dashboard (Neon, Supabase, or whatever FirstBank's infrastructure team
  provisions) or a proper database client (TablePlus, DBeaver, psql) —
  something with real access control, not a tool whose whole design
  point is "instant, no-login access to whatever `DATABASE_URL` says."
- If Drizzle Studio against production is ever genuinely needed (e.g.
  debugging a live issue), do it over a secured connection, with a
  read-only database role if at all possible, and treat the session as
  something to close immediately after — not to leave running.

Short version: `npx drizzle-kit studio` on your laptop, against `dev.db`,
any time — go wild. The same command pointed at production is a "know
exactly why you're doing this" action, not a default one.

---

## What's real here

Every one of these was actually run and checked, not just written:

- **Waitlist signup** — writes a real player row, generates a unique referral
  code, assigns queue position by registration order.
- **The Run Up** — a full canvas endless runner (physics, obstacles, stamps,
  the daily "gate" distance) that posts real scores to `/api/game-score`,
  which writes to the points ledger, the state leaderboard, and the national
  counter in one transaction-like sequence.
- **The Vybe Wheel** — a second game, and the actual reward mechanic you
  asked for. The server picks the outcome — the client never decides its own
  prize — and the result is deducted/paid into the same points ledger.
- **Referrals** — a second browser joining via `?ref=CODE` triggers a real
  referral event, moves the referrer's queue position, and pays out a
  points bonus. Verified with two separate browser sessions in the same
  test run.
- **The points ledger** — append-only, never an editable balance column.
  Balance is always `SUM(amount)` for a player. This is deliberate: it's
  the same pattern real loyalty and banking systems use, and it's what
  makes the balance auditable later ("how did this customer get to 4,200
  points?" — you can show every line, not just trust a number).
- **The state leaderboard and national counter** — real aggregated data,
  polled every 15 seconds.

---

## What isn't verified

**Video playback.** The hero uses the real video URL you supplied
(`decemberissavybe.com/.../2022395-hd_1920_1080_30fps.mp4`), but that domain
is not reachable from the sandboxed environment this was built in — every
request to it returns 403. I have not seen it actually play. The failure is
handled gracefully (a dark gradient sits in front of the video regardless,
so there's no broken-video artifact either way), but you should be the one
to confirm the URL plays before this goes anywhere near FirstBank's review.

**Everything about payments, redemption, or converting points into a real
reward.** The ledger and balance are real; a redemption flow is deliberately
not built, because that's a Phase 2 (Passport) decision, not a teaser one.

---

## Two technical decisions worth knowing about

### 1. Next.js 16, not 14

The project was originally built on Next.js 14.2.5. The first dependency
install flagged a **critical** security advisory on that version. Rather
than ship it, the whole stack was upgraded to Next.js 16.3.4 (which also
required bumping ESLint to v9 to satisfy a peer dependency). Final `npm
audit`: **zero vulnerabilities** in anything that ships to production.

### 2. Drizzle ORM, not Prisma

The schema was originally written in Prisma. Prisma's query engine is a
compiled binary fetched from `binaries.prisma.sh` at `generate` time — and
that host was unreachable from the build environment, with no cached engine
available either. Rather than hand over a database layer that had never
actually run, the project was rebuilt on **Drizzle ORM + better-sqlite3**,
which needs no proprietary binary CDN. Every migration, query, and API
route was then actually executed and checked.

**This is not a downgrade.** Drizzle is a fully modern, type-safe,
widely-used ORM — many teams choose it specifically for being lighter than
Prisma. The schema design (append-only ledger, separate referral events
table, per-run game sessions rather than just a "best score") is unchanged
from the original plan; only the driver is different.

### 3. Self-hosted fonts

`next/font/google` also couldn't reach `fonts.googleapis.com` in this
environment, so the actual Fraunces and Inter variable font files were
fetched directly and are self-hosted via `next/font/local` in `src/fonts/`.
This is arguably the better pattern for a low-data-conscious product anyway
— it removes a runtime dependency on Google's CDN entirely, consistent with
the performance requirements already documented in the Teaser Blueprint.

---

## Moving to production

### Database: swap SQLite for Postgres

The schema and every query are already written against Drizzle's query
builder, which is driver-agnostic. To move to Postgres (Neon, Supabase, or
FirstBank-managed):

1. `npm install postgres` (or your preferred pg driver)
2. In `src/lib/db.ts`, swap the `better-sqlite3` + `drizzle-orm/better-sqlite3`
   imports for `postgres` + `drizzle-orm/postgres-js`
3. In `src/lib/schema.ts`, swap `sqliteTable` for `pgTable` (column types
   carry over almost unchanged)
4. `npx drizzle-kit generate` against the new schema, then `drizzle-kit migrate`

This is a driver swap, not a redesign.

### Anti-cheat (before this graduates past teaser status)

Game scores are currently client-reported with a generous server-side
sanity ceiling (max 500m per run) — not a server-authoritative physics
replay. This is a fine trade-off for a teaser where points are cosmetic,
but if this evolves into the real Play pillar with meaningful rewards, see
the Teaser Blueprint Part 5.11 for what a full anti-cheat pass needs
(signed run tokens, server-side replay validation, rate limiting).

### Fraud review on referrals

`referral_events` includes a `flagged` column specifically so a future
fraud check (same-device self-referral, disposable email detection, rate
limiting) can mark an event without ever deleting it — the points already
paid out stay auditable even if a referral is later found to be abusive.

### Analytics

No GTM/GA4/Meta Pixel IDs are wired in yet — see the Blocker Tracker for
what's still pending from FirstBank's side. `POINTS`, launch dates, and the
video URL are all environment variables in `.env` for the same reason:
swap them in without touching code.

### Legal

The queue-position-via-referral mechanic is a standard, low-risk marketing
referral program — a materially different (and safer) mechanic than
performance-based queue jumps, which is a separate open legal question
already tabled with FirstBank Legal. Still, this should get its own line
in the T&Cs before launch. The T&C and Privacy Notice links in the footer
are placeholders, clearly marked, pending Data Privacy's final copy.

---

## Project structure

```
src/
  app/
    page.tsx              — the whole experience, client-side orchestration
    layout.tsx             — fonts, metadata
    api/
      waitlist/route.ts    — signup, referral resolution, queue position
      game-score/route.ts  — run submission, points, leaderboard update
      wheel-spin/route.ts  — server-authoritative spin outcome
      leaderboard/route.ts — national + state aggregates
      player/route.ts      — profile, balance, ledger, streak
  components/
    Hero.tsx, CountdownTimer.tsx, GameArcade.tsx, RewardsPanel.tsx,
    ReferralCard.tsx, Leaderboard.tsx, WaitlistForm.tsx, Footer.tsx
    games/RunUpGame.tsx, games/VybeWheel.tsx
  lib/
    db.ts, schema.ts       — Drizzle + better-sqlite3
    points.ts              — the one place points get awarded (audit-friendly)
    gate.ts                — the daily gate distance + referral code generation
    usePlayer.ts           — client-side identity, localStorage-backed
```

## Known, accepted, non-blocking issue

`npm audit` will still show 4 moderate advisories in `esbuild`, nested
inside `drizzle-kit`'s optional dependency chain. This tool never ships to
production — it's a local CLI used to generate migrations — and the
advisory itself (a dev server accepting arbitrary requests) is only
exploitable if someone exposes that local dev server to a network, which
is not how this or any normal workflow uses it. This is a fundamentally
different risk class from the Next.js runtime CVE that was fixed above,
and it's called out here rather than silently ignored.

One more thing worth knowing: `better-sqlite3` installs a prebuilt native
binary from GitHub Releases rather than compiling from source. On one test
install this fetch failed transiently and node-gyp's source-compile
fallback also failed (it needs to reach `nodejs.org` for Node headers,
which was blocked in that specific sandboxed test environment) — a retry
of `npm install` succeeded immediately. If your own `npm install` ever
fails on `better-sqlite3` specifically, re-run it before assuming
anything's wrong; this was a one-off network hiccup during testing, not a
reproducible fault, and a normal machine with unrestricted internet access
should not hit it at all.