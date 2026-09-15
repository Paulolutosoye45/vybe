import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { nanoid } from "nanoid";
import { db } from "@/lib/db";
import { players, gameSessions, globalAggregate, stateAggregate, levelProgress } from "@/lib/schema";
import { eq, and } from "drizzle-orm";
import { awardPoints, POINTS, recordDailyPlay } from "@/lib/points";
import { gateDistanceToday } from "@/lib/gate";
import { todaysRunUpChallenge, DIFFICULTY_BONUS } from "@/lib/dailyChallenge";
import { LEVELS } from "@/lib/levels";

const LevelResultSchema = z.object({
  level: z.number().int().min(1).max(LEVELS.length),
  stars: z.number().int().min(0).max(3),
  distanceReached: z.number().int().min(0).max(50000),
});

const ScoreSchema = z.object({
  playerId: z.string().min(1),
  game: z.literal("run-up"),
  distanceM: z.number().int().min(0).max(50000), // sanity ceiling — see note below
  stamps: z.number().int().min(0).max(1000),
  stampPoints: z.number().int().min(0).max(20000), // combo-multiplied, see note below
  levelResults: z.array(LevelResultSchema).max(LEVELS.length),
});

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
  const parsed = ScoreSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 422 });
  }
  const { playerId, distanceM, stamps, stampPoints, levelResults } = parsed.data;

  const player = db.select().from(players).where(eq(players.id, playerId)).get();
  if (!player) {
    return NextResponse.json({ error: "Unknown player" }, { status: 404 });
  }

  // HONEST LIMITATION, stated here rather than hidden: this is still a
  // client-reported score with a generous sanity ceiling, not a
  // server-authoritative physics replay. Stars and the combo-multiplied
  // stampPoints are computed client-side, the same trust boundary the
  // distance/stamps fields already had — which is exactly why none of
  // this is wired to anything regulated (queue position, cash value),
  // only to a cosmetic points balance and a level map. See the Teaser
  // Blueprint, Part 5.11, for what a full anti-cheat pass needs if this
  // game graduates past teaser status into the real Play pillar.
  const gate = gateDistanceToday();
  const reachedGate = distanceM >= gate;

  // Sanity: stampPoints can't exceed what the highest combo tier times
  // every stamp collected would produce. Doesn't prove honesty, catches
  // the obviously-impossible.
  const maxPlausibleStampPoints = stamps * POINTS.RUN_UP_STAMP_BASE * 3;
  const safeStampPoints = Math.min(stampPoints, maxPlausibleStampPoints);

  // ---- upsert level progress, only awarding star-bonus points for a
  // genuine improvement over the player's previous best on that level ----
  let starBonusPoints = 0;
  const now = new Date().toISOString();
  for (const lr of levelResults) {
    const existing = db
      .select()
      .from(levelProgress)
      .where(and(eq(levelProgress.playerId, playerId), eq(levelProgress.level, lr.level)))
      .get();

    if (!existing) {
      db.insert(levelProgress)
        .values({
          id: nanoid(),
          playerId,
          level: lr.level,
          stars: lr.stars,
          bestDistanceM: lr.distanceReached,
          reachedAt: now,
          updatedAt: now,
        })
        .run();
      starBonusPoints += lr.stars * POINTS.RUN_UP_STAR_BONUS;
    } else if (lr.stars > existing.stars || lr.distanceReached > existing.bestDistanceM) {
      const newStarBonus = Math.max(0, lr.stars - existing.stars);
      starBonusPoints += newStarBonus * POINTS.RUN_UP_STAR_BONUS;
      db.update(levelProgress)
        .set({
          stars: Math.max(existing.stars, lr.stars),
          bestDistanceM: Math.max(existing.bestDistanceM, lr.distanceReached),
          updatedAt: now,
        })
        .where(and(eq(levelProgress.playerId, playerId), eq(levelProgress.level, lr.level)))
        .run();
    }
  }

  // ---- Daily Vybe Challenge — same challenge for everyone, rotates by
  // date, checked from this run's own data, awarded at most once per day ----
  const today = now.slice(0, 10);
  const challenge = todaysRunUpChallenge();
  const satisfiesToday = challenge.check({ levelResults, stamps, reachedGate });
  const alreadyCompletedToday = player.dailyChallengeDate === today;
  const dailyChallengeNewlyCompleted = satisfiesToday && !alreadyCompletedToday;
  if (dailyChallengeNewlyCompleted) {
    db.update(players).set({ dailyChallengeDate: today }).where(eq(players.id, playerId)).run();
  }

  const pointsEarned =
    Math.floor(distanceM / 10) * POINTS.RUN_UP_PER_10M +
    safeStampPoints +
    starBonusPoints +
    (reachedGate ? POINTS.RUN_UP_GLIMPSE_BONUS : 0) +
    (dailyChallengeNewlyCompleted ? DIFFICULTY_BONUS[challenge.difficulty] : 0);

  db.insert(gameSessions)
    .values({ id: nanoid(), playerId, game: "run-up", distanceM, stamps, reachedGate, pointsEarned })
    .run();

  let global = db.select().from(globalAggregate).where(eq(globalAggregate.id, "singleton")).get();
  if (!global) {
    db.insert(globalAggregate)
      .values({ id: "singleton", totalSignups: 0, totalDistanceRunM: distanceM, totalRuns: 1, totalSpins: 0 })
      .run();
  } else {
    db.update(globalAggregate)
      .set({ totalDistanceRunM: global.totalDistanceRunM + distanceM, totalRuns: global.totalRuns + 1 })
      .where(eq(globalAggregate.id, "singleton"))
      .run();
  }

  const stateRow = db.select().from(stateAggregate).where(eq(stateAggregate.state, player.state)).get();
  if (!stateRow) {
    db.insert(stateAggregate).values({ state: player.state, totalDistanceM: distanceM, totalRuns: 1 }).run();
  } else {
    db.update(stateAggregate)
      .set({ totalDistanceM: stateRow.totalDistanceM + distanceM, totalRuns: stateRow.totalRuns + 1 })
      .where(eq(stateAggregate.state, player.state))
      .run();
  }

  awardPoints(playerId, "run_up", pointsEarned, {
    distanceM, stamps, reachedGate, starBonusPoints, dailyChallengeNewlyCompleted,
  });
  const streakResult = recordDailyPlay(playerId);

  const updatedLevelProgress = db
    .select()
    .from(levelProgress)
    .where(eq(levelProgress.playerId, playerId))
    .all();

  return NextResponse.json({
    pointsEarned,
    reachedGate,
    gateDistanceToday: gate,
    starBonusPoints,
    levelProgress: updatedLevelProgress,
    dailyChallenge: { label: challenge.label, difficulty: challenge.difficulty, bonus: DIFFICULTY_BONUS[challenge.difficulty], satisfiedToday: satisfiesToday || alreadyCompletedToday, newlyCompleted: dailyChallengeNewlyCompleted },
    streak: streakResult.streak,
    streakNewlyExtended: streakResult.newlyExtended,
    freezeConsumed: streakResult.freezeConsumed,
    milestonesHit: streakResult.milestonesHit,
  });
}
