import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { nanoid } from "nanoid";
import { db } from "@/lib/db";
import { players, triviaAttempts } from "@/lib/schema";
import { eq, and } from "drizzle-orm";
import { awardPoints, POINTS, recordDailyPlay } from "@/lib/points";
import { todaysTriviaRound, publicRound } from "@/lib/trivia";

export async function GET(req: NextRequest) {
  const playerId = req.nextUrl.searchParams.get("playerId");
  const round = todaysTriviaRound();
  const today = new Date().toISOString().slice(0, 10);

  let alreadyPlayed = false;
  let previousScore: number | null = null;
  if (playerId) {
    const attempt = db
      .select()
      .from(triviaAttempts)
      .where(and(eq(triviaAttempts.playerId, playerId), eq(triviaAttempts.date, today)))
      .get();
    if (attempt) {
      alreadyPlayed = true;
      previousScore = attempt.correctCount;
    }
  }

  return NextResponse.json({
    questions: publicRound(round),
    alreadyPlayed,
    previousScore,
  });
}

const SubmitSchema = z.object({
  playerId: z.string().min(1),
  answers: z.array(z.object({ questionId: z.string(), selectedIndex: z.number().int().min(0).max(3) })).length(5),
});

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
  const parsed = SubmitSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "playerId and exactly 5 answers are required" }, { status: 422 });
  }
  const { playerId, answers } = parsed.data;

  const player = db.select().from(players).where(eq(players.id, playerId)).get();
  if (!player) return NextResponse.json({ error: "Unknown player" }, { status: 404 });

  const today = new Date().toISOString().slice(0, 10);
  const existing = db
    .select()
    .from(triviaAttempts)
    .where(and(eq(triviaAttempts.playerId, playerId), eq(triviaAttempts.date, today)))
    .get();
  if (existing) {
    // Already scored today — return the standing result rather than a second
    // attempt, exactly like the daily challenge and the wheel's cost check.
    return NextResponse.json({
      correctCount: existing.correctCount,
      pointsEarned: 0,
      alreadyPlayed: true,
    });
  }

  const round = todaysTriviaRound();
  let correctCount = 0;
  for (const a of answers) {
    const q = round.find((r) => r.id === a.questionId);
    if (q && q.correctIndex === a.selectedIndex) correctCount++;
  }

  const pointsEarned =
    correctCount * POINTS.TRIVIA_PER_CORRECT + (correctCount === 5 ? POINTS.TRIVIA_PERFECT_BONUS : 0);

  db.insert(triviaAttempts).values({ id: nanoid(), playerId, date: today, correctCount, pointsEarned }).run();
  awardPoints(playerId, "trivia", pointsEarned, { correctCount });
  const streakResult = recordDailyPlay(playerId);

  return NextResponse.json({
    correctCount,
    pointsEarned,
    alreadyPlayed: false,
    correctAnswers: Object.fromEntries(round.map((q) => [q.id, q.correctIndex])),
    streak: streakResult.streak,
    streakNewlyExtended: streakResult.newlyExtended,
    freezeConsumed: streakResult.freezeConsumed,
    milestonesHit: streakResult.milestonesHit,
  });
}
