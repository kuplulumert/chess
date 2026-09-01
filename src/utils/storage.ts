const STORAGE_KEY = "chess-opening-trainer-progress:v1";

export interface LineProgress {
  completions: number;
  lastCompletedAt: string | null;
}

type ProgressMap = Record<string, LineProgress>;

function key(lineId: string, color: "w" | "b"): string {
  return `${lineId}:${color}`;
}

function loadAll(): ProgressMap {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as ProgressMap) : {};
  } catch {
    return {};
  }
}

function saveAll(map: ProgressMap): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
  } catch {
    // localStorage unavailable (private mode, quota, etc.) — progress just won't persist.
  }
}

export function getProgress(lineId: string, color: "w" | "b"): LineProgress {
  const map = loadAll();
  return map[key(lineId, color)] ?? { completions: 0, lastCompletedAt: null };
}

export function getAllProgress(): ProgressMap {
  return loadAll();
}

export function recordCompletion(lineId: string, color: "w" | "b"): LineProgress {
  const map = loadAll();
  const k = key(lineId, color);
  const prev = map[k] ?? { completions: 0, lastCompletedAt: null };
  const next: LineProgress = {
    completions: prev.completions + 1,
    lastCompletedAt: new Date().toISOString(),
  };
  map[k] = next;
  saveAll(map);
  return next;
}
