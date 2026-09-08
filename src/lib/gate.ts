import { customAlphabet } from "nanoid";

// Excludes ambiguous characters (0/O, 1/I/L) — codes get typed and read aloud.
const generateSuffix = customAlphabet("ABCDEFGHJKMNPQRSTUVWXYZ23456789", 5);

export function generateReferralCode(): string {
  return `VYBE-${generateSuffix()}`;
}

/**
 * The daily gate — recomputed on the server so the client can never spoof it.
 * See the marketing brain (Passport blueprint) for why this mechanic exists:
 * it's a countdown expressed as a distance to run, not a static timer.
 */
export function gateDistanceToday(): number {
  const LAUNCH = new Date(process.env.NEXT_PUBLIC_LAUNCH_DATE!);
  const START = new Date(process.env.NEXT_PUBLIC_CAMPAIGN_START!);
  const FLOOR_DATE = new Date(process.env.NEXT_PUBLIC_GATE_FLOOR_DATE!);
  const START_DISTANCE = 10000;
  const FLOOR = 800;

  const now = new Date();
  if (now >= FLOOR_DATE) return FLOOR;
  if (now <= START) return START_DISTANCE;

  const totalMs = LAUNCH.getTime() - START.getTime();
  const elapsedMs = now.getTime() - START.getTime();
  const raw = START_DISTANCE - (START_DISTANCE / (totalMs / 86400000)) * (elapsedMs / 86400000);
  return Math.max(FLOOR, Math.round(raw / 10) * 10);
}
