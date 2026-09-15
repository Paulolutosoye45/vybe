/**
 * DAILY CHALLENGES — one per game, the same for everyone, rotating
 * deterministically by day-of-year so none of this needs scheduling
 * infrastructure. Every challenge now carries a difficulty tier, and the
 * bonus paid scales with it — a flat bonus regardless of how hard that
 * day's specific challenge is undersold the harder ones and oversold the
 * easy ones, so difficulty is now a real input to the reward, not just a
 * label.
 *
 * The Run Up challenges below reference the current 30-level, six-zone
 * structure in src/lib/levels.ts (Departure 1-5, Homecoming 6-10, The Rush
 * 11-15, Owambe Street 16-20, Detty December 21-25, The Gate 26-30) — an
 * earlier version of this file was written against the original 5-level
 * design and still labelled level 2 as "The Rush", which hasn't been true
 * since the level system was expanded. Fixed here.
 */

export type Difficulty = "easy" | "medium" | "hard";

export const DIFFICULTY_BONUS: Record<Difficulty, number> = {
  easy: 25,
  medium: 40,
  hard: 65,
};

function dayIndex(date: Date, poolSize: number): number {
  const start = new Date(date.getFullYear(), 0, 0);
  const diff = date.getTime() - start.getTime();
  const dayOfYear = Math.floor(diff / 86400000);
  return dayOfYear % poolSize;
}

// ============================================================================
// RUN UP
// ============================================================================
export interface RunUpChallenge {
  id: string;
  label: string;
  difficulty: Difficulty;
  check: (r: { levelResults: { level: number; stars: number }[]; stamps: number; reachedGate: boolean }) => boolean;
}

export const RUN_UP_CHALLENGES: RunUpChallenge[] = [
  { id: "collect-12", label: "Collect 12 stamps in one run", difficulty: "easy", check: (r) => r.stamps >= 12 },
  { id: "three-star-packing-day", label: "3-star Packing Day (Level 1)", difficulty: "easy", check: (r) => r.levelResults.some((l) => l.level === 1 && l.stars === 3) },
  { id: "reach-homecoming", label: "Reach Homecoming (Level 6)", difficulty: "medium", check: (r) => r.levelResults.some((l) => l.level >= 6) },
  { id: "reach-the-rush", label: "Reach The Rush (Level 11)", difficulty: "medium", check: (r) => r.levelResults.some((l) => l.level >= 11) },
  { id: "reach-owambe-street", label: "Reach Owambe Street (Level 16)", difficulty: "hard", check: (r) => r.levelResults.some((l) => l.level >= 16) },
  { id: "see-the-glimpse", label: "See The Glimpse — reach today's gate", difficulty: "hard", check: (r) => r.reachedGate },
];

export function todaysRunUpChallenge(date = new Date()): RunUpChallenge {
  return RUN_UP_CHALLENGES[dayIndex(date, RUN_UP_CHALLENGES.length)];
}

// ============================================================================
// THE VYBE WHEEL — daily challenges here are about participation, not a
// lucky outcome (the wheel has no skill dimension, so rewarding a specific
// prize landing would just be rewarding luck). Difficulty instead scales
// with how many spins that day's challenge asks for — each spin costs
// points, so a harder challenge is a genuine bigger commitment, not just a
// bigger number.
// ============================================================================
export interface WheelChallenge {
  id: string;
  label: string;
  difficulty: Difficulty;
  spinsRequired: number;
}

export const WHEEL_CHALLENGES: WheelChallenge[] = [
  { id: "spin-once", label: "Spin the Wheel once today", difficulty: "easy", spinsRequired: 1 },
  { id: "spin-twice", label: "Spin the Wheel twice today", difficulty: "easy", spinsRequired: 2 },
  { id: "spin-thrice", label: "Spin the Wheel 3 times today", difficulty: "medium", spinsRequired: 3 },
  { id: "spin-four", label: "Spin the Wheel 4 times today", difficulty: "medium", spinsRequired: 4 },
  { id: "spin-five", label: "Spin the Wheel 5 times today", difficulty: "hard", spinsRequired: 5 },
];

export function todaysWheelChallenge(date = new Date()): WheelChallenge {
  return WHEEL_CHALLENGES[dayIndex(date, WHEEL_CHALLENGES.length)];
}

// ============================================================================
// NAIJA NIGHT SCHOOL — difficulty scales with the score threshold that
// day's challenge asks for, out of the same 5-question round everyone
// already plays.
// ============================================================================
export interface TriviaChallenge {
  id: string;
  label: string;
  difficulty: Difficulty;
  minCorrect: number;
}

export const TRIVIA_CHALLENGES: TriviaChallenge[] = [
  { id: "play-tonight", label: "Play tonight's round", difficulty: "easy", minCorrect: 0 },
  { id: "score-two", label: "Score at least 2 out of 5", difficulty: "easy", minCorrect: 2 },
  { id: "score-three", label: "Score at least 3 out of 5", difficulty: "medium", minCorrect: 3 },
  { id: "score-four", label: "Score at least 4 out of 5", difficulty: "medium", minCorrect: 4 },
  { id: "score-perfect", label: "Score a perfect 5 out of 5", difficulty: "hard", minCorrect: 5 },
];

export function todaysTriviaChallenge(date = new Date()): TriviaChallenge {
  return TRIVIA_CHALLENGES[dayIndex(date, TRIVIA_CHALLENGES.length)];
}
