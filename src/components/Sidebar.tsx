import { useMemo, useState } from "react";
import type { OpeningLine } from "../data/openings";
import { groupByFamily } from "../data/families";
import type { LineProgress } from "../utils/storage";
import type { PlayerColor } from "../hooks/useOpeningTrainer";
import type { Theme } from "../hooks/useTheme";
import { ThemeToggle } from "./ThemeToggle";

interface SidebarProps {
  lines: OpeningLine[];
  selectedId: string;
  playerColor: PlayerColor;
  onSelect: (line: OpeningLine) => void;
  progress: Record<string, LineProgress>;
  theme: Theme;
  onToggleTheme: () => void;
}

export function Sidebar({
  lines,
  selectedId,
  playerColor,
  onSelect,
  progress,
  theme,
  onToggleTheme,
}: SidebarProps) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return lines;
    return lines.filter(
      (l) =>
        l.name.toLowerCase().includes(q) ||
        l.family.toLowerCase().includes(q) ||
        l.eco.toLowerCase().includes(q),
    );
  }, [lines, query]);

  const groups = useMemo(() => groupByFamily(filtered), [filtered]);

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="sidebar-header-row">
          <h1>Opening Trainer</h1>
          <ThemeToggle theme={theme} onToggle={onToggleTheme} />
        </div>
        <p className="sidebar-subtitle">Drill chess openings until they're automatic.</p>
      </div>
      <input
        className="search-input"
        type="search"
        placeholder="Search openings…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        aria-label="Search openings"
      />
      <nav className="opening-list">
        {groups.map((group) => (
          <div key={group.family} className="opening-group">
            <h2 className="opening-group-title">{group.family}</h2>
            <ul>
              {group.lines.map((line) => {
                const key = `${line.id}:${playerColor}`;
                const mastered = (progress[key]?.completions ?? 0) > 0;
                return (
                  <li key={line.id}>
                    <button
                      type="button"
                      className={
                        "opening-item" + (line.id === selectedId ? " opening-item-active" : "")
                      }
                      onClick={() => onSelect(line)}
                    >
                      <span className="opening-eco">{line.eco}</span>
                      <span className="opening-name">{line.name}</span>
                      {mastered && (
                        <span className="opening-mastered" title="Completed as this color">
                          ✓
                        </span>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
        {groups.length === 0 && <p className="empty-state">No openings match “{query}”.</p>}
      </nav>
    </aside>
  );
}
