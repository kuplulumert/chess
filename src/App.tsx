import { useCallback, useEffect, useRef, useState } from "react";
import type { Square } from "chess.js";
import { openings, type OpeningLine } from "./data/openings";
import { Sidebar } from "./components/Sidebar";
import { BoardPanel } from "./components/BoardPanel";
import { InfoPanel } from "./components/InfoPanel";
import { getAllProgress, recordCompletion } from "./utils/storage";
import { useOpeningTrainer, type PlayerColor, type TrainerMode } from "./hooks/useOpeningTrainer";
import "./App.css";

function App() {
  const [selectedId, setSelectedId] = useState(openings[0].id);
  const [playerColor, setPlayerColor] = useState<PlayerColor>("w");
  const [mode, setMode] = useState<TrainerMode>("quiz");
  const [progress, setProgress] = useState(() => getAllProgress());

  const line = openings.find((o) => o.id === selectedId) ?? openings[0];
  const trainer = useOpeningTrainer(line, playerColor, mode);

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

  const handleSelect = useCallback((next: OpeningLine) => {
    setSelectedId(next.id);
  }, []);

  const handleDrop = useCallback(
    (from: Square, to: Square) => trainer.attemptMove(from, to),
    [trainer],
  );

  const handleNextLine = useCallback(() => {
    const index = openings.findIndex((o) => o.id === selectedId);
    setSelectedId(openings[(index + 1) % openings.length].id);
  }, [selectedId]);

  return (
    <div className="app-shell">
      <Sidebar
        lines={openings}
        selectedId={selectedId}
        playerColor={playerColor}
        onSelect={handleSelect}
        progress={progress}
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
        onColorChange={setPlayerColor}
        onModeChange={setMode}
        onRestart={trainer.reset}
        onHint={trainer.requestHint}
        onNextLine={handleNextLine}
      />
    </div>
  );
}

export default App;
