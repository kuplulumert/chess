import type { OpeningLine } from "./openings";
import { openingStyles } from "./openingStyles";

export type ColorAnswer = "white" | "black" | "any";
export type FirstMoveAnswer = "e4" | "d4" | "flank" | "any";
export type RiskAnswer = "low" | "medium" | "high" | "any";
export type ApproachAnswer = "classical" | "hypermodern" | "any";
export type TheoryAnswer = "low" | "medium" | "high" | "any";

export interface FinderAnswers {
  color: ColorAnswer;
  firstMove: FirstMoveAnswer;
  risk: RiskAnswer;
  approach: ApproachAnswer;
  theory: TheoryAnswer;
}

export const DEFAULT_FINDER_ANSWERS: FinderAnswers = {
  color: "any",
  firstMove: "any",
  risk: "any",
  approach: "any",
  theory: "any",
};

// Same convention used to auto-orient Play As on selection: a family or
// line name mentioning "Defence" is the Black side's repertoire.
export function isDefenceLine(line: Pick<OpeningLine, "family" | "name">): boolean {
  return line.family.includes("Defence") || line.name.includes("Defence");
}

/**
 * Ranks openings by how many style axes match the quiz answers. `canonicalLines`
 * (always English) drives classification and scoring so results don't depend on
 * the current UI language; `displayLines` (possibly localized) supplies the
 * objects actually returned, so their text renders in the user's language.
 */
export function recommendOpenings(
  answers: FinderAnswers,
  canonicalLines: OpeningLine[],
  displayLines: OpeningLine[],
  limit = 3,
): OpeningLine[] {
  const displayById = new Map(displayLines.map((line) => [line.id, line]));

  const candidates = canonicalLines.filter((line) => {
    if (answers.color === "any") return true;
    const isBlack = isDefenceLine(line);
    return answers.color === "black" ? isBlack : !isBlack;
  });

  const scored = candidates.map((line) => {
    const style = openingStyles[line.id];
    let score = 0;
    if (style) {
      if (answers.firstMove !== "any" && style.firstMove === answers.firstMove) score += 1;
      if (answers.risk !== "any" && style.risk === answers.risk) score += 1;
      if (answers.approach !== "any" && style.approach === answers.approach) score += 1;
      if (answers.theory !== "any" && style.theory === answers.theory) score += 1;
    }
    return { id: line.id, score };
  });

  scored.sort((a, b) => b.score - a.score);

  return scored
    .slice(0, limit)
    .map((entry) => displayById.get(entry.id))
    .filter((line): line is OpeningLine => Boolean(line));
}
