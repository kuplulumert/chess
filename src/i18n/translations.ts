export type Language = "en" | "tr";

export interface Dictionary {
  appTitle: string;
  appSubtitle: string;
  searchPlaceholder: string;
  searchAriaLabel: string;
  noOpeningsMatch: (query: string) => string;
  masteredTooltip: string;

  playAs: string;
  white: string;
  black: string;
  mode: string;
  quiz: string;
  study: string;
  restart: string;
  hintButton: string;

  moveHintTitle: string;
  strategyTitle: string;

  progressLabel: (current: number, total: number) => string;
  lineComplete: (mode: "quiz" | "study") => string;
  playAgain: string;
  nextOpening: string;
  replayingLine: string;
  notQuite: string;
  yourMove: (color: string) => string;
  hintLabel: string;
  wrongAttempts: (n: number) => string;
  movesHeading: string;
  emptyMoves: string;

  switchToLight: string;
  switchToDark: string;
  switchToLanguage: string;

  howToUse: string;
  dismissGuide: string;

  extendPrompt: string;
  extendButton: string;
}

const en: Dictionary = {
  appTitle: "Opening Trainer",
  appSubtitle: "Drill chess openings until they're automatic.",
  searchPlaceholder: "Search openings…",
  searchAriaLabel: "Search openings",
  noOpeningsMatch: (query) => `No openings match "${query}".`,
  masteredTooltip: "Completed as this color",

  playAs: "Play as",
  white: "White",
  black: "Black",
  mode: "Mode",
  quiz: "Quiz",
  study: "Study",
  restart: "↺ Restart",
  hintButton: "? Hint",

  moveHintTitle: "Move Hint",
  strategyTitle: "Strategy",

  progressLabel: (current, total) => `Move ${current} of ${total}`,
  lineComplete: (mode) => (mode === "quiz" ? "✓ Line complete — nice work!" : "✓ Line complete."),
  playAgain: "Play again",
  nextOpening: "Next opening →",
  replayingLine: "Replaying the line — watch and follow along.",
  notQuite: "Not quite — try again.",
  yourMove: (color) => `Your move (${color})…`,
  hintLabel: "Hint:",
  wrongAttempts: (n) => `${n} wrong attempt${n > 1 ? "s" : ""} — keep trying.`,
  movesHeading: "Moves",
  emptyMoves: "—",

  switchToLight: "Switch to light mode",
  switchToDark: "Switch to dark mode",
  switchToLanguage: "Türkçeye geç",

  howToUse:
    "Pick a line on the left, then choose White or Black — you can drill the same opening from either side. Play the moves yourself in Quiz mode, or watch them play out in Study mode.",
  dismissGuide: "Dismiss",

  extendPrompt: "Want to go deeper into this line?",
  extendButton: "+5 more moves",
};

const tr: Dictionary = {
  appTitle: "Açılış Antrenörü",
  appSubtitle: "Satranç açılışlarını otomatikleşene kadar çalış.",
  searchPlaceholder: "Açılış ara…",
  searchAriaLabel: "Açılış ara",
  noOpeningsMatch: (query) => `"${query}" ile eşleşen açılış yok.`,
  masteredTooltip: "Bu renkte tamamlandı",

  playAs: "Taraf",
  white: "Beyaz",
  black: "Siyah",
  mode: "Mod",
  quiz: "Quiz",
  study: "Çalışma",
  restart: "↺ Baştan başla",
  hintButton: "? İpucu",

  moveHintTitle: "Hamle İpucu",
  strategyTitle: "Strateji",

  progressLabel: (current, total) => `Hamle: ${current} / ${total}`,
  lineComplete: (mode) => (mode === "quiz" ? "✓ Açılış tamamlandı — aferin!" : "✓ Açılış tamamlandı."),
  playAgain: "Tekrar oyna",
  nextOpening: "Sonraki açılış →",
  replayingLine: "Açılış tekrar oynanıyor — izle ve takip et.",
  notQuite: "Olmadı — tekrar dene.",
  yourMove: (color) => `Sıra sende (${color})…`,
  hintLabel: "İpucu:",
  wrongAttempts: (n) => `${n} yanlış deneme — denemeye devam et.`,
  movesHeading: "Hamleler",
  emptyMoves: "—",

  switchToLight: "Açık temaya geç",
  switchToDark: "Koyu temaya geç",
  switchToLanguage: "Switch to English",

  howToUse:
    "Soldan bir açılış seç, sonra Beyaz ya da Siyah tarafı seç — aynı açılışı iki taraftan da çalışabilirsin. Hamleleri Quiz modunda kendin oyna, ya da Çalışma modunda nasıl oynandığını izle.",
  dismissGuide: "Kapat",

  extendPrompt: "Bu açılışta biraz daha derine inmek ister misin?",
  extendButton: "+5 hamle daha",
};

export const dictionaries: Record<Language, Dictionary> = { en, tr };
