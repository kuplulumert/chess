import { buildFamilyMap, computeRank } from "../data/skillMap";
import type { OpeningLine } from "../data/openings";
import type { LineProgress } from "../utils/storage";
import type { Dictionary } from "../i18n/translations";
import "./SkillMap.css";

interface SkillMapProps {
  openings: OpeningLine[];
  progress: Record<string, LineProgress>;
  t: Dictionary;
  onTrainLine: (line: OpeningLine) => void;
}

export function SkillMap({ openings, progress, t, onTrainLine }: SkillMapProps) {
  const familyMap = buildFamilyMap(openings, progress);
  const { points, total, tier } = computeRank(familyMap);
  const rankTitle = t.map.rankTitles[tier];

  return (
    <div className="skill-map">
      <div className="skill-map-header">
        <div>
          <h1>{t.map.title}</h1>
          <p className="skill-map-subtitle">{t.map.subtitle}</p>
        </div>
        <div className="skill-map-rank">
          <p className="skill-map-rank-title">{rankTitle}</p>
          <p className="skill-map-rank-points">{t.map.pointsLabel(points, total)}</p>
        </div>
      </div>

      <div className="skill-map-grid">
        {familyMap.map(({ family, lines, capstoneUnlocked }) => (
          <div key={family} className="constellation-card">
            <button
              type="button"
              className={
                "constellation-node constellation-capstone" +
                (capstoneUnlocked ? " constellation-node-lit" : "")
              }
              title={capstoneUnlocked ? t.map.capstoneLabel(family) : t.map.capstoneLockedHint}
              disabled
            >
              ★
            </button>
            <div className="constellation-connector" />
            <p className="constellation-family">{family}</p>
            <div className="constellation-lines">
              {lines.map(({ line, unlocked, masteredBothColors }) => (
                <div key={line.id} className="constellation-node-wrap">
                  <button
                    type="button"
                    className={
                      "constellation-node" +
                      (unlocked ? " constellation-node-lit" : "") +
                      (masteredBothColors ? " constellation-node-mastered" : "")
                    }
                    onClick={() => onTrainLine(line)}
                    title={unlocked ? line.name : t.map.lineLockedHint}
                  >
                    {line.eco}
                  </button>
                  <p className="constellation-node-label">{line.name}</p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
