export type FirstMove = "e4" | "d4" | "flank";
export type Risk = "low" | "medium" | "high";
export type Approach = "classical" | "hypermodern";
export type Theory = "low" | "medium" | "high";

export interface OpeningStyleProfile {
  firstMove: FirstMove;
  risk: Risk;
  approach: Approach;
  theory: Theory;
}

// Rough, opinionated style tags per line — good enough to steer a
// recommendation quiz, not a rigorous theoretical classification.
export const openingStyles: Record<string, OpeningStyleProfile> = {
  "italian-giuoco-piano": { firstMove: "e4", risk: "low", approach: "classical", theory: "medium" },
  "italian-evans-gambit": { firstMove: "e4", risk: "high", approach: "classical", theory: "medium" },
  "ruy-lopez-berlin": { firstMove: "e4", risk: "low", approach: "classical", theory: "high" },
  "ruy-lopez-closed": { firstMove: "e4", risk: "low", approach: "classical", theory: "high" },
  "scotch-game": { firstMove: "e4", risk: "medium", approach: "classical", theory: "low" },
  "petrov-defence": { firstMove: "e4", risk: "low", approach: "classical", theory: "medium" },
  "vienna-game": { firstMove: "e4", risk: "medium", approach: "classical", theory: "low" },
  "kings-gambit-accepted": { firstMove: "e4", risk: "high", approach: "classical", theory: "medium" },
  "sicilian-najdorf": { firstMove: "e4", risk: "high", approach: "hypermodern", theory: "high" },
  "sicilian-dragon": { firstMove: "e4", risk: "high", approach: "hypermodern", theory: "high" },
  "sicilian-sveshnikov": { firstMove: "e4", risk: "medium", approach: "hypermodern", theory: "high" },
  "sicilian-rossolimo": { firstMove: "e4", risk: "low", approach: "hypermodern", theory: "low" },
  "french-advance": { firstMove: "e4", risk: "medium", approach: "classical", theory: "medium" },
  "french-winawer": { firstMove: "e4", risk: "high", approach: "classical", theory: "high" },
  "caro-kann-classical": { firstMove: "e4", risk: "low", approach: "classical", theory: "low" },
  "caro-kann-advance": { firstMove: "e4", risk: "low", approach: "classical", theory: "low" },
  "pirc-defence": { firstMove: "e4", risk: "medium", approach: "hypermodern", theory: "medium" },
  "scandinavian-defence": { firstMove: "e4", risk: "low", approach: "classical", theory: "low" },
  "qgd-main-line": { firstMove: "d4", risk: "low", approach: "classical", theory: "medium" },
  "qga-main-line": { firstMove: "d4", risk: "medium", approach: "classical", theory: "medium" },
  "slav-defence": { firstMove: "d4", risk: "low", approach: "classical", theory: "medium" },
  "kings-indian-defence": { firstMove: "d4", risk: "high", approach: "hypermodern", theory: "high" },
  "nimzo-indian-defence": { firstMove: "d4", risk: "medium", approach: "hypermodern", theory: "high" },
  "grunfeld-defence": { firstMove: "d4", risk: "high", approach: "hypermodern", theory: "high" },
  "english-opening": { firstMove: "flank", risk: "medium", approach: "hypermodern", theory: "medium" },
  "london-system": { firstMove: "d4", risk: "low", approach: "classical", theory: "low" },
  "catalan-opening": { firstMove: "d4", risk: "medium", approach: "hypermodern", theory: "medium" },
};
