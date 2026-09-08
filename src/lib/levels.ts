/**
 * THE RUN UP — LEVEL DESIGN
 *
 * Five bands of distance, each a real leg of the Nigerian December journey,
 * each mapped to one of the platform's own five pillars so the game is a
 * playable preview of the Hub, not a generic runner with a paint job.
 *
 * Stamp types are the same four types already defined in the Passport
 * blueprint (Experience / State / Merchant / Culture) — the game hands
 * those out with intent per level instead of at random, so a player who
 * later opens the real Passport recognises the currency.
 *
 * Star criteria, defined once here so the client (rendering) and the
 * server (scoring, on /api/game-score) can never disagree:
 *   1 star — reached the end of the level's distance band in this run
 *   2 stars — collected at least STAR_STAMP_RATIO of the stamps that
 *             spawned while the player was inside that band
 *   3 stars — did both of the above AND took zero hits anywhere in the run
 *             up to and including that band (a clean run through it)
 *
 * Because this is a single continuous run — one hit ends the run — a
 * player naturally can't 3-star Level 4 without also having been clean
 * through 1-3. That's intentional: it makes going back to replay and
 * clean up an early level's star rating a real, motivated choice, not
 * a formality.
 */

export interface LevelDef {
  level: number;
  key: string;
  name: string;
  subtitle: string; // shown on the level-up card
  pillar: string; // which platform pillar this previews
  distanceFrom: number;
  distanceTo: number | null; // null = endless (Level 5, The Gate)
  stampType: "Experience" | "State" | "Merchant" | "Culture" | "Mixed";
  obstaclePool: ObstacleKind[];
  speedFrom: number;
  speedTo: number;
  palette: { sky: [string, string]; ground: string; accent: string };
}

export type ObstacleKind =
  | "trolley" | "banner" // Level 1
  | "danfo" | "okada" | "pothole" // Level 2
  | "steam" | "crowd" | "speaker" // Level 3
  | "bouncer" | "rope" | "confetti" // Level 4
  | "drone"; // Level 5 extra

export const LEVELS: LevelDef[] = [
  {
    level: 1,
    key: "homecoming",
    name: "Homecoming",
    subtitle: "The journey starts at arrivals.",
    pillar: "Homecoming",
    distanceFrom: 0,
    distanceTo: 400,
    stampType: "Experience",
    obstaclePool: ["trolley", "banner"],
    speedFrom: 6.0,
    speedTo: 7.2,
    palette: { sky: ["#0a1628", "#16264a"], ground: "#050b16", accent: "#2fb8e0" },
  },
  {
    level: 2,
    key: "the-rush",
    name: "The Rush",
    subtitle: "Third Mainland doesn't wait for anybody.",
    pillar: "The List",
    distanceFrom: 400,
    distanceTo: 900,
    stampType: "State",
    obstaclePool: ["danfo", "okada", "pothole", "banner"],
    speedFrom: 7.2,
    speedTo: 9.2,
    palette: { sky: ["#1a1408", "#3a2a12"], ground: "#0d0a04", accent: "#f0a23c" },
  },
  {
    level: 3,
    key: "owambe-street",
    name: "Owambe Street",
    subtitle: "Aso-ebi, jollof smoke, and a DJ who won't stop.",
    pillar: "The Gate",
    distanceFrom: 900,
    distanceTo: 1600,
    stampType: "Merchant",
    obstaclePool: ["steam", "crowd", "speaker", "danfo"],
    speedFrom: 9.2, 
    speedTo: 11.4,
    palette: { sky: ["#1f0a1c", "#3a1230"], ground: "#0e0510", accent: "#e23a3a" },
  },
  {
    level: 4,
    key: "detty-december",
    name: "Detty December",
    subtitle: "Everyone's out. The bouncer isn't impressed yet.",
    pillar: "The Season",
    distanceFrom: 1600,
    distanceTo: 2600,
    stampType: "Culture",
    obstaclePool: ["bouncer", "rope", "confetti", "crowd", "speaker"],
    speedFrom: 11.4,
    speedTo: 14.0,
    palette: { sky: ["#050a1c", "#0e1a3a"], ground: "#040614", accent: "#7cc24a" },
  },
  {
    level: 5,
    key: "the-gate",
    name: "The Gate",
    subtitle: "Access Is The Vybe. Hold on as long as you can.",
    pillar: "The Gate",
    distanceFrom: 2600,
    distanceTo: null,
    stampType: "Mixed",
    obstaclePool: ["trolley", "danfo", "okada", "pothole", "steam", "crowd", "speaker", "bouncer", "rope", "drone"],
    speedFrom: 14.0,
    speedTo: 17.0,
    palette: { sky: ["#04101b", "#101b33"], ground: "#04070f", accent: "#2fb8e0" },
  },
];

export const STAR_STAMP_RATIO = 0.6;

export function levelForDistance(distM: number): LevelDef {
  for (const l of LEVELS) {
    if (l.distanceTo === null || distM < l.distanceTo) return l;
  }
  return LEVELS[LEVELS.length - 1];
}

export function levelBandOf(level: number): LevelDef {
  return LEVELS.find((l) => l.level === level) ?? LEVELS[0];
}
