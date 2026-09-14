// ============================================================================
// BLUUTV — sister platform to Vybe Hub, also a FirstBank property. Real
// YouTube videos, not stock content: the trailer and all ten episodes of
// BluuTV's current thriller series, supplied directly for this feature.
//
// Videos stay hosted on YouTube (nothing re-uploaded, no rights question) —
// what this file drives is an *embedded*, in-app viewing experience via
// YouTube's standard iframe embed, so a signed-up player never has to leave
// the teaser to watch. Thumbnails come straight from YouTube's public
// img.youtube.com CDN, which needs no API key and no auth.
// ============================================================================

export interface BluuTVVideo {
  id: string; // internal id, stable even if a youtubeId ever needs swapping
  youtubeId: string;
  title: string;
  kind: "trailer" | "episode";
  episodeNumber?: number;
  isFinale?: boolean;
}

export const BLUUTV_VIDEOS: BluuTVVideo[] = [
  { id: "trailer", youtubeId: "-wVk4g8B2KU", title: "Official Trailer", kind: "trailer" },
  { id: "ep-1", youtubeId: "QrsMquHOWwU", title: "Episode 1", kind: "episode", episodeNumber: 1 },
  { id: "ep-2", youtubeId: "Dj-1aiwYVkQ", title: "Episode 2", kind: "episode", episodeNumber: 2 },
  { id: "ep-3", youtubeId: "x9dfNI1BDYw", title: "Episode 3", kind: "episode", episodeNumber: 3 },
  { id: "ep-4", youtubeId: "QUpOco-7LCE", title: "Episode 4", kind: "episode", episodeNumber: 4 },
  { id: "ep-5", youtubeId: "LYbj0eK69e4", title: "Episode 5", kind: "episode", episodeNumber: 5 },
  { id: "ep-6", youtubeId: "Ayzqqb2r6cA", title: "Episode 6", kind: "episode", episodeNumber: 6 },
  { id: "ep-7", youtubeId: "VTMEe2PH4BI", title: "Episode 7", kind: "episode", episodeNumber: 7 },
  { id: "ep-8", youtubeId: "rR_a7nhoLTc", title: "Episode 8", kind: "episode", episodeNumber: 8 },
  { id: "ep-9", youtubeId: "Nh9EAIJmIB8", title: "Episode 9", kind: "episode", episodeNumber: 9 },
  { id: "ep-10", youtubeId: "Bo3Xv1A2HJY", title: "Episode 10", kind: "episode", episodeNumber: 10, isFinale: true },
];

export function thumbnailUrl(youtubeId: string): string {
  return `https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg`;
}

export function embedUrl(youtubeId: string): string {
  return `https://www.youtube.com/embed/${youtubeId}?autoplay=1&rel=0`;
}

export function watchUrl(youtubeId: string): string {
  return `https://www.youtube.com/watch?v=${youtubeId}`;
}

export const BLUUTV_BLURB =
  "Dive into a world where African entertainment takes the centre stage — exclusive " +
  "content spanning lifestyle, trending gists, tech and sports. Proudly brought to you " +
  "by FirstBank, BLUU TV unleashes the vibrant, youthful side of life. A community that " +
  "celebrates creativity and innovation, serenading you with maximum entertainment — and " +
  "we want you in it.";

export const BLUUTV_CHANNEL_URL = "https://www.youtube.com/@Bluutv894";
