// ============================================================================
// VYBE HUB TEASER — DATABASE SCHEMA (Drizzle ORM + Postgres)
//
// Originally written against Prisma, then run against Drizzle + better-sqlite3
// in this sandbox (Prisma's `generate` step needs binaries.prisma.sh, which
// wasn't reachable here; better-sqlite3 is a normal native npm module, so
// migrations, queries and API routes could all be run and tested directly).
//
// This is the production version: driver swapped to Postgres, `sqliteTable`
// swapped for `pgTable`. Column definitions and relations are unchanged from
// the SQLite version — this was a driver swap, not a redesign.
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

import { pgTable, text, integer, boolean } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export const players = pgTable("players", {
  id: text("id").primaryKey(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  email: text("email").notNull().unique(),
  phone: text("phone").notNull(),
  state: text("state").notNull(),
  createdAt: text("created_at").notNull().default(sql`current_timestamp`),

  consentMarketing: boolean("consent_marketing").notNull().default(false),
  consentVersion: text("consent_version").notNull().default("pending-legal-v0"),
  consentTimestamp: text("consent_timestamp").notNull().default(sql`current_timestamp`),

  queuePosition: integer("queue_position").notNull(),
  streak: integer("streak").notNull().default(1),
  lastVisitDate: text("last_visit_date").notNull(), // "YYYY-MM-DD"

  referralCodeId: text("referral_code_id").notNull().unique(),
  referredByCodeId: text("referred_by_code_id"),
});

export const referralCodes = pgTable("referral_codes", {
  id: text("id").primaryKey(),
  code: text("code").notNull().unique(),
  createdAt: text("created_at").notNull().default(sql`current_timestamp`),
});

export const referralEvents = pgTable("referral_events", {
  id: text("id").primaryKey(),
  referralCodeId: text("referral_code_id").notNull(),
  newPlayerId: text("new_player_id").notNull(), // audit trail: who the referral produced
  spotsAwarded: integer("spots_awarded").notNull(),
  createdAt: text("created_at").notNull().default(sql`current_timestamp`),
  flagged: boolean("flagged").notNull().default(false), // fraud review marks, never deletes
});

export const gameSessions = pgTable("game_sessions", {
  id: text("id").primaryKey(),
  playerId: text("player_id").notNull(),
  game: text("game").notNull(), // "run-up"
  distanceM: integer("distance_m").notNull().default(0),
  stamps: integer("stamps").notNull().default(0),
  reachedGate: boolean("reached_gate").notNull().default(false),
  pointsEarned: integer("points_earned").notNull().default(0),
  createdAt: text("created_at").notNull().default(sql`current_timestamp`),
});

export const wheelSpins = pgTable("wheel_spins", {
  id: text("id").primaryKey(),
  playerId: text("player_id").notNull(),
  segmentLabel: text("segment_label").notNull(),
  pointsWon: integer("points_won").notNull(),
  createdAt: text("created_at").notNull().default(sql`current_timestamp`),
});

export const pointsLedger = pgTable("points_ledger", {
  id: text("id").primaryKey(),
  playerId: text("player_id").notNull(),
  source: text("source").notNull(), // "run_up" | "wheel_spin" | "referral_bonus" | "daily_streak" | "signup_bonus"
  amount: integer("amount").notNull(),
  meta: text("meta"), // small JSON string for context, e.g. {"distance":420}
  createdAt: text("created_at").notNull().default(sql`current_timestamp`),
});

export const stateAggregate = pgTable("state_aggregate", {
  state: text("state").primaryKey(),
  totalDistanceM: integer("total_distance_m").notNull().default(0),
  totalRuns: integer("total_runs").notNull().default(0),
});

export const globalAggregate = pgTable("global_aggregate", {
  id: text("id").primaryKey().default("singleton"),
  totalSignups: integer("total_signups").notNull().default(0),
  totalDistanceRunM: integer("total_distance_run_m").notNull().default(0),
  totalRuns: integer("total_runs").notNull().default(0),
  totalSpins: integer("total_spins").notNull().default(0),
});