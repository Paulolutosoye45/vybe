import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { players, levelProgress, gameSessions } from "@/lib/schema";
import { eq, sql, desc } from "drizzle-orm";

/**
 * Ranked by total stars across all thirty levels (0–90) — this rewards
 * genuine skill and completion, not just a lucky single long run. Best
 * distance is shown as a secondary stat. Shows each player's chosen
 * username, never their real name — the leaderboard is public, a real
 * name isn't needed for it to be competitive.
 */
export async function GET(req: NextRequest) {
  const playerId = req.nextUrl.searchParams.get("playerId");

  const ranked = db
    .select({
      playerId: players.id,
      username: players.username,
      state: players.state,
      streak: players.streak,
      totalStars: sql<number>`COALESCE(SUM(${levelProgress.stars}), 0)`.as("total_stars"),
    })
    .from(players)
    .leftJoin(levelProgress, eq(levelProgress.playerId, players.id))
    .groupBy(players.id)
    .orderBy(desc(sql`COALESCE(SUM(${levelProgress.stars}), 0)`))
    .all();

  // best distance per player, merged in from a separate aggregate query —
  // simpler and plenty fast at this scale than a multi-aggregate join.
  const bestDistances = db
    .select({
      playerId: gameSessions.playerId,
      bestDistanceM: sql<number>`MAX(${gameSessions.distanceM})`.as("best_distance"),
    })
    .from(gameSessions)
    .groupBy(gameSessions.playerId)
    .all();
  const distanceMap = new Map(bestDistances.map((d) => [d.playerId, d.bestDistanceM]));

  const withDistance = ranked.map((r) => ({
    ...r,
    bestDistanceM: distanceMap.get(r.playerId) ?? 0,
  }));

  const top = withDistance.slice(0, 10);
  let you: (typeof withDistance)[number] & { rank: number } | null = null;
  if (playerId) {
    const idx = withDistance.findIndex((r) => r.playerId === playerId);
    if (idx >= 0) you = { ...withDistance[idx], rank: idx + 1 };
  }

  return NextResponse.json({
    top: top.map((r, i) => ({ rank: i + 1, username: r.username, state: r.state, totalStars: r.totalStars, bestDistanceM: r.bestDistanceM, streak: r.streak })),
    you: you && you.rank > 10 ? you : null, // omit if already visible in top 10
  });
}
