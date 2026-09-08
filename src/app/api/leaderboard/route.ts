import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { globalAggregate, stateAggregate } from "@/lib/schema";
import { eq, desc } from "drizzle-orm";

export async function GET() {
  const [global] = await db
    .select()
    .from(globalAggregate)
    .where(eq(globalAggregate.id, "singleton"))
    .limit(1);
  const states = await db
    .select()
    .from(stateAggregate)
    .orderBy(desc(stateAggregate.totalDistanceM))
    .limit(8);

  return NextResponse.json({
    global: global ?? { totalSignups: 0, totalDistanceRunM: 0, totalRuns: 0, totalSpins: 0 },
    states,
  });
}
