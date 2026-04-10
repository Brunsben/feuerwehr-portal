/** PSA TypeScript-Interfaces (Client-side) */

export interface Kamerad {
  id: number;
  name: string;
  vorname: string;
  dienstgrad: string | null;
  email: string | null;
  personalnummer: string | null;
  kartenId: string | null;
  aktiv: boolean;
  jackeGroesse: string | null;
  hoseGroesse: string | null;
  stiefelGroesse: string | null;
  handschuhGroesse: string | null;
  hemdGroesse: string | null;
  poloshirtGroesse: string | null;
  fleeceGroesse: string | null;
  psaRolle: string | null;
}

export interface Ausruestungstyp {
  id: number;
  bezeichnung: string | null;
  typ: string | null;
  pruefintervallMonate: number | null;
  maxLebensdauerJahre: number | null;
  maxWaeschen: number | null;
  norm: string | null;
  foto: string | null;
}

export interface Ausruestungstueck {
  id: number;
  ausruestungstyp: string | null;
  seriennummer: string | null;
  kamerad: string | null;
  kameradId: number | null;
  status: string | null;
  kaufdatum: string | null;
  herstellungsdatum: string | null;
  naechstePruefung: string | null;
  letztePruefung: string | null;
  lebensendeDatum: string | null;
  qrCode: string | null;
  waescheAnzahl: number | null;
  groesse: string | null;
  notizen: string | null;
}

export interface Ausgabe {
  id: number;
  ausruestungstueckId: number | null;
  ausruestungstyp: string | null;
  kamerad: string | null;
  kameradId: number | null;
  ausgabedatum: string | null;
  rueckgabedatum: string | null;
  notizen: string | null;
}

export interface Pruefung {
  id: number;
  ausruestungstueckId: number | null;
  ausruestungstyp: string | null;
  kamerad: string | null;
  kameradId: number | null;
  datum: string | null;
  ergebnis: string | null;
  pruefer: string | null;
  naechstePruefung: string | null;
  notizen: string | null;
  foto: string | null;
}

export interface Waesche {
  id: number;
  ausruestungstueckId: number | null;
  ausruestungstyp: string | null;
  kamerad: string | null;
  kameradId: number | null;
  datum: string | null;
  notizen: string | null;
}

export interface Norm {
  id: number;
  bezeichnung: string | null;
  ausruestungstypKategorie: string | null;
  normbezeichnung: string | null;
  url: string | null;
  pruefintervallMonate: number | null;
  maxLebensdauerJahre: number | null;
  maxWaeschen: number | null;
  beschreibung: string | null;
}

export interface ChangelogEntry {
  id: number;
  tabelle: string | null;
  aktion: string | null;
  details: string | null;
  benutzer: string | null;
  zeitpunkt: string | null;
}

export interface Schaden {
  id: number;
  ausruestungstueckId: number | null;
  datum: string | null;
  beschreibung: string | null;
  foto: string;
  erstelltVon: string | null;
  erstelltAm: string | null;
  ausruestungstyp: string | null;
  seriennummer: string | null;
}

export type WarnPrio = "rot" | "orange" | "gelb";

export interface Warnung {
  prio: WarnPrio;
  text: string;
  ausruestungstueck: Ausruestungstueck;
  typ?: string;
}

export interface PsaStats {
  kameraden: number;
  ausruestung: number;
  ausgegeben: number;
  pruefungFaellig: number;
}

/** Mappt Typ-Kategorie → Kamerad-Größenfeld */
export const GROESSE_KAT_MAP: Record<
  string,
  { label: string; field: keyof Kamerad }
> = {
  Jacke: { label: "Jacke", field: "jackeGroesse" },
  Hose: { label: "Hose", field: "hoseGroesse" },
  Stiefel: { label: "Stiefel (EU)", field: "stiefelGroesse" },
  Handschuh: { label: "Handschuh", field: "handschuhGroesse" },
  Hemd: { label: "Hemd", field: "hemdGroesse" },
  Poloshirt: { label: "Poloshirt", field: "poloshirtGroesse" },
  "Fleece/Softshell": { label: "Fleece", field: "fleeceGroesse" },
};

export const STATUS_OPTIONS = [
  "Lager",
  "Ausgegeben",
  "Reinigung",
  "In Reparatur",
  "Ausgesondert",
] as const;
