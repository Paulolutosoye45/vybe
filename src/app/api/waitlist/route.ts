import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { nanoid } from "nanoid";
import { db } from "@/lib/db";
import { players, referralCodes, referralEvents, globalAggregate } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { generateReferralCode } from "@/lib/gate";
import { awardPoints, POINTS } from "@/lib/points";

const WaitlistSchema = z.object({
  firstName: z.string().min(1, "First name is required").max(80),
  lastName: z.string().min(1, "Last name is required").max(80),
  email: z.string().email("Enter a valid email address"),
  phone: z.string().min(10, "Enter a valid phone number").max(20),
  state: z.string().min(1, "Select your state"),
  consentMarketing: z.boolean(),
  referredByCode: z.string().nullable().optional(),
});

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const parsed = WaitlistSchema.safeParse(body);
  if (!parsed.success) {
    const firstError = parsed.error.issues[0];
    return NextResponse.json(
      { error: firstError?.message ?? "Invalid input", field: firstError?.path?.[0] },
      { status: 422 }
    );
  }
  const data = parsed.data;

  const existing = (await db.select().from(players).where(eq(players.email, data.email)))[0];
  if (existing) {
    return NextResponse.json(
      { error: "This email is already on the list.", field: "email" },
      { status: 409 }
    );
  }

  // Resolve the referral code, if one was carried in the URL.
  let referredByCodeRecord = null;
  if (data.referredByCode) {
    referredByCodeRecord =
      (await db.select().from(referralCodes).where(eq(referralCodes.code, data.referredByCode)))[0] ??
      null;
  }

  // Upsert-by-hand: SQLite here holds a single aggregate row keyed "singleton".
  let global = (await db
    .select()
    .from(globalAggregate)
    .where(eq(globalAggregate.id, "singleton")))[0];
  if (!global) {
    global = { id: "singleton", totalSignups: 1, totalDistanceRunM: 0, totalRuns: 0, totalSpins: 0 };
    await db.insert(globalAggregate).values(global);
  } else {
    global = { ...global, totalSignups: global.totalSignups + 1 };
    await db.update(globalAggregate)
      .set({ totalSignups: global.totalSignups })
      .where(eq(globalAggregate.id, "singleton"));
  }
  const queuePosition = global.totalSignups;

  const myCode = generateReferralCode();
  const myCodeId = nanoid();
  const playerId = nanoid();
  const today = new Date().toISOString().slice(0, 10);

  await db.insert(referralCodes).values({ id: myCodeId, code: myCode });
  await db.insert(players)
    .values({
      id: playerId,
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      phone: data.phone,
      state: data.state,
      consentMarketing: data.consentMarketing,
      queuePosition,
      lastVisitDate: today,
      streak: 1,
      referralCodeId: myCodeId,
      referredByCodeId: referredByCodeRecord?.id ?? null,
    });

  awardPoints(playerId, "signup_bonus", POINTS.SIGNUP_BONUS);

  // Reward the referrer: one event per successful referral, fully auditable.
  if (referredByCodeRecord) {
    await db.insert(referralEvents)
      .values({
        id: nanoid(),
        referralCodeId: referredByCodeRecord.id,
        newPlayerId: playerId,
        spotsAwarded: 10,
      });

    const referrer = (
      await db
        .select()
        .from(players)
        .where(eq(players.referralCodeId, referredByCodeRecord.id))
    )[0];
    if (referrer) {
      const newPosition = Math.max(1, referrer.queuePosition - 10);
      await db.update(players)
        .set({ queuePosition: newPosition })
        .where(eq(players.id, referrer.id));
      awardPoints(referrer.id, "referral_bonus", POINTS.REFERRAL_BONUS, { newPlayerId: playerId });
    }
  }

  return NextResponse.json({ playerId, queuePosition, referralCode: myCode });
}
