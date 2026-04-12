import {
  pgSchema,
  serial,
  text,
  boolean,
  integer,
  timestamp,
  date,
  bigint,
  uniqueIndex,
  index,
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
  typ: text("Typ"),
  bezeichnung: text("Bezeichnung"),
  hersteller: text("Hersteller"),
  norm: text("Norm"),
  maxLebensdauerJahre: bigint("Max_Lebensdauer_Jahre", { mode: "number" }),
  pruefintervallMonate: bigint("Pruefintervall_Monate", { mode: "number" }),
  maxWaeschen: bigint("Max_Waeschen", { mode: "number" }),
  beschreibung: text("Beschreibung"),
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
  herstellungsdatum: text("Herstellungsdatum"),
  naechstePruefung: text("Naechste_Pruefung"),
  lebensendeDatum: text("Lebensende_Datum"),
  qrCode: text("QR_Code"),
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
  seriennummer: text("Seriennummer"),
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
  seriennummer: text("Seriennummer"),
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
  waescheart: text("Waescheart"),
  notizen: text("Notizen"),
  seriennummer: text("Seriennummer"),
});

// ============================================================================
// PSA: NORMEN (DIN-Standards)
// ============================================================================
export const normen = schema.table("Normen", {
  id: serial("id").primaryKey(),
  bezeichnung: text("Bezeichnung"),
  beschreibung: text("Beschreibung"),
  pruefintervallMonate: bigint("Pruefintervall_Monate", { mode: "number" }),
  maxLebensdauerJahre: bigint("Max_Lebensdauer_Jahre", { mode: "number" }),
  ausruestungstypKategorie: text("Ausruestungstyp_Kategorie"),
  maxWaeschen: bigint("Max_Waeschen", { mode: "number" }),
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
  zeitpunkt: timestamp("Zeitpunkt").defaultNow(),
  datensatzId: bigint("Datensatz_Id", { mode: "number" }),
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

// ============================================================================
// FOOD: BENUTZER (Essensteilnehmer)
// ============================================================================
export const foodUsers = schema.table(
  "food_users",
  {
    id: serial("id").primaryKey(),
    name: text("name").notNull(),
    personalNumber: text("personal_number"),
    cardId: text("card_id"),
    mobileToken: text("mobile_token"),
  },
  (t) => [
    uniqueIndex("food_users_personal_number_idx").on(t.personalNumber),
    uniqueIndex("food_users_card_id_idx").on(t.cardId),
    uniqueIndex("food_users_mobile_token_idx").on(t.mobileToken),
    index("food_users_name_idx").on(t.name),
  ],
);

// ============================================================================
// FOOD: MENÜS (Tagesmenüs)
// ============================================================================
export const foodMenus = schema.table(
  "food_menus",
  {
    id: serial("id").primaryKey(),
    date: date("date", { mode: "string" }).notNull(),
    description: text("description").notNull(),
    zweiMenuesAktiv: boolean("zwei_menues_aktiv").notNull().default(false),
    menu1Name: text("menu1_name"),
    menu2Name: text("menu2_name"),
    registrationDeadline: text("registration_deadline")
      .notNull()
      .default("19:45"),
    deadlineEnabled: boolean("deadline_enabled").notNull().default(true),
  },
  (t) => [uniqueIndex("food_menus_date_idx").on(t.date)],
);

// ============================================================================
// FOOD: ANMELDUNGEN (Essensanmeldungen)
// ============================================================================
export const foodRegistrations = schema.table(
  "food_registrations",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .notNull()
      .references(() => foodUsers.id, { onDelete: "cascade" }),
    date: date("date", { mode: "string" }).notNull(),
    menuChoice: integer("menu_choice").notNull().default(1),
  },
  (t) => [
    uniqueIndex("food_reg_user_date_idx").on(t.userId, t.date),
    index("food_reg_date_idx").on(t.date, t.userId),
  ],
);

// ============================================================================
// FOOD: GÄSTE (Externe Esser pro Tag)
// ============================================================================
export const foodGuests = schema.table(
  "food_guests",
  {
    id: serial("id").primaryKey(),
    date: date("date", { mode: "string" }).notNull(),
    menuChoice: integer("menu_choice").notNull().default(1),
    count: integer("count").notNull().default(0),
  },
  (t) => [
    uniqueIndex("food_guests_date_menu_idx").on(t.date, t.menuChoice),
    index("food_guests_date_idx").on(t.date),
  ],
);

// ============================================================================
// FOOD: ADMIN-LOG (Audit-Trail)
// ============================================================================
export const foodAdminLog = schema.table(
  "food_admin_log",
  {
    id: serial("id").primaryKey(),
    timestamp: timestamp("timestamp", { mode: "string" })
      .notNull()
      .defaultNow(),
    adminUser: text("admin_user").notNull(),
    action: text("action").notNull(),
    details: text("details"),
  },
  (t) => [
    index("food_admin_log_ts_idx").on(t.timestamp),
    index("food_admin_log_user_idx").on(t.adminUser),
  ],
);

// ============================================================================
// FOOD: VORLAGEN-MENÜS (Wiederverwendbare Menü-Templates)
// ============================================================================
export const foodPresetMenus = schema.table("food_preset_menus", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  sortOrder: integer("sort_order").notNull().default(0),
});
