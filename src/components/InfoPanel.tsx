import type { OpeningLine } from "../data/openings";
import type { MoveFeedback, PlayerColor, TrainerMode } from "../hooks/useOpeningTrainer";
import { MovePurpose } from "./MovePurpose";

interface InfoPanelProps {
  line: OpeningLine;
  playerColor: PlayerColor;
  mode: TrainerMode;
  history: string[];
  moveIndex: number;
  totalMoves: number;
  isDone: boolean;
  feedback: MoveFeedback;
  wrongAttempts: number;
  revealedHint: string | null;
  currentComment: string | null;
  onColorChange: (color: PlayerColor) => void;
  onModeChange: (mode: TrainerMode) => void;
  onRestart: () => void;
  onHint: () => void;
  onNextLine: () => void;
}

function formatHistory(history: string[]): string {
  const parts: string[] = [];
  for (let i = 0; i < history.length; i += 2) {
    const moveNo = i / 2 + 1;
    const white = history[i];
    const black = history[i + 1];
    parts.push(black ? `${moveNo}. ${white} ${black}` : `${moveNo}. ${white}`);
  }
  return parts.join("  ");
}

export function InfoPanel({
  line,
  playerColor,
  mode,
  history,
  moveIndex,
  totalMoves,
  isDone,
  feedback,
  wrongAttempts,
  revealedHint,
  currentComment,
  onColorChange,
  onModeChange,
  onRestart,
  onHint,
  onNextLine,
}: InfoPanelProps) {
  const progressPercent = totalMoves === 0 ? 0 : Math.round((moveIndex / totalMoves) * 100);

  return (
    <aside className="info-panel">
      <div className="info-card">
        <h2>{line.name}</h2>
        <p className="info-eco">
          {line.eco} · {line.family}
        </p>
        <p className="info-description">{line.description}</p>
      </div>

      <div className="info-card">
        <div className="control-row">
          <span className="control-label">Play as</span>
          <div className="segmented">
            <button
              type="button"
              className={playerColor === "w" ? "segmented-active" : ""}
              onClick={() => onColorChange("w")}
            >
              White
            </button>
            <button
              type="button"
              className={playerColor === "b" ? "segmented-active" : ""}
              onClick={() => onColorChange("b")}
            >
              Black
            </button>
          </div>
        </div>
        <div className="control-row">
          <span className="control-label">Mode</span>
          <div className="segmented">
            <button
              type="button"
              className={mode === "quiz" ? "segmented-active" : ""}
              onClick={() => onModeChange("quiz")}
            >
              Quiz
            </button>
            <button
              type="button"
              className={mode === "study" ? "segmented-active" : ""}
              onClick={() => onModeChange("study")}
            >
              Study
            </button>
          </div>
        </div>
        <div className="button-row">
          <button type="button" className="secondary-button" onClick={onRestart}>
            ↺ Restart
          </button>
          <button
            type="button"
            className="secondary-button"
            onClick={onHint}
            disabled={mode !== "quiz" || isDone}
          >
            ? Hint
          </button>
        </div>
      </div>

      <MovePurpose comment={currentComment} moveIndex={moveIndex} />

      <div className="info-card status-card">
        <div className="progress-track" aria-hidden="true">
          <div className="progress-fill" style={{ width: `${progressPercent}%` }} />
        </div>
        <p className="progress-label">
          Move {Math.min(moveIndex, totalMoves)} of {totalMoves}
        </p>

        {isDone ? (
          <>
            <p className="status-line status-done">
              ✓ Line complete{mode === "quiz" ? " — nice work!" : "."}
            </p>
            <div className="button-row">
              <button type="button" className="secondary-button" onClick={onRestart}>
                Play again
              </button>
              <button type="button" className="secondary-button" onClick={onNextLine}>
                Next opening →
              </button>
            </div>
          </>
        ) : mode === "study" ? (
          <p className="status-line">Replaying the line — watch and follow along.</p>
        ) : (
          <>
            <p className="status-line">
              {feedback === "wrong"
                ? "Not quite — try again."
                : `Your move (${playerColor === "w" ? "White" : "Black"})…`}
            </p>
            {revealedHint && (
              <p className="hint-line">
                Hint: play <strong>{revealedHint}</strong>
              </p>
            )}
            {wrongAttempts > 0 && !revealedHint && (
              <p className="hint-line hint-line-muted">
                {wrongAttempts} wrong attempt{wrongAttempts > 1 ? "s" : ""} — keep trying.
              </p>
            )}
          </>
        )}
      </div>

      <div className="info-card">
        <h3 className="moves-title">Moves</h3>
        <p className="moves-list">{history.length ? formatHistory(history) : "—"}</p>
      </div>
    </aside>
  );
}
