import { useMemo, useState } from "react";
import type { OpeningLine } from "../data/openings";
import { groupByFamily } from "../data/families";
import type { LineProgress } from "../utils/storage";
import type { PlayerColor } from "../hooks/useOpeningTrainer";
import type { Theme } from "../hooks/useTheme";
import type { Dictionary, Language } from "../i18n/translations";
import { ThemeToggle } from "./ThemeToggle";
import { LanguageToggle } from "./LanguageToggle";

interface SidebarProps {
  lines: OpeningLine[];
  selectedId: string;
  playerColor: PlayerColor;
  onSelect: (line: OpeningLine) => void;
  progress: Record<string, LineProgress>;
  theme: Theme;
  onToggleTheme: () => void;
  language: Language;
  onToggleLanguage: () => void;
  t: Dictionary;
}

export function Sidebar({
  lines,
  selectedId,
  playerColor,
  onSelect,
  progress,
  theme,
  onToggleTheme,
  language,
  onToggleLanguage,
  t,
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
          <h1>{t.appTitle}</h1>
          <div className="sidebar-header-toggles">
            <LanguageToggle language={language} label={t.switchToLanguage} onToggle={onToggleLanguage} />
            <ThemeToggle
              theme={theme}
              label={theme === "dark" ? t.switchToLight : t.switchToDark}
              onToggle={onToggleTheme}
            />
          </div>
        </div>
        <p className="sidebar-subtitle">{t.appSubtitle}</p>
      </div>
      <input
        className="search-input"
        type="search"
        placeholder={t.searchPlaceholder}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        aria-label={t.searchAriaLabel}
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
                        <span className="opening-mastered" title={t.masteredTooltip}>
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
        {groups.length === 0 && <p className="empty-state">{t.noOpeningsMatch(query)}</p>}
      </nav>
    </aside>
  );
}
