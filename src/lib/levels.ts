/**
 * THE RUN UP — LEVEL DESIGN (30 LEVELS)
 *
 * Six zones of five levels each, telling the whole December journey arc —
 * not just five stops but the full one, starting from the decision to
 * travel home at all and ending at the gate itself. Every zone previews a
 * different real leg of that journey and carries its own real photograph
 * as a banner, shown on the level-up card and the level map — not a
 * gradient standing in for a place, an actual photo of the kind of moment
 * that level represents.
 *
 * Stamp types are the same four types already defined in the Passport
 * blueprint (Experience / State / Merchant / Culture) — the game hands
 * those out with intent per zone instead of at random, so a player who
 * later opens the real Passport recognises the currency.
 *
 * Star criteria, unchanged from the original five-level design, just
 * extended across all thirty — defined once here so client and server
 * (on /api/game-score) can never disagree:
 *   1 star — reached the end of the level's distance band in this run
 *   2 stars — collected at least STAR_STAMP_RATIO of the stamps that
 *             spawned while the player was inside that band
 *   3 stars — did both of the above AND took zero hits anywhere in the run
 *             up to and including that band (a clean run through it)
 *
 * Because this is a single continuous run — one hit ends the run — a
 * player naturally can't 3-star level 12 without also having been clean
 * through 1-11. Thirty levels makes that a much longer commitment than
 * five did, which is deliberate: most players will build up their stars
 * over many runs across many days, not clear the whole journey in one
 * sitting, and every bit of partial progress is saved permanently.
 *
 * A note on the banners: these are the real photographs supplied for this
 * project. I can't personally preview external images from inside this
 * environment (confirmed directly — both source domains are blocked from
 * this sandbox), so the specific zone each photo was assigned to is an
 * arbitrary but consistent 1-for-1 mapping, not a verified thematic match.
 * Swapping BANNERS below is a one-line change per zone if any pairing
 * doesn't actually fit once you can see them.
 */

export interface LevelDef {
  level: number;
  key: string;
  name: string;
  subtitle: string; // shown on the level-up card
  pillar: string; // which platform pillar this previews
  zoneKey: string;
  zoneName: string;
  zoneIndex: number; // 0-5, which of the six zones this level belongs to
  banner: string; // real photo URL, shown on the level-up card and level map
  distanceFrom: number;
  distanceTo: number | null; // null = endless (level 30, The Gate)
  stampType: "Experience" | "State" | "Merchant" | "Culture" | "Mixed";
  obstaclePool: ObstacleKind[];
  speedFrom: number;
  speedTo: number;
  palette: { sky: [string, string]; ground: string; accent: string };
}

export type ObstacleKind =
  | "trolley" | "banner" // Departure
  | "danfo" | "okada" // Homecoming
  | "pothole" | "steam" // The Rush
  | "crowd" | "speaker" // Owambe Street
  | "bouncer" | "rope" // Detty December
  | "confetti" | "drone"; // The Gate

const BANNERS = {
  departure: "https://decemberissavybe.com/wp-content/uploads/2025/11/faq-festival-background.webp",
  homecoming: "https://res.cloudinary.com/osuhw15i/image/upload/v1789191427/IMG_0776-scaled_sd9u00.webp",
  theRush: "https://res.cloudinary.com/osuhw15i/image/upload/v1789191427/IMG_3030-scaled_wv4mu5.webp",
  owambeStreet: "https://res.cloudinary.com/osuhw15i/image/upload/v1789191426/IMG_3031-scaled_uqitdm.webp",
  dettyDecember: "https://res.cloudinary.com/osuhw15i/image/upload/v1789191426/IMG_3029-scaled_yg53qm.webp",
  theGate: "https://res.cloudinary.com/osuhw15i/image/upload/v1789191426/IMG_0490-scaled_w73bu2.webp",
};

interface ZoneDef {
  key: string;
  name: string;
  pillar: string;
  banner: string;
  stampType: LevelDef["stampType"];
  obstaclePool: ObstacleKind[];
  palette: LevelDef["palette"];
  levelNames: [string, string, string, string, string];
  levelSubtitles: [string, string, string, string, string];
}

const ZONES: ZoneDef[] = [
  {
    key: "departure",
    name: "Departure",
    pillar: "Homecoming",
    banner: BANNERS.departure,
    stampType: "Experience",
    obstaclePool: ["trolley", "banner"],
    palette: { sky: ["#0a0e1c", "#1a2040"], ground: "#05070f", accent: "#3C64C8" },
    levelNames: ["Packing Day", "Last Call At The Gate", "Sixteen Hours In The Air", "Customs & Baggage Claim", "Arrivals Hall"],
    levelSubtitles: [
      "Everyone's suitcase is over the limit. Every year.",
      "Boarding group nobody remembers being assigned to.",
      "Somewhere over the Atlantic, already dreaming of jollof.",
      "One more form. One more queue. Almost out.",
      "The doors open. Lagos heat hits first.",
    ],
  },
  {
    key: "homecoming",
    name: "Homecoming",
    pillar: "Homecoming",
    banner: BANNERS.homecoming,
    stampType: "Experience",
    obstaclePool: ["trolley", "banner", "danfo", "okada"],
    palette: { sky: ["#0a1628", "#16264a"], ground: "#050b16", accent: "#2fb8e0" },
    levelNames: ["Welcome Committee", "The First Naira Spend", "Aunty's Compound", "Sunday Owambe Prep", "Market Run"],
    levelSubtitles: [
      "Half the family came to the airport. All of them are hungry.",
      "The exchange rate app comes out before the luggage does.",
      "Everyone has a story about how much you've grown.",
      "Aso-ebi fitting is not optional. It never was.",
      "Bariga or Balogun — everyone has a market opinion.",
    ],
  },
  {
    key: "the-rush",
    name: "The Rush",
    pillar: "The List",
    banner: BANNERS.theRush,
    stampType: "State",
    obstaclePool: ["trolley", "banner", "danfo", "okada", "pothole", "steam"],
    palette: { sky: ["#1a1408", "#3a2a12"], ground: "#0d0a04", accent: "#f0a23c" },
    levelNames: ["Third Mainland At Dawn", "Danfo Diplomacy", "Okada Weaving", "Pothole Alley", "Gridlock Gauntlet"],
    levelSubtitles: [
      "Leave before 6am or don't leave at all.",
      "Conductor's already hanging off the door, shouting the route.",
      "The fastest way through traffic isn't a car.",
      "Every driver in Lagos has memorised every crater personally.",
      "Third Mainland doesn't wait for anybody.",
    ],
  },
  {
    key: "owambe-street",
    name: "Owambe Street",
    pillar: "The Gate",
    banner: BANNERS.owambeStreet,
    stampType: "Merchant",
    obstaclePool: ["trolley", "banner", "danfo", "okada", "pothole", "steam", "crowd", "speaker"],
    palette: { sky: ["#1f0a1c", "#3a1230"], ground: "#0e0510", accent: "#e23a3a" },
    levelNames: ["Aso-Ebi Assembly", "The DJ Booth", "Jollof Smoke Line", "Small Chops Sprint", "Money Spray"],
    levelSubtitles: [
      "Matching gele, matching energy, zero exceptions.",
      "He's been on the mic since noon and he's not stopping.",
      "The smoke alone could feed a street.",
      "Puff-puff first. Questions later.",
      "The dance floor briefly becomes a snowstorm of naira.",
    ],
  },
  {
    key: "detty-december",
    name: "Detty December",
    pillar: "The Season",
    banner: BANNERS.dettyDecember,
    stampType: "Culture",
    obstaclePool: ["trolley", "banner", "danfo", "okada", "pothole", "steam", "crowd", "speaker", "bouncer", "rope"],
    palette: { sky: ["#050a1c", "#0e1a3a"], ground: "#040614", accent: "#7cc24a" },
    levelNames: ["VIP Rope Line", "The Bouncer's Gaze", "Confetti Cannon", "Afrobeats 'Til Dawn", "Last Train Home"],
    levelSubtitles: [
      "Everyone's out. The bouncer isn't impressed yet.",
      "He's heard every version of 'I know the owner.'",
      "Midnight hits and the whole room goes up at once.",
      "Nobody's checking the time anymore.",
      "The sun's coming up and somehow the party isn't over.",
    ],
  },
  {
    key: "the-gate",
    name: "The Gate",
    pillar: "The Gate",
    banner: BANNERS.theGate,
    stampType: "Mixed",
    obstaclePool: ["trolley", "banner", "danfo", "okada", "pothole", "steam", "crowd", "speaker", "bouncer", "rope", "confetti", "drone"],
    palette: { sky: ["#04101b", "#101b33"], ground: "#04070f", accent: "#2fb8e0" },
    levelNames: ["Final Approach", "The Last Stretch", "One More Stamp", "Almost There", "The Gate"],
    levelSubtitles: [
      "The whole month comes down to this stretch.",
      "Legs are tired. The Passport isn't full yet.",
      "One more, then one more after that.",
      "So close the gate's practically visible.",
      "Access Is The Vybe. Hold on as long as you can.",
    ],
  },
];

const LEVELS_PER_ZONE = 5;
const TOTAL_LEVELS = ZONES.length * LEVELS_PER_ZONE; // 30

function buildLevels(): LevelDef[] {
  const levels: LevelDef[] = [];
  let distanceCursor = 0;

  for (let zoneIndex = 0; zoneIndex < ZONES.length; zoneIndex++) {
    const zone = ZONES[zoneIndex];
    for (let i = 0; i < LEVELS_PER_ZONE; i++) {
      const level = zoneIndex * LEVELS_PER_ZONE + i + 1;
      const isFinalLevel = level === TOTAL_LEVELS;

      const bandSize = 320 + level * 14;
      const distanceFrom = distanceCursor;
      const distanceTo = isFinalLevel ? null : distanceFrom + bandSize;

      const speedFrom = 6.0 + (level - 1) * 0.58;
      const speedTo = speedFrom + 1.2;

      levels.push({
        level,
        key: `${zone.key}-${i + 1}`,
        name: zone.levelNames[i],
        subtitle: zone.levelSubtitles[i],
        pillar: zone.pillar,
        zoneKey: zone.key,
        zoneName: zone.name,
        zoneIndex,
        banner: zone.banner,
        distanceFrom,
        distanceTo,
        stampType: zone.stampType,
        obstaclePool: zone.obstaclePool,
        speedFrom,
        speedTo,
        palette: zone.palette,
      });

      if (distanceTo !== null) distanceCursor = distanceTo;
    }
  }
  return levels;
}

export const LEVELS: LevelDef[] = buildLevels();
export const ZONE_LIST = ZONES.map((z, i) => ({ key: z.key, name: z.name, banner: z.banner, zoneIndex: i }));

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
