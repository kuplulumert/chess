import { openings as openingsEn, type OpeningLine } from "./openings";
import { openingsTr } from "./openings.tr";
import type { Language } from "../i18n/translations";

export function getLocalizedOpenings(language: Language): OpeningLine[] {
  if (language === "en") return openingsEn;

  return openingsEn.map((line) => {
    const tr = openingsTr[line.id];
    if (!tr) return line;
    return {
      ...line,
      family: tr.family,
      name: tr.name,
      description: tr.description,
      comments: tr.comments,
      extension:
        line.extension && tr.extensionComments
          ? { moves: line.extension.moves, comments: tr.extensionComments }
          : line.extension,
    };
  });
}
