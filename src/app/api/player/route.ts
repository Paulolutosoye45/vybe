import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { players, referralCodes, referralEvents } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { getBalance, getLedger, awardPoints, POINTS } from "@/lib/points";

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

  // Streak update happens on read — the first visit of a new calendar day
  // ticks the streak forward, exactly once, no client-side trust required.
  const today = new Date().toISOString().slice(0, 10);
  let streak = player.streak;
  if (player.lastVisitDate !== today) {
    const diffDays = Math.round(
      (new Date(today).getTime() - new Date(player.lastVisitDate).getTime()) / 86400000
    );
    streak = diffDays === 1 ? streak + 1 : 1;
    db.update(players).set({ streak, lastVisitDate: today }).where(eq(players.id, playerId)).run();
    if (streak >= 2) {
      awardPoints(playerId, "daily_streak", POINTS.DAILY_STREAK_BONUS, { streak });
    }
  }

  const balance = getBalance(playerId);
  const ledger = getLedger(playerId, 10);

  return NextResponse.json({
    firstName: player.firstName,
    queuePosition: player.queuePosition,
    referralCode: myCode?.code ?? "",
    referralCount,
    streak,
    balance,
    ledger,
  });
}
