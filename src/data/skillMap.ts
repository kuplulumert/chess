import { groupByFamily } from "./families";
import type { OpeningLine } from "./openings";
import type { LineProgress } from "../utils/storage";

// Medal tiers reward repeated practice, not just a first completion —
// index 0 is "not started"; 1-4 are the actual medals, unlocked by total
// completions (summed across both colors) reaching each threshold.
export const MEDAL_THRESHOLDS = [0, 1, 3, 6, 10] as const;
export const MEDAL_KEYS = ["locked", "bronze", "silver", "gold", "diamond"] as const;
export type MedalKey = (typeof MEDAL_KEYS)[number];

export function medalTierForCompletions(completions: number): number {
  let tier = 0;
  for (let i = 0; i < MEDAL_THRESHOLDS.length; i++) {
    if (completions >= MEDAL_THRESHOLDS[i]) tier = i;
  }
  return tier;
}

/** Completions still needed to reach the next medal, or null if already at the top tier. */
export function completionsToNextMedal(completions: number): number | null {
  const tier = medalTierForCompletions(completions);
  if (tier >= MEDAL_THRESHOLDS.length - 1) return null;
  return MEDAL_THRESHOLDS[tier + 1] - completions;
}

export interface FamilyMapLine {
  line: OpeningLine;
  completions: number;
  medalTier: number; // 0-4, indexes MEDAL_KEYS
}

export interface FamilyMapData {
  family: string;
  lines: FamilyMapLine[];
  // The family's capstone tracks its weakest line — repeating every line in
  // the family, not just completing each once, is what pushes this up.
  capstoneTier: number;
}

export function buildFamilyMap(
  openings: OpeningLine[],
  progress: Record<string, LineProgress>,
): FamilyMapData[] {
  return groupByFamily(openings).map(({ family, lines }) => {
    const lineStates = lines.map((line) => {
      const completions =
        (progress[`${line.id}:w`]?.completions ?? 0) + (progress[`${line.id}:b`]?.completions ?? 0);
      return { line, completions, medalTier: medalTierForCompletions(completions) };
    });
    return {
      family,
      lines: lineStates,
      capstoneTier: Math.min(...lineStates.map((l) => l.medalTier)),
    };
  });
}

export interface MapRank {
  points: number;
  total: number;
  tier: number; // 0-4, indexes into a 5-tier rank title list
}

const MAX_MEDAL_TIER = MEDAL_KEYS.length - 1;

export function computeRank(familyMap: FamilyMapData[]): MapRank {
  let points = 0;
  let total = 0;
  for (const f of familyMap) {
    total += (f.lines.length + 1) * MAX_MEDAL_TIER; // +1 for the family's capstone perk
    points += f.lines.reduce((sum, l) => sum + l.medalTier, 0);
    points += f.capstoneTier;
  }
  const tier = points === 0 ? 0 : Math.min(4, Math.floor((points / total) * 5));
  return { points, total, tier };
}
