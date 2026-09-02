import { groupByFamily } from "./families";
import type { OpeningLine } from "./openings";
import type { LineProgress } from "../utils/storage";

export interface FamilyMapLine {
  line: OpeningLine;
  unlocked: boolean;
  masteredBothColors: boolean;
}

export interface FamilyMapData {
  family: string;
  lines: FamilyMapLine[];
  capstoneUnlocked: boolean;
}

export function buildFamilyMap(
  openings: OpeningLine[],
  progress: Record<string, LineProgress>,
): FamilyMapData[] {
  return groupByFamily(openings).map(({ family, lines }) => {
    const lineStates = lines.map((line) => {
      const whiteDone = (progress[`${line.id}:w`]?.completions ?? 0) > 0;
      const blackDone = (progress[`${line.id}:b`]?.completions ?? 0) > 0;
      return { line, unlocked: whiteDone || blackDone, masteredBothColors: whiteDone && blackDone };
    });
    return {
      family,
      lines: lineStates,
      capstoneUnlocked: lineStates.every((l) => l.unlocked),
    };
  });
}

export interface MapRank {
  points: number;
  total: number;
  tier: number; // 0-4, indexes into a 5-tier title list
}

export function computeRank(familyMap: FamilyMapData[]): MapRank {
  let points = 0;
  let total = 0;
  for (const f of familyMap) {
    total += f.lines.length + 1; // +1 for the family's capstone perk
    points += f.lines.filter((l) => l.unlocked).length;
    if (f.capstoneUnlocked) points += 1;
  }
  const tier = points === 0 ? 0 : Math.min(4, Math.floor((points / total) * 5));
  return { points, total, tier };
}
