import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { nanoid } from "nanoid";
import { db } from "@/lib/db";
import { players, wheelSpins, globalAggregate } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { awardPoints, getBalance, POINTS } from "@/lib/points";

// Segment weights sum to 100. Server picks the winner — never trust a
// client-chosen "I landed on the jackpot" claim.
const SEGMENTS = [
  { label: "10 Points", value: 10, weight: 30 },
  { label: "25 Points", value: 25, weight: 25 },
  { label: "Try Again", value: 0, weight: 20 },
  { label: "50 Points", value: 50, weight: 12 },
  { label: "100 Points", value: 100, weight: 7 },
  { label: "Free Spin", value: 0, weight: 5, freeSpin: true },
  { label: "JACKPOT 500", value: 500, weight: 1 },
];

function pickSegment() {
  const total = SEGMENTS.reduce((s, seg) => s + seg.weight, 0);
  let r = Math.random() * total;
  for (const seg of SEGMENTS) {
    if (r < seg.weight) return seg;
    r -= seg.weight;
  }
  return SEGMENTS[0];
}

const SpinSchema = z.object({ playerId: z.string().min(1) });

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
  const parsed = SpinSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid player" }, { status: 422 });
  }
  const { playerId } = parsed.data;

  const player = db.select().from(players).where(eq(players.id, playerId)).get();
  if (!player) return NextResponse.json({ error: "Unknown player" }, { status: 404 });

  const balance = getBalance(playerId);
  if (balance < POINTS.WHEEL_SPIN_COST) {
    return NextResponse.json(
      { error: "Not enough points to spin.", balance, cost: POINTS.WHEEL_SPIN_COST },
      { status: 402 }
    );
  }

  const segment = pickSegment();

  db.insert(wheelSpins)
    .values({ id: nanoid(), playerId, segmentLabel: segment.label, pointsWon: segment.value })
    .run();

  const global = db.select().from(globalAggregate).where(eq(globalAggregate.id, "singleton")).get();
  if (!global) {
    db.insert(globalAggregate)
      .values({ id: "singleton", totalSignups: 0, totalDistanceRunM: 0, totalRuns: 0, totalSpins: 1 })
      .run();
  } else {
    db.update(globalAggregate)
      .set({ totalSpins: global.totalSpins + 1 })
      .where(eq(globalAggregate.id, "singleton"))
      .run();
  }

  awardPoints(playerId, "wheel_spin", -POINTS.WHEEL_SPIN_COST, { segment: segment.label });
  if (segment.value > 0) {
    awardPoints(playerId, "wheel_spin", segment.value, { segment: segment.label });
  }

  const newBalance = getBalance(playerId);
  const segmentIndex = SEGMENTS.findIndex((s) => s.label === segment.label);

  return NextResponse.json({
    segmentLabel: segment.label,
    segmentIndex,
    totalSegments: SEGMENTS.length,
    pointsWon: segment.value,
    freeSpin: "freeSpin" in segment ? segment.freeSpin : false,
    newBalance,
  });
}

export async function GET() {
  // Exposes the wheel's own segment list so the frontend never hardcodes
  // a second copy that could drift out of sync with the payout logic.
  return NextResponse.json({
    segments: SEGMENTS.map((s) => ({ label: s.label })),
    cost: POINTS.WHEEL_SPIN_COST,
  });
}
