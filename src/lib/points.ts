import { db } from "@/lib/db";
import { pointsLedger, players } from "@/lib/schema";
import { eq, sql, desc } from "drizzle-orm";
import { nanoid } from "nanoid";

/**
 * VYBE POINTS — award rules.
 *
 * Every rule lives here, in one place, because a real loyalty/points system
 * gets audited eventually ("why does this customer have 4,200 points?") and
 * that question needs one file to answer, not a search across the codebase.
 *
 * These numbers are illustrative — FirstBank Marketing should own the final
 * point values once the Passport tier engine (Phase 2) is specced, since
 * this ledger is designed to migrate directly into that system rather than
 * being thrown away.
 */
export const POINTS = {
  SIGNUP_BONUS: 100,
  RUN_UP_PER_10M: 1, // 1 point per 10 metres run, so a 500m run earns 50
  RUN_UP_STAMP_BASE: 5, // multiplied by combo tier at collection time — see levels.ts / RunUpGame
  RUN_UP_GLIMPSE_BONUS: 50,
  RUN_UP_STAR_BONUS: 15, // per new star earned this run, across all levels reached
  WHEEL_SPIN_COST: 20,
  DAILY_STREAK_BONUS: 10, // awarded once per day, the first time a streak-qualifying action (run or spin) happens
  REFERRAL_BONUS: 150,
  VIDEO_FIRST_WATCH_BONUS: 20, // once per video, first time it's watched — encourages working through all episodes
  VIDEO_SERIES_COMPLETE_BONUS: 150, // once, on watching all ten episodes
  TRIVIA_PER_CORRECT: 15,
  TRIVIA_PERFECT_BONUS: 25, // on top of the per-question points, for 5/5
  REFERRAL_TIER_BONUS: { 3: 200, 5: 500, 10: 1500 } as Record<number, number>,
} as const;

// One-time streak milestones. Crossed exactly once each, tracked against
// longestStreak so breaking and rebuilding a streak later never re-pays a
// milestone already reached. 7/14/30 also grant a streak freeze — the
// reward for building a long streak is protection for the next one.
export const STREAK_MILESTONES: { days: number; bonusPoints: number; grantsFreeze: boolean }[] = [
  { days: 3, bonusPoints: 30, grantsFreeze: false },
  { days: 7, bonusPoints: 75, grantsFreeze: true },
  { days: 14, bonusPoints: 150, grantsFreeze: true },
  { days: 30, bonusPoints: 400, grantsFreeze: true },
];

export function awardPoints(
  playerId: string,
  source: string,
  amount: number,
  meta?: Record<string, unknown>
) {
  if (amount === 0) return;
  db.insert(pointsLedger)
    .values({
      id: nanoid(),
      playerId,
      source,
      amount,
      meta: meta ? JSON.stringify(meta) : null,
    })
    .run();
}

export function getBalance(playerId: string): number {
  const result = db
    .select({ total: sql<number>`COALESCE(SUM(${pointsLedger.amount}), 0)` })
    .from(pointsLedger)
    .where(eq(pointsLedger.playerId, playerId))
    .get();
  return result?.total ?? 0;
}

export function getLedger(playerId: string, take = 20) {
  return db
    .select()
    .from(pointsLedger)
    .where(eq(pointsLedger.playerId, playerId))
    .orderBy(desc(pointsLedger.createdAt))
    .limit(take)
    .all();
}

/**
 * THE STREAK — ticks forward only when a player actually plays something
 * (a Run Up attempt, a Wheel spin, or a Naija Night School round), not
 * merely when they open the app. That distinction is deliberate: a streak
 * you can maintain by doing nothing isn't a habit loop, it's a vanity
 * counter. Call this from every route that represents a real play action;
 * it's idempotent per calendar day, so calling it twice in one day only
 * counts once and only pays the daily bonus once.
 *
 * One missed day is forgiven automatically if the player has a streak
 * freeze banked (see STREAK_MILESTONES) — exactly one freeze covers
 * exactly one missed day, the same rule Duolingo uses, chosen because it's
 * already a well-understood mental model rather than a new one to learn.
 * Two or more missed days always reset the streak; a freeze isn't meant
 * to make the streak unbreakable, just forgiving of a single bad day.
 */
export function recordDailyPlay(playerId: string): {
  streak: number;
  newlyExtended: boolean;
  freezeConsumed: boolean;
  milestonesHit: { days: number; bonusPoints: number; grantsFreeze: boolean }[];
} {
  const player = db.select().from(players).where(eq(players.id, playerId)).get();
  if (!player) return { streak: 0, newlyExtended: false, freezeConsumed: false, milestonesHit: [] };

  const today = new Date().toISOString().slice(0, 10);
  if (player.lastPlayDate === today) {
    return { streak: player.streak, newlyExtended: false, freezeConsumed: false, milestonesHit: [] };
  }

  let streak: number;
  let freezeConsumed = false;
  let freezesRemaining = player.streakFreezes;

  if (player.lastPlayDate) {
    const diffDays = Math.round(
      (new Date(today).getTime() - new Date(player.lastPlayDate).getTime()) / 86400000
    );
    if (diffDays === 1) {
      streak = player.streak + 1;
    } else if (diffDays === 2 && player.streakFreezes > 0) {
      streak = player.streak + 1; // the missed day is covered, streak continues as if unbroken
      freezeConsumed = true;
      freezesRemaining = player.streakFreezes - 1;
    } else {
      streak = 1;
    }
  } else {
    streak = 1;
  }

  // Milestones only ever fire on genuinely new ground, never on a streak
  // that's simply climbing back toward a peak it already reached before.
  const milestonesHit = STREAK_MILESTONES.filter((m) => streak >= m.days && player.longestStreak < m.days);
  const longestStreak = Math.max(player.longestStreak, streak);
  if (milestonesHit.some((m) => m.grantsFreeze)) {
    freezesRemaining += milestonesHit.filter((m) => m.grantsFreeze).length;
  }

  db.update(players)
    .set({ streak, lastPlayDate: today, longestStreak, streakFreezes: freezesRemaining })
    .where(eq(players.id, playerId))
    .run();

  awardPoints(playerId, "daily_streak", POINTS.DAILY_STREAK_BONUS, { streak, freezeConsumed });
  for (const m of milestonesHit) {
    awardPoints(playerId, "streak_milestone", m.bonusPoints, { days: m.days, grantsFreeze: m.grantsFreeze });
  }

  return { streak, newlyExtended: true, freezeConsumed, milestonesHit };
}
