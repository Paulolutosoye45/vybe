import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { nanoid } from "nanoid";
import { db } from "@/lib/db";
import { players, gameSessions, globalAggregate, stateAggregate } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { awardPoints, POINTS } from "@/lib/points";
import { gateDistanceToday } from "@/lib/gate";

const ScoreSchema = z.object({
  playerId: z.string().min(1),
  game: z.literal("run-up"),
  distanceM: z.number().int().min(0).max(50000), // sanity ceiling — see note below
  stamps: z.number().int().min(0).max(500),
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
  const { playerId, distanceM, stamps } = parsed.data;

  const player = db.select().from(players).where(eq(players.id, playerId)).get();
  if (!player) {
    return NextResponse.json({ error: "Unknown player" }, { status: 404 });
  }

  // HONEST LIMITATION, stated here rather than hidden: this is still a
  // client-reported score with a generous sanity ceiling, not a
  // server-authoritative physics replay. That is the correct trade-off for
  // a teaser page, and it is exactly why points earned here are never wired
  // to anything regulated (queue position, cash value) — only to a
  // cosmetic/points balance. See the Teaser Blueprint, Part 5.11, for what
  // a full anti-cheat pass looks like if this game graduates past teaser
  // status into the real Play pillar.
  const gate = gateDistanceToday();
  const reachedGate = distanceM >= gate;

  const pointsEarned =
    Math.floor(distanceM / 10) * POINTS.RUN_UP_PER_10M +
    stamps * POINTS.RUN_UP_STAMP +
    (reachedGate ? POINTS.RUN_UP_GLIMPSE_BONUS : 0);

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

  awardPoints(playerId, "run_up", pointsEarned, { distanceM, stamps, reachedGate });

  return NextResponse.json({ pointsEarned, reachedGate, gateDistanceToday: gate });
}
