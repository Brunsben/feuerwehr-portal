import {
  pgSchema,
  serial,
  text,
  boolean,
  integer,
  timestamp,
  date,
} from "drizzle-orm/pg-core";

// Bestehendes Schema beibehalten (Legacy-Name aus NocoDB-Zeiten)
export const schema = pgSchema("pxicv3djlauluse");

// ============================================================================
// BENUTZER (Login-Accounts)
// ============================================================================
export const benutzer = schema.table("Benutzer", {
  id: serial("id").primaryKey(),
  benutzername: text("Benutzername").notNull().unique(),
  pin: text("PIN").notNull(), // bcrypt hash
  rolle: text("Rolle").notNull().default("User"),
  kameradId: integer("KameradId").references(() => kameraden.id),
  aktiv: boolean("Aktiv").notNull().default(true),
});

// ============================================================================
// KAMERADEN (Mitglieder-Stammdaten)
// ============================================================================
export const kameraden = schema.table("Kameraden", {
  id: serial("id").primaryKey(),
  name: text("Name").notNull(),
  vorname: text("Vorname").notNull(),
  dienstgrad: text("Dienstgrad"),
  email: text("Email"),
  personalnummer: text("Personalnummer"),
  kartenId: text("KartenID"),
  aktiv: boolean("Aktiv").notNull().default(true),
  // Kleidergrößen (DB-Spaltennamen aus NocoDB mit Unterstrich)
  jackeGroesse: text("Jacke_Groesse"),
  hoseGroesse: text("Hose_Groesse"),
  stiefelGroesse: text("Stiefel_Groesse"),
  handschuhGroesse: text("Handschuh_Groesse"),
  hemdGroesse: text("Hemd_Groesse"),
  poloshirtGroesse: text("Poloshirt_Groesse"),
  fleeceGroesse: text("Fleece_Groesse"),
  // Per-App Rollen
  psaRolle: text("psa_rolle"),
  foodRolle: text("food_rolle"),
  fkRolle: text("fk_rolle"),
});

// ============================================================================
// LOGIN_ATTEMPTS (Brute-Force-Schutz)
// ============================================================================
export const loginAttempts = schema.table("login_attempts", {
  id: serial("id").primaryKey(),
  benutzername: text("benutzername").notNull(),
  erfolgreich: boolean("erfolgreich").notNull().default(false),
  zeitpunkt: timestamp("zeitpunkt", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// ============================================================================
// PSA: AUSRÜSTUNGSTYPEN (Kategorien/Typen mit Prüfintervallen)
// ============================================================================
export const ausruestungstypen = schema.table("Ausruestungstypen", {
  id: serial("id").primaryKey(),
  bezeichnung: text("Bezeichnung"),
  typ: text("Typ"),
  pruefintervallMonate: integer("Pruefintervall_Monate"),
  maxLebensdauerJahre: integer("Max_Lebensdauer_Jahre"),
  maxWaeschen: integer("Max_Waeschen"),
  norm: text("Norm"),
  foto: text("Foto"),
});

// ============================================================================
// PSA: AUSRÜSTUNGSSTÜCKE (Einzelne Geräte/Kleidung)
// ============================================================================
export const ausruestungstuecke = schema.table("Ausruestungstuecke", {
  id: serial("id").primaryKey(),
  ausruestungstyp: text("Ausruestungstyp"),
  seriennummer: text("Seriennummer"),
  kamerad: text("Kamerad"),
  kameradId: integer("kamerad_id").references(() => kameraden.id, {
    onDelete: "set null",
  }),
  status: text("Status"),
  kaufdatum: text("Kaufdatum"),
  herstellungsdatum: text("Herstellungsdatum"),
  naechstePruefung: text("Naechste_Pruefung"),
  letztePruefung: text("Letzte_Pruefung"),
  lebensendeDatum: text("Lebensende_Datum"),
  qrCode: text("QR_Code"),
  waescheAnzahl: integer("Waesche_Anzahl"),
  groesse: text("Groesse"),
  notizen: text("Notizen"),
});

// ============================================================================
// PSA: AUSGABEN (Ausgabe/Rückgabe-Protokoll)
// ============================================================================
export const ausgaben = schema.table("Ausgaben", {
  id: serial("id").primaryKey(),
  ausruestungstueckId: integer("Ausruestungstueck_Id"),
  ausruestungstyp: text("Ausruestungstyp"),
  kamerad: text("Kamerad"),
  kameradId: integer("kamerad_id").references(() => kameraden.id, {
    onDelete: "set null",
  }),
  ausgabedatum: text("Ausgabedatum"),
  rueckgabedatum: text("Rueckgabedatum"),
  notizen: text("Notizen"),
});

// ============================================================================
// PSA: PRÜFUNGEN (Inspektionsprotokolle)
// ============================================================================
export const pruefungen = schema.table("Pruefungen", {
  id: serial("id").primaryKey(),
  ausruestungstueckId: integer("Ausruestungstueck_Id"),
  ausruestungstyp: text("Ausruestungstyp"),
  kamerad: text("Kamerad"),
  kameradId: integer("kamerad_id").references(() => kameraden.id, {
    onDelete: "set null",
  }),
  datum: text("Datum"),
  ergebnis: text("Ergebnis"),
  pruefer: text("Pruefer"),
  naechstePruefung: text("Naechste_Pruefung"),
  notizen: text("Notizen"),
  foto: text("Foto"),
});

// ============================================================================
// PSA: WÄSCHE (Waschzyklen)
// ============================================================================
export const waesche = schema.table("Waesche", {
  id: serial("id").primaryKey(),
  ausruestungstueckId: integer("Ausruestungstueck_Id"),
  ausruestungstyp: text("Ausruestungstyp"),
  kamerad: text("Kamerad"),
  kameradId: integer("kamerad_id").references(() => kameraden.id, {
    onDelete: "set null",
  }),
  datum: text("Datum"),
  notizen: text("Notizen"),
});

// ============================================================================
// PSA: NORMEN (DIN-Standards)
// ============================================================================
export const normen = schema.table("Normen", {
  id: serial("id").primaryKey(),
  bezeichnung: text("Bezeichnung"),
  ausruestungstypKategorie: text("Ausruestungstyp_Kategorie"),
  normbezeichnung: text("Normbezeichnung"),
  url: text("URL"),
  pruefintervallMonate: integer("Pruefintervall_Monate"),
  maxLebensdauerJahre: integer("Max_Lebensdauer_Jahre"),
  maxWaeschen: integer("Max_Waeschen"),
  beschreibung: text("Beschreibung"),
});

// ============================================================================
// PSA: CHANGELOG (Audit-Log)
// ============================================================================
export const changelog = schema.table("Changelog", {
  id: serial("id").primaryKey(),
  tabelle: text("Tabelle"),
  aktion: text("Aktion"),
  details: text("Details"),
  benutzer: text("Benutzer"),
  zeitpunkt: timestamp("Zeitpunkt", { withTimezone: true }).defaultNow(),
});

// ============================================================================
// PSA: SCHADENSDOKUMENTATION (Schadensberichte mit Fotos)
// ============================================================================
export const schadensdokumentation = schema.table("Schadensdokumentation", {
  id: serial("id").primaryKey(),
  ausruestungstueckId: integer("Ausruestungstueck_Id"),
  datum: date("Datum").defaultNow(),
  beschreibung: text("Beschreibung"),
  foto: text("Foto").notNull(),
  erstelltVon: text("Erstellt_Von"),
  erstelltAm: timestamp("Erstellt_Am", { withTimezone: true }).defaultNow(),
  ausruestungstyp: text("Ausruestungstyp"),
  seriennummer: text("Seriennummer"),
});
