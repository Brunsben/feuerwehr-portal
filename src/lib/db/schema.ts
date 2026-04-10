import {
  pgSchema,
  serial,
  text,
  boolean,
  integer,
  timestamp,
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
  // Kleidergrößen
  hoseGroesse: text("HoseGroesse"),
  jackeGroesse: text("JackeGroesse"),
  handschuhGroesse: text("HandschuhGroesse"),
  stiefelGroesse: text("StiefelGroesse"),
  helmGroesse: text("HelmGroesse"),
  shirtGroesse: text("ShirtGroesse"),
  poloShirtGroesse: text("PoloShirtGroesse"),
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
