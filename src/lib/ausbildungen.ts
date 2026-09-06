/**
 * Katalog verfügbarer Feuerwehr-Ausbildungen / Qualifikationen.
 * Wird zentral in der Mitgliederverwaltung zugeordnet (ohne Ablaufdatum).
 */
export const AUSBILDUNGEN_KATALOG = [
  "Truppmann/Grundausbildung (MTA)",
  "Truppführer",
  "Sprechfunker",
  "Atemschutzgeräteträger",
  "Maschinist",
  "Technische Hilfeleistung",
  "Gruppenführer",
  "Zugführer",
  "Verbandsführer",
  "ABC-Einsatz / Gefahrgut",
  "Motorsägenführer (Kettensäge)",
  "Absturzsicherung",
  "Bootsführer",
  "Erste Hilfe / Sanitätsdienst",
  "Ausbilder",
  "Jugendfeuerwehrwart",
  "Atemschutzgerätewart",
  "Gerätewart",
] as const;

export type AusbildungKatalog = (typeof AUSBILDUNGEN_KATALOG)[number];

export interface Ausbildung {
  id: number;
  kameradId: number;
  bezeichnung: string;
  erworbenAm: string | null;
  notizen: string | null;
}
