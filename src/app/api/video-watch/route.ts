import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { nanoid } from "nanoid";
import { db } from "@/lib/db";
import { players, videoWatches } from "@/lib/schema";
import { eq, and } from "drizzle-orm";
import { awardPoints, POINTS } from "@/lib/points";
import { BLUUTV_VIDEOS } from "@/lib/bluutv";

const TOTAL_EPISODES = BLUUTV_VIDEOS.filter((v) => v.kind === "episode").length;

const WatchSchema = z.object({
  playerId: z.string().min(1),
  videoId: z.string().min(1),
});

// The gate itself: no playerId, no record, no bonus. The frontend also
// hides playback behind a signup prompt, but that's a UX nicety — this
// check is the real boundary, since a client can always be bypassed.
export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
  const parsed = WatchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "playerId and videoId are required" }, { status: 422 });
  }
  const { playerId, videoId } = parsed.data;

  const player = db.select().from(players).where(eq(players.id, playerId)).get();
  if (!player) {
    return NextResponse.json({ error: "Sign up to watch BluuTV in the app." }, { status: 403 });
  }
  if (!BLUUTV_VIDEOS.some((v) => v.id === videoId)) {
    return NextResponse.json({ error: "Unknown video" }, { status: 404 });
  }

  const existing = db
    .select()
    .from(videoWatches)
    .where(and(eq(videoWatches.playerId, playerId), eq(videoWatches.videoId, videoId)))
    .get();

  let pointsEarned = 0;
  if (!existing) {
    db.insert(videoWatches).values({ id: nanoid(), playerId, videoId }).run();
    pointsEarned = POINTS.VIDEO_FIRST_WATCH_BONUS;
    awardPoints(playerId, "video_watch", pointsEarned, { videoId });
  }

  const watchedVideoIds = db
    .select({ videoId: videoWatches.videoId })
    .from(videoWatches)
    .where(eq(videoWatches.playerId, playerId))
    .all()
    .map((w) => w.videoId);

  // Series completion — all ten episodes (the trailer doesn't count toward
  // this), awarded exactly once per player, checked via the same boolean
  // flag pattern as the referral tiers below rather than re-scanning the
  // ledger for a past award every time.
  let seriesJustCompleted = false;
  if (!player.bluutvSeriesCompleted) {
    const watchedEpisodeCount = BLUUTV_VIDEOS.filter(
      (v) => v.kind === "episode" && watchedVideoIds.includes(v.id)
    ).length;
    if (watchedEpisodeCount >= TOTAL_EPISODES) {
      db.update(players).set({ bluutvSeriesCompleted: true }).where(eq(players.id, playerId)).run();
      awardPoints(playerId, "bluutv_series_complete", POINTS.VIDEO_SERIES_COMPLETE_BONUS);
      pointsEarned += POINTS.VIDEO_SERIES_COMPLETE_BONUS;
      seriesJustCompleted = true;
    }
  }

  return NextResponse.json({ pointsEarned, alreadyWatched: !!existing, watchedVideoIds, seriesJustCompleted, totalEpisodes: TOTAL_EPISODES });
}
