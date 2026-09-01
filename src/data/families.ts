import { openings, type OpeningLine } from "./openings";

export interface OpeningFamily {
  family: string;
  lines: OpeningLine[];
}

export function groupByFamily(lines: OpeningLine[] = openings): OpeningFamily[] {
  const map = new Map<string, OpeningLine[]>();
  for (const line of lines) {
    const bucket = map.get(line.family);
    if (bucket) {
      bucket.push(line);
    } else {
      map.set(line.family, [line]);
    }
  }
  return Array.from(map.entries()).map(([family, lines]) => ({ family, lines }));
}
