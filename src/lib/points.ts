import { db } from "@/lib/db";
import { pointsLedger } from "@/lib/schema";
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
  RUN_UP_STAMP: 5,
  RUN_UP_GLIMPSE_BONUS: 50,
  WHEEL_SPIN_COST: 20,
  DAILY_STREAK_BONUS: 10,
  REFERRAL_BONUS: 150,
} as const;

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
    .execute();
}

export async function getBalance(playerId: string): Promise<number> {
  const result = await db
    .select({ total: sql<number>`COALESCE(SUM(${pointsLedger.amount}), 0)`.as("total") })
    .from(pointsLedger)
    .where(eq(pointsLedger.playerId, playerId))
    .execute();
  return result[0]?.total ?? 0;
}

export function getLedger(playerId: string, take = 20) {
  return db
    .select()
    .from(pointsLedger)
    .where(eq(pointsLedger.playerId, playerId))
    .orderBy(desc(pointsLedger.createdAt))
    .limit(take)
    .execute();
}
