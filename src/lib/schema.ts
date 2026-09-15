// ============================================================================
// VYBE HUB TEASER — DATABASE SCHEMA (Drizzle ORM + SQLite)
//
// Originally written against Prisma. Switched to Drizzle + better-sqlite3
// specifically so this project's database layer could be verified end to
// end in this sandbox: Prisma's query engine is a compiled binary fetched
// from binaries.prisma.sh at `generate` time, and that host is unreachable
// here. Drizzle talks to better-sqlite3 directly — a standard native Node
// module installed from npm like any other — so migrations, queries and
// the API routes below were all actually run and tested, not just written.
//
// For production, swap the driver to Postgres (Neon, Supabase, or
// FirstBank-managed): change `better-sqlite3` + `drizzle-orm/better-sqlite3`
// to `postgres` + `drizzle-orm/postgres-js` in src/lib/db.ts, and swap the
// `sqliteTable` calls below for `pgTable`. The column definitions and
// relations barely change — this is a driver swap, not a redesign.
//
// Design notes carried over from the original schema:
// - Player is the one real identity. Everything else hangs off playerId.
// - pointsLedger is an append-only log, never an editable balance column.
//   Balance is always SUM(amount) for a player — the same pattern real
//   banking and loyalty systems use, and what makes the balance auditable
//   when compliance asks "how did this customer get to 4,200 points?"
// - referralEvents is separate from referralCodes so one code can be reused
//   across many successful referrals, each recorded once, each reversible
//   on its own if it turns out to be fraudulent — without touching the
//   rest of the ledger.
// - gameSessions stores every run, not just a personal best. That's what
//   lets a future anti-cheat pass look at the full score distribution
//   rather than trusting a single client-reported "best" value.
// ============================================================================

import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

export const players = sqliteTable("players", {
  id: text("id").primaryKey(),
  username: text("username").unique(), // the public identity — shown on the leaderboard instead of a real name. Nullable at the DB level (existing rows predate this field); every new signup is required to set one via the API's own validation.
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  email: text("email").notNull().unique(),
  phone: text("phone").notNull(),
  state: text("state").notNull(),
  createdAt: text("created_at").notNull().default(sql`(current_timestamp)`),

  consentMarketing: integer("consent_marketing", { mode: "boolean" }).notNull().default(false),
  consentVersion: text("consent_version").notNull().default("pending-legal-v0"),
  consentTimestamp: text("consent_timestamp").notNull().default(sql`(current_timestamp)`),

  queuePosition: integer("queue_position").notNull(),
  streak: integer("streak").notNull().default(0),
  lastVisitDate: text("last_visit_date").notNull(), // "YYYY-MM-DD" — last time they opened the app at all
  lastPlayDate: text("last_play_date"), // "YYYY-MM-DD" — last date a streak-qualifying action (run or spin) happened; this, not lastVisitDate, is what the streak counts
  dailyChallengeDate: text("daily_challenge_date"), // last date today's Run Up challenge was completed
  wheelChallengeDate: text("wheel_challenge_date"), // last date today's Wheel challenge was completed
  triviaChallengeDate: text("trivia_challenge_date"), // last date today's trivia challenge (score threshold) was completed

  referralCodeId: text("referral_code_id").notNull().unique(),
  referredByCodeId: text("referred_by_code_id"),

  // ---- Phase 2 additions ----
  streakFreezes: integer("streak_freezes").notNull().default(0), // consumed automatically to cover one missed day
  longestStreak: integer("longest_streak").notNull().default(0), // for milestone-crossing detection and bragging rights
  bluutvSeriesCompleted: integer("bluutv_series_completed", { mode: "boolean" }).notNull().default(false),
  referralTier: integer("referral_tier").notNull().default(0), // highest referral tier already awarded, so tiers fire exactly once
});

export const referralCodes = sqliteTable("referral_codes", {
  id: text("id").primaryKey(),
  code: text("code").notNull().unique(),
  createdAt: text("created_at").notNull().default(sql`(current_timestamp)`),
});

export const referralEvents = sqliteTable("referral_events", {
  id: text("id").primaryKey(),
  referralCodeId: text("referral_code_id").notNull(),
  newPlayerId: text("new_player_id").notNull(), // audit trail: who the referral produced
  spotsAwarded: integer("spots_awarded").notNull(),
  createdAt: text("created_at").notNull().default(sql`(current_timestamp)`),
  flagged: integer("flagged", { mode: "boolean" }).notNull().default(false), // fraud review marks, never deletes
});

export const gameSessions = sqliteTable("game_sessions", {
  id: text("id").primaryKey(),
  playerId: text("player_id").notNull(),
  game: text("game").notNull(), // "run-up"
  distanceM: integer("distance_m").notNull().default(0),
  stamps: integer("stamps").notNull().default(0),
  reachedGate: integer("reached_gate", { mode: "boolean" }).notNull().default(false),
  pointsEarned: integer("points_earned").notNull().default(0),
  createdAt: text("created_at").notNull().default(sql`(current_timestamp)`),
});

export const wheelSpins = sqliteTable("wheel_spins", {
  id: text("id").primaryKey(),
  playerId: text("player_id").notNull(),
  segmentLabel: text("segment_label").notNull(),
  pointsWon: integer("points_won").notNull(),
  createdAt: text("created_at").notNull().default(sql`(current_timestamp)`),
});

export const pointsLedger = sqliteTable("points_ledger", {
  id: text("id").primaryKey(),
  playerId: text("player_id").notNull(),
  source: text("source").notNull(), // "run_up" | "wheel_spin" | "referral_bonus" | "daily_streak" | "signup_bonus"
  amount: integer("amount").notNull(),
  meta: text("meta"), // small JSON string for context, e.g. {"distance":420}
  createdAt: text("created_at").notNull().default(sql`(current_timestamp)`),
});

export const stateAggregate = sqliteTable("state_aggregate", {
  state: text("state").primaryKey(),
  totalDistanceM: integer("total_distance_m").notNull().default(0),
  totalRuns: integer("total_runs").notNull().default(0),
});

export const globalAggregate = sqliteTable("global_aggregate", {
  id: text("id").primaryKey().default("singleton"),
  totalSignups: integer("total_signups").notNull().default(0),
  totalDistanceRunM: integer("total_distance_run_m").notNull().default(0),
  totalRuns: integer("total_runs").notNull().default(0),
  totalSpins: integer("total_spins").notNull().default(0),
});

// ============================================================================
// LEVEL PROGRESS — one row per player per level, upserted (never appended).
// This is what makes the level map on the arcade screen real: it is not
// computed from game_sessions on every page load, it is the settled best
// result, the same pattern a real mobile game uses for its level-select
// screen. game_sessions still logs every run for analytics; this table is
// the answer to "what does this player's progress actually look like".
// ============================================================================
export const levelProgress = sqliteTable("level_progress", {
  id: text("id").primaryKey(),
  playerId: text("player_id").notNull(),
  level: integer("level").notNull(), // 1-5, see src/lib/levels.ts
  stars: integer("stars").notNull().default(0), // best stars ever earned, 0-3
  bestDistanceM: integer("best_distance_m").notNull().default(0), // furthest reached inside this level's band
  reachedAt: text("reached_at").notNull().default(sql`(current_timestamp)`),
  updatedAt: text("updated_at").notNull().default(sql`(current_timestamp)`),
});

// ============================================================================
// VIDEO WATCHES — one row per player per BluuTV video, upserted on first
// watch. Gated behind signup (see /api/video-watch): a playerId is required
// to record a watch at all, so this table only ever contains real signed-up
// viewers, which is also what makes "watched" badges and the small per-video
// point bonus honest rather than client-trusted.
// ============================================================================
export const videoWatches = sqliteTable("video_watches", {
  id: text("id").primaryKey(),
  playerId: text("player_id").notNull(),
  videoId: text("video_id").notNull(), // matches an id in src/lib/bluutv.ts, not the raw YouTube id
  watchedAt: text("watched_at").notNull().default(sql`(current_timestamp)`),
});

// ============================================================================
// TRIVIA ATTEMPTS — Naija Night School. One row per player per day, upserted
// on submit (never appended), so a player can only score once per day no
// matter how many times the client retries. Same deterministic-by-date
// rotation pattern as the Daily Vybe Challenge — see src/lib/trivia.ts.
// ============================================================================
export const triviaAttempts = sqliteTable("trivia_attempts", {
  id: text("id").primaryKey(),
  playerId: text("player_id").notNull(),
  date: text("date").notNull(), // "YYYY-MM-DD"
  correctCount: integer("correct_count").notNull().default(0),
  pointsEarned: integer("points_earned").notNull().default(0),
  createdAt: text("created_at").notNull().default(sql`(current_timestamp)`),
});

