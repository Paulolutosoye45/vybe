/**
 * THE DAILY VYBE CHALLENGE
 *
 * One challenge per day, the same for everyone, rotating deterministically
 * by day-of-year so it needs no scheduling infrastructure — today's
 * challenge is just a function of today's date.
 *
 * Every challenge is checkable from the data a single run already produces
 * (levelResults, stamps, reachedGate). Nothing here requires aggregating
 * across multiple sessions in a day, which keeps the server-side check a
 * plain function instead of a second query path.
 */

export interface DailyChallenge {
  id: string;
  label: string;
  check: (r: { levelResults: { level: number; stars: number }[]; stamps: number; reachedGate: boolean }) => boolean;
}

export const DAILY_CHALLENGES: DailyChallenge[] = [
  {
    id: "reach-rush",
    label: "Reach The Rush",
    check: (r) => r.levelResults.some((l) => l.level >= 2),
  },
  {
    id: "reach-owambe",
    label: "Reach Owambe Street",
    check: (r) => r.levelResults.some((l) => l.level >= 3),
  },
  {
    id: "collect-12",
    label: "Collect 12 stamps in one run",
    check: (r) => r.stamps >= 12,
  },
  {
    id: "three-star-homecoming",
    label: "3-star Homecoming",
    check: (r) => r.levelResults.some((l) => l.level === 1 && l.stars === 3),
  },
  {
    id: "see-the-glimpse",
    label: "See The Glimpse — reach today's gate",
    check: (r) => r.reachedGate,
  },
];

export const DAILY_CHALLENGE_BONUS = 40;

export function todaysChallenge(date = new Date()): DailyChallenge {
  const start = new Date(date.getFullYear(), 0, 0);
  const diff = date.getTime() - start.getTime();
  const dayOfYear = Math.floor(diff / 86400000);
  return DAILY_CHALLENGES[dayOfYear % DAILY_CHALLENGES.length];
}
