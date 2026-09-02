import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Square } from "chess.js";
import { openings as openingsEn, type OpeningLine } from "./data/openings";
import { getLocalizedOpenings } from "./data/localize";
import { Sidebar } from "./components/Sidebar";
import { HowToUseBanner } from "./components/HowToUseBanner";
import { BoardPanel } from "./components/BoardPanel";
import { InfoPanel } from "./components/InfoPanel";
import { OpeningFinder } from "./components/OpeningFinder";
import { getAllProgress, recordCompletion } from "./utils/storage";
import { useOpeningTrainer, type PlayerColor, type TrainerMode } from "./hooks/useOpeningTrainer";
import { useTheme } from "./hooks/useTheme";
import { useLanguage } from "./hooks/useLanguage";
import "./App.css";

function App() {
  const [selectedId, setSelectedId] = useState(openingsEn[0].id);
  const [playerColor, setPlayerColor] = useState<PlayerColor>("w");
  const [mode, setMode] = useState<TrainerMode>("study");
  const [progress, setProgress] = useState(() => getAllProgress());
  const [extended, setExtended] = useState(false);
  const [finderOpen, setFinderOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const { language, t, toggleLanguage } = useLanguage();

  const openings = useMemo(() => getLocalizedOpenings(language), [language]);
  const line = openings.find((o) => o.id === selectedId) ?? openings[0];

  // A fresh run (new opening, new color, or new mode) always starts at the
  // base depth; the trainee re-opts into the extension each time. Reset
  // synchronously during render (React's documented pattern for this) rather
  // than in an effect, which would need an extra render to take effect.
  const runKey = `${selectedId}:${playerColor}:${mode}`;
  const [activeRunKey, setActiveRunKey] = useState(runKey);
  if (activeRunKey !== runKey) {
    setActiveRunKey(runKey);
    setExtended(false);
  }

  // A run's own line stays untouched until the trainee opts in to the extra
  // 5 plies via the "extend" offer shown once the base line is complete —
  // extending swaps in a longer moves/comments list under the same id, so
  // useOpeningTrainer picks up right where it left off instead of resetting.
  const activeLine = useMemo(() => {
    if (!extended || !line.extension) return line;
    return {
      ...line,
      moves: [...line.moves, ...line.extension.moves],
      comments: [...line.comments, ...line.extension.comments],
      strategy: [...line.strategy, ...line.extension.strategy],
    };
  }, [line, extended]);

  const trainer = useOpeningTrainer(activeLine, playerColor, mode);

  // Record a completion once per run-through of a line, not once per render.
  const recordedRef = useRef<string | null>(null);
  const { isDone } = trainer;
  useEffect(() => {
    if (!isDone) {
      recordedRef.current = null;
      return;
    }
    if (mode !== "quiz") return;
    const runKey = `${line.id}:${playerColor}`;
    if (recordedRef.current === runKey) return;
    recordedRef.current = runKey;
    recordCompletion(line.id, playerColor);
    setProgress(getAllProgress());
  }, [isDone, mode, line.id, playerColor]);

  // Defences (Sicilian, French, Caro-Kann, ... and individual defensive
  // lines like the Berlin Defence within Ruy Lopez) are trained as Black
  // by default, since that's the side whose repertoire they actually are;
  // everything else defaults to White. Looked up from the canonical
  // English data so this doesn't depend on the current UI language.
  const selectOpening = useCallback((id: string) => {
    setSelectedId(id);
    const canonical = openingsEn.find((o) => o.id === id);
    const isDefence = canonical?.family.includes("Defence") || canonical?.name.includes("Defence");
    setPlayerColor(isDefence ? "b" : "w");
  }, []);

  const handleSelect = useCallback(
    (next: OpeningLine) => selectOpening(next.id),
    [selectOpening],
  );

  const handleDrop = useCallback(
    (from: Square, to: Square) => trainer.attemptMove(from, to),
    [trainer],
  );

  const handleNextLine = useCallback(() => {
    const index = openings.findIndex((o) => o.id === selectedId);
    selectOpening(openings[(index + 1) % openings.length].id);
  }, [openings, selectedId, selectOpening]);

  const handleRestart = useCallback(() => {
    setExtended(false);
    trainer.reset();
  }, [trainer]);

  const handleExtend = useCallback(() => {
    setExtended(true);
  }, []);

  const handleFinderSelect = useCallback(
    (next: OpeningLine) => {
      selectOpening(next.id);
      setFinderOpen(false);
    },
    [selectOpening],
  );

  return (
    <div className="app-shell">
      <HowToUseBanner text={t.howToUse} dismissLabel={t.dismissGuide} />
      <Sidebar
        lines={openings}
        selectedId={selectedId}
        playerColor={playerColor}
        onSelect={handleSelect}
        onOpenFinder={() => setFinderOpen(true)}
        progress={progress}
        theme={theme}
        onToggleTheme={toggleTheme}
        language={language}
        onToggleLanguage={toggleLanguage}
        t={t}
      />
      <main className="board-column">
        <BoardPanel
          fen={trainer.fen}
          playerColor={playerColor}
          isPlayerTurn={trainer.isPlayerTurn}
          feedback={trainer.feedback}
          lastWrongSquares={trainer.lastWrongSquares}
          hintSan={trainer.revealedHint}
          onDrop={handleDrop}
        />
      </main>
      <InfoPanel
        line={line}
        playerColor={playerColor}
        mode={mode}
        history={trainer.history}
        moveIndex={trainer.moveIndex}
        totalMoves={trainer.totalMoves}
        isDone={trainer.isDone}
        feedback={trainer.feedback}
        wrongAttempts={trainer.wrongAttempts}
        revealedHint={trainer.revealedHint}
        currentComment={trainer.currentComment}
        whiteStrategy={trainer.whiteStrategy}
        blackStrategy={trainer.blackStrategy}
        isPlayerTurn={trainer.isPlayerTurn}
        canExtend={Boolean(line.extension) && !extended}
        t={t}
        onColorChange={setPlayerColor}
        onModeChange={setMode}
        onRestart={handleRestart}
        onHint={trainer.requestHint}
        onNextLine={handleNextLine}
        onExtend={handleExtend}
      />

      {finderOpen && (
        <OpeningFinder
          openings={openings}
          canonicalOpenings={openingsEn}
          t={t}
          onSelect={handleFinderSelect}
          onClose={() => setFinderOpen(false)}
        />
      )}
    </div>
  );
}

export default App;
