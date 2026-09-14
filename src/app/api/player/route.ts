import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { players, referralCodes, referralEvents, levelProgress, videoWatches } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { getBalance, getLedger } from "@/lib/points";

export async function GET(req: NextRequest) {
  const playerId = req.nextUrl.searchParams.get("playerId");
  if (!playerId) return NextResponse.json({ error: "playerId is required" }, { status: 400 });

  const player = db.select().from(players).where(eq(players.id, playerId)).get();
  if (!player) return NextResponse.json({ error: "Unknown player" }, { status: 404 });

  const myCode = db
    .select()
    .from(referralCodes)
    .where(eq(referralCodes.id, player.referralCodeId))
    .get();
  const referralCount = myCode
    ? db.select().from(referralEvents).where(eq(referralEvents.referralCodeId, myCode.id)).all().length
    : 0;

  // Streak is no longer touched here — it only advances from an actual play
  // action (see recordDailyPlay in points.ts, called from game-score and
  // wheel-spin). This route just reports current status, including whether
  // today's play has already happened, so the UI can say "play today to
  // keep your streak" versus "you're set for today" honestly.
  const today = new Date().toISOString().slice(0, 10);
  const playedToday = player.lastPlayDate === today;
  const streak = player.streak;

  // lastVisitDate stays a simple, honest "last time they opened the app"
  // marker — separate from the streak, updated here with no point/streak
  // side effects, since that distinction is the whole point of the rework.
  if (player.lastVisitDate !== today) {
    db.update(players).set({ lastVisitDate: today }).where(eq(players.id, playerId)).run();
  }

  const balance = getBalance(playerId);
  const ledger = getLedger(playerId, 10);
  const levels = db.select().from(levelProgress).where(eq(levelProgress.playerId, playerId)).all();
  const watchedVideoIds = db
    .select({ videoId: videoWatches.videoId })
    .from(videoWatches)
    .where(eq(videoWatches.playerId, playerId))
    .all()
    .map((w) => w.videoId);

  return NextResponse.json({
    firstName: player.firstName,
    username: player.username,
    queuePosition: player.queuePosition,
    referralCode: myCode?.code ?? "",
    referralCount,
    referralTier: player.referralTier,
    streak,
    playedToday,
    streakFreezes: player.streakFreezes,
    longestStreak: player.longestStreak,
    balance,
    ledger,
    levelProgress: levels,
    watchedVideoIds,
    bluutvSeriesCompleted: player.bluutvSeriesCompleted,
  });
}
