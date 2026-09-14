import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { nanoid } from "nanoid";
import { db } from "@/lib/db";
import { players, referralCodes, referralEvents, globalAggregate } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { generateReferralCode } from "@/lib/gate";
import { awardPoints, POINTS } from "@/lib/points";

const WaitlistSchema = z.object({
  username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .max(20, "Username must be 20 characters or fewer")
    .regex(/^[a-zA-Z0-9_]+$/, "Letters, numbers and underscores only"),
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

  const existing = db.select().from(players).where(eq(players.email, data.email)).get();
  if (existing) {
    return NextResponse.json(
      { error: "This email is already on the list.", field: "email" },
      { status: 409 }
    );
  }

  const usernameTaken = db.select().from(players).where(eq(players.username, data.username)).get();
  if (usernameTaken) {
    return NextResponse.json(
      { error: "That username is already taken.", field: "username" },
      { status: 409 }
    );
  }

  // Resolve the referral code, if one was carried in the URL.
  let referredByCodeRecord = null;
  if (data.referredByCode) {
    referredByCodeRecord =
      db.select().from(referralCodes).where(eq(referralCodes.code, data.referredByCode)).get() ??
      null;
  }

  // Upsert-by-hand: SQLite here holds a single aggregate row keyed "singleton".
  let global = db.select().from(globalAggregate).where(eq(globalAggregate.id, "singleton")).get();
  if (!global) {
    global = { id: "singleton", totalSignups: 1, totalDistanceRunM: 0, totalRuns: 0, totalSpins: 0 };
    db.insert(globalAggregate).values(global).run();
  } else {
    global = { ...global, totalSignups: global.totalSignups + 1 };
    db.update(globalAggregate)
      .set({ totalSignups: global.totalSignups })
      .where(eq(globalAggregate.id, "singleton"))
      .run();
  }
  const queuePosition = global.totalSignups;

  const myCode = generateReferralCode();
  const myCodeId = nanoid();
  const playerId = nanoid();
  const today = new Date().toISOString().slice(0, 10);

  db.insert(referralCodes).values({ id: myCodeId, code: myCode }).run();
  db.insert(players)
    .values({
      id: playerId,
      username: data.username,
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      phone: data.phone,
      state: data.state,
      consentMarketing: data.consentMarketing,
      queuePosition,
      lastVisitDate: today,
      // streak intentionally omitted — defaults to 0. It only becomes 1 the
      // first time this player actually plays something (see recordDailyPlay
      // in points.ts), not just for signing up.
      referralCodeId: myCodeId,
      referredByCodeId: referredByCodeRecord?.id ?? null,
    })
    .run();

  awardPoints(playerId, "signup_bonus", POINTS.SIGNUP_BONUS);

  // Reward the referrer: one event per successful referral, fully auditable.
  if (referredByCodeRecord) {
    db.insert(referralEvents)
      .values({
        id: nanoid(),
        referralCodeId: referredByCodeRecord.id,
        newPlayerId: playerId,
        spotsAwarded: 10,
      })
      .run();

    const referrer = db
      .select()
      .from(players)
      .where(eq(players.referralCodeId, referredByCodeRecord.id))
      .get();
    if (referrer) {
      const newPosition = Math.max(1, referrer.queuePosition - 10);
      db.update(players)
        .set({ queuePosition: newPosition })
        .where(eq(players.id, referrer.id))
        .run();
      awardPoints(referrer.id, "referral_bonus", POINTS.REFERRAL_BONUS, { newPlayerId: playerId });

      // Referral tiers — a one-time bonus the moment the referrer's count
      // first reaches 3, 5, or 10. referralTier tracks the highest tier
      // already paid, so this fires exactly once per threshold even if
      // referrals keep coming in afterward.
      const totalReferrals = db
        .select()
        .from(referralEvents)
        .where(eq(referralEvents.referralCodeId, referredByCodeRecord.id))
        .all().length;
      const tierThresholds = Object.keys(POINTS.REFERRAL_TIER_BONUS).map(Number).sort((a, b) => a - b);
      for (const tier of tierThresholds) {
        if (totalReferrals === tier && referrer.referralTier < tier) {
          awardPoints(referrer.id, "referral_tier_bonus", POINTS.REFERRAL_TIER_BONUS[tier], { tier });
          db.update(players).set({ referralTier: tier }).where(eq(players.id, referrer.id)).run();
        }
      }
    }
  }

  return NextResponse.json({ playerId, username: data.username, queuePosition, referralCode: myCode });
}
