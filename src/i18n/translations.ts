export type Language = "en" | "tr";

export interface FinderQuestionCopy {
  title: string;
  options: Record<string, string>;
}

export interface FinderCopy {
  title: string;
  trigger: string;
  intro: string;
  step: (current: number, total: number) => string;
  questions: Record<"color" | "firstMove" | "risk" | "approach" | "theory", FinderQuestionCopy>;
  back: string;
  restart: string;
  resultsSubtitle: string;
  noMatch: string;
  studyThis: string;
  close: string;
}

export interface MapCopy {
  navLabel: string;
  trainerNavLabel: string;
  title: string;
  subtitle: string;
  howToUse: string;
  rankTitles: [string, string, string, string, string];
  pointsLabel: (points: number, total: number) => string;
  // Index 0 is the "not started" state; 1-4 are the actual medal tiers
  // (bronze, silver, gold, diamond), unlocked by repeating a line.
  medalNames: [string, string, string, string, string];
  capstoneLabel: (family: string, medal: string) => string;
  capstoneLockedHint: string;
  lineLockedHint: string;
  completionsLabel: (n: number) => string;
  nextMedalHint: (remaining: number, nextMedal: string) => string;
  maxMedalHint: string;
}

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

  finder: FinderCopy;
  map: MapCopy;
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
  quiz: "Practice",
  study: "Study",
  restart: "↺ Restart",
  hintButton: "? Hint",

  moveHintTitle: "Move Hint",

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
    "Pick a line on the left, then choose White or Black — you can drill the same opening from either side. You always play the moves yourself: Study mode shows where to move, Practice mode makes you find it first.",
  dismissGuide: "Dismiss",

  extendPrompt: "Want to go deeper into this line?",
  extendButton: "+5 more moves",

  finder: {
    title: "Find My Opening",
    trigger: "🧭 Find my opening",
    intro: "Answer a few quick questions and we'll point you to an opening that fits your style.",
    step: (current, total) => `Question ${current} of ${total}`,
    questions: {
      color: {
        title: "Which side do you want an opening for?",
        options: { white: "White", black: "Black", any: "Either — surprise me" },
      },
      firstMove: {
        title: "Which kind of positions pull you in?",
        options: {
          e4: "Open, e4-style fights",
          d4: "Closed, d4-style structures",
          flank: "Flexible flank systems",
          any: "No preference",
        },
      },
      risk: {
        title: "How much risk do you like to take?",
        options: { low: "Safe and solid", medium: "Balanced", high: "Sharp and aggressive", any: "No preference" },
      },
      approach: {
        title: "How do you like to fight for the center?",
        options: {
          classical: "Occupy it with pawns right away",
          hypermodern: "Control it from a distance, then strike",
          any: "No preference",
        },
      },
      theory: {
        title: "How much theory are you up for memorizing?",
        options: {
          low: "As little as possible",
          medium: "A moderate amount",
          high: "I'm ready to go deep",
          any: "No preference",
        },
      },
    },
    back: "← Back",
    restart: "Start over",
    resultsSubtitle: "Based on your answers, these fit best:",
    noMatch: "No strong match — try starting over with different answers.",
    studyThis: "Study this",
    close: "Close",
  },

  map: {
    navLabel: "🗺️ Skill Map",
    trainerNavLabel: "♟️ Trainer",
    title: "Opening Skill Map",
    subtitle: "Every family is its own constellation. Complete a line to earn Bronze, then repeat it for Silver, Gold, and Diamond — the family's capstone tracks its weakest line.",
    howToUse:
      "Complete a line in Practice mode to earn its Bronze medal — repeating it keeps raising it through Silver, Gold, and Diamond. A family's capstone medal reflects its weakest line, so mastering every line in a family raises it too. Study mode doesn't count toward medals.",
    rankTitles: ["Novice", "Apprentice", "Skilled", "Master", "Grandmaster"],
    pointsLabel: (points, total) => `${points} / ${total} medal points`,
    medalNames: ["Not started", "Bronze", "Silver", "Gold", "Diamond"],
    capstoneLabel: (family, medal) => `${family} Master — ${medal}`,
    capstoneLockedHint: "Complete every line in this family to earn this medal",
    lineLockedHint: "Not trained yet — click to start",
    completionsLabel: (n) => (n === 1 ? "Completed once" : `Completed ${n} times`),
    nextMedalHint: (remaining, nextMedal) =>
      `${remaining} more completion${remaining > 1 ? "s" : ""} → ${nextMedal}`,
    maxMedalHint: "Top medal reached!",
  },
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
  quiz: "Pratik",
  study: "Çalışma",
  restart: "↺ Baştan başla",
  hintButton: "? İpucu",

  moveHintTitle: "Hamle İpucu",

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
    "Soldan bir açılış seç, sonra Beyaz ya da Siyah tarafı seç — aynı açılışı iki taraftan da çalışabilirsin. Hamleleri her zaman sen oynarsın: Çalışma modunda nereye oynayacağın gösterilir, Pratik modunda önce kendin bulmaya çalışırsın.",
  dismissGuide: "Kapat",

  extendPrompt: "Bu açılışta biraz daha derine inmek ister misin?",
  extendButton: "+5 hamle daha",

  finder: {
    title: "Açılış Bul",
    trigger: "🧭 Bana açılış öner",
    intro: "Birkaç soruyu cevapla, tarzına uyan bir açılış önerelim.",
    step: (current, total) => `Soru ${current} / ${total}`,
    questions: {
      color: {
        title: "Hangi taraf için açılış arıyorsun?",
        options: { white: "Beyaz", black: "Siyah", any: "Farketmez, sen seç" },
      },
      firstMove: {
        title: "Hangi tarz pozisyonlar seni daha çok çekiyor?",
        options: {
          e4: "1.e4 tarzı açık mücadeleler",
          d4: "1.d4 tarzı kapalı yapılar",
          flank: "Esnek kanat açılışları",
          any: "Farketmez",
        },
      },
      risk: {
        title: "Ne kadar risk almayı seversin?",
        options: { low: "Güvenli ve sağlam", medium: "Dengeli", high: "Keskin ve agresif", any: "Farketmez" },
      },
      approach: {
        title: "Merkez için nasıl mücadele etmeyi seversin?",
        options: {
          classical: "Hemen piyonlarla işgal etmek",
          hypermodern: "Uzaktan kontrol edip sonra vurmak",
          any: "Farketmez",
        },
      },
      theory: {
        title: "Ne kadar teori ezberlemeye hazırsın?",
        options: {
          low: "Mümkün olduğunca az",
          medium: "Orta düzeyde",
          high: "Derinlere inmeye hazırım",
          any: "Farketmez",
        },
      },
    },
    back: "← Geri",
    restart: "Baştan başla",
    resultsSubtitle: "Cevaplarına göre en uygun olanlar:",
    noMatch: "Güçlü bir eşleşme yok — farklı cevaplarla baştan dene.",
    studyThis: "Bunu çalış",
    close: "Kapat",
  },

  map: {
    navLabel: "🗺️ Yetenek Haritası",
    trainerNavLabel: "♟️ Antrenör",
    title: "Açılış Yetenek Haritası",
    subtitle: "Her aile kendi takımyıldızı. Bir hattı tamamla, Bronz kazan; tekrar tekrar çalışarak Gümüş, Altın ve Elmas'a yüksel — ailenin kapanış madalyası en zayıf hattını yansıtır.",
    howToUse:
      "Bir hattı Pratik modunda tamamlayınca Bronz madalyayı kazanırsın — tekrar tekrar çalışarak Gümüş, Altın ve Elmas'a yükselirsin. Ailenin kapanış madalyası en zayıf hattını yansıtır, yani ailedeki tüm hatlarda ustalaşmak onu da yükseltir. Çalışma modu madalyaya saymaz.",
    rankTitles: ["Acemi", "Çırak", "Yetenekli", "Usta", "Büyük Üstat"],
    pointsLabel: (points, total) => `${points} / ${total} madalya puanı`,
    medalNames: ["Başlanmadı", "Bronz", "Gümüş", "Altın", "Elmas"],
    capstoneLabel: (family, medal) => `${family} Ustası — ${medal}`,
    capstoneLockedHint: "Bu madalyayı kazanmak için bu ailedeki tüm hatları tamamla",
    lineLockedHint: "Henüz çalışılmadı — başlamak için tıkla",
    completionsLabel: (n) => (n === 1 ? "Bir kez tamamlandı" : `${n} kez tamamlandı`),
    nextMedalHint: (remaining, nextMedal) => `${remaining} tekrar daha → ${nextMedal}`,
    maxMedalHint: "En üst madalyaya ulaşıldı!",
  },
};

export const dictionaries: Record<Language, Dictionary> = { en, tr };
