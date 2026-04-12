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
import { relations } from "drizzle-orm";

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

// ============================================================================
// FK: FÜHRERSCHEINKONTROLLE (Separates PostgreSQL-Schema)
// ============================================================================
const fk = pgSchema("fw_fuehrerschein");

// FK: USERS
export const fkUsers = fk.table("users", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  name: text("name").notNull(),
  role: text("role", { enum: ["admin", "member"] })
    .notNull()
    .default("member"),
  dateOfBirth: text("date_of_birth"),
  phone: text("phone"),
  isActive: boolean("is_active").notNull().default(true),
  consentGiven: boolean("consent_given").notNull().default(false),
  mustChangePassword: boolean("must_change_password").notNull().default(true),
  createdAt: timestamp("created_at", { mode: "string" }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { mode: "string" }).notNull().defaultNow(),
});

// FK: LICENSE CLASSES
export const fkLicenseClasses = fk.table("license_classes", {
  id: text("id").primaryKey(),
  code: text("code").notNull().unique(),
  name: text("name").notNull(),
  description: text("description"),
  isExpiring: boolean("is_expiring").notNull().default(false),
  defaultCheckIntervalMonths: integer("default_check_interval_months")
    .notNull()
    .default(6),
  defaultValidityYears: integer("default_validity_years"),
  sortOrder: integer("sort_order").notNull().default(0),
});

// FK: MEMBER LICENSES
export const fkMemberLicenses = fk.table("member_licenses", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => fkUsers.id, { onDelete: "cascade" }),
  licenseClassId: text("license_class_id")
    .notNull()
    .references(() => fkLicenseClasses.id),
  issueDate: text("issue_date"),
  expiryDate: text("expiry_date"),
  checkIntervalMonths: integer("check_interval_months").notNull().default(6),
  notes: text("notes"),
  restriction188: boolean("restriction_188").notNull().default(false),
  createdAt: timestamp("created_at", { mode: "string" }).notNull().defaultNow(),
});

// FK: LICENSE CHECKS
export const fkLicenseChecks = fk.table("license_checks", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => fkUsers.id, { onDelete: "cascade" }),
  checkedByUserId: text("checked_by_user_id").references(() => fkUsers.id),
  checkDate: text("check_date").notNull(),
  checkType: text("check_type", {
    enum: ["photo_upload", "in_person"],
  }).notNull(),
  result: text("result", { enum: ["pending", "approved", "rejected"] })
    .notNull()
    .default("pending"),
  rejectionReason: text("rejection_reason"),
  nextCheckDue: text("next_check_due"),
  notes: text("notes"),
  createdAt: timestamp("created_at", { mode: "string" }).notNull().defaultNow(),
});

// FK: UPLOADED FILES
export const fkUploadedFiles = fk.table("uploaded_files", {
  id: text("id").primaryKey(),
  checkId: text("check_id")
    .notNull()
    .references(() => fkLicenseChecks.id, { onDelete: "cascade" }),
  userId: text("user_id")
    .notNull()
    .references(() => fkUsers.id, { onDelete: "cascade" }),
  filePath: text("file_path").notNull(),
  originalFilename: text("original_filename").notNull(),
  mimeType: text("mime_type").notNull(),
  fileSize: integer("file_size"),
  side: text("side", { enum: ["front", "back"] }).notNull(),
  autoDeleteAfter: text("auto_delete_after"),
  uploadedAt: timestamp("uploaded_at", { mode: "string" })
    .notNull()
    .defaultNow(),
});

// FK: CONSENT RECORDS
export const fkConsentRecords = fk.table("consent_records", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => fkUsers.id, { onDelete: "cascade" }),
  consentType: text("consent_type", {
    enum: ["data_processing", "email_notifications", "photo_upload"],
  }).notNull(),
  given: boolean("given").notNull().default(false),
  givenAt: text("given_at"),
  withdrawnAt: text("withdrawn_at"),
  policyVersion: text("policy_version").notNull(),
  method: text("method").notNull().default("web_form"),
  ipAddress: text("ip_address"),
  createdAt: timestamp("created_at", { mode: "string" }).notNull().defaultNow(),
});

// FK: NOTIFICATIONS LOG
export const fkNotificationsLog = fk.table("notifications_log", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => fkUsers.id, { onDelete: "cascade" }),
  type: text("type", {
    enum: [
      "check_reminder_4w",
      "check_reminder_1w",
      "check_overdue",
      "license_expiry_3m",
      "license_expiry_1m",
      "license_expired",
      "admin_summary",
    ],
  }).notNull(),
  subject: text("subject"),
  sentAt: timestamp("sent_at", { mode: "string" }).notNull().defaultNow(),
  status: text("status", { enum: ["sent", "failed", "pending"] })
    .notNull()
    .default("pending"),
  errorMessage: text("error_message"),
});

// FK: AUDIT LOG
export const fkAuditLog = fk.table("audit_log", {
  id: text("id").primaryKey(),
  userId: text("user_id").references(() => fkUsers.id),
  action: text("action").notNull(),
  entityType: text("entity_type"),
  entityId: text("entity_id"),
  details: text("details"),
  ipAddress: text("ip_address"),
  createdAt: timestamp("created_at", { mode: "string" }).notNull().defaultNow(),
});

// FK: APP SETTINGS
export const fkAppSettings = fk.table("app_settings", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
  updatedAt: timestamp("updated_at", { mode: "string" }).notNull().defaultNow(),
});

// ============================================================================
// FK: RELATIONS
// ============================================================================
export const fkUsersRelations = relations(fkUsers, ({ many }) => ({
  memberLicenses: many(fkMemberLicenses),
  licenseChecks: many(fkLicenseChecks, { relationName: "userChecks" }),
  checkedByMe: many(fkLicenseChecks, { relationName: "checkerChecks" }),
  uploadedFiles: many(fkUploadedFiles),
  consentRecords: many(fkConsentRecords),
  notifications: many(fkNotificationsLog),
}));

export const fkLicenseClassesRelations = relations(
  fkLicenseClasses,
  ({ many }) => ({
    memberLicenses: many(fkMemberLicenses),
  }),
);

export const fkMemberLicensesRelations = relations(
  fkMemberLicenses,
  ({ one }) => ({
    user: one(fkUsers, {
      fields: [fkMemberLicenses.userId],
      references: [fkUsers.id],
    }),
    licenseClass: one(fkLicenseClasses, {
      fields: [fkMemberLicenses.licenseClassId],
      references: [fkLicenseClasses.id],
    }),
  }),
);

export const fkLicenseChecksRelations = relations(
  fkLicenseChecks,
  ({ one, many }) => ({
    user: one(fkUsers, {
      fields: [fkLicenseChecks.userId],
      references: [fkUsers.id],
      relationName: "userChecks",
    }),
    checkedBy: one(fkUsers, {
      fields: [fkLicenseChecks.checkedByUserId],
      references: [fkUsers.id],
      relationName: "checkerChecks",
    }),
    uploadedFiles: many(fkUploadedFiles),
  }),
);

export const fkUploadedFilesRelations = relations(
  fkUploadedFiles,
  ({ one }) => ({
    check: one(fkLicenseChecks, {
      fields: [fkUploadedFiles.checkId],
      references: [fkLicenseChecks.id],
    }),
    user: one(fkUsers, {
      fields: [fkUploadedFiles.userId],
      references: [fkUsers.id],
    }),
  }),
);

export const fkConsentRecordsRelations = relations(
  fkConsentRecords,
  ({ one }) => ({
    user: one(fkUsers, {
      fields: [fkConsentRecords.userId],
      references: [fkUsers.id],
    }),
  }),
);

export const fkNotificationsLogRelations = relations(
  fkNotificationsLog,
  ({ one }) => ({
    user: one(fkUsers, {
      fields: [fkNotificationsLog.userId],
      references: [fkUsers.id],
    }),
  }),
);

// FK: TYPE EXPORTS
export type FkUser = typeof fkUsers.$inferSelect;
export type FkNewUser = typeof fkUsers.$inferInsert;
export type FkLicenseClass = typeof fkLicenseClasses.$inferSelect;
export type FkMemberLicense = typeof fkMemberLicenses.$inferSelect;
export type FkLicenseCheck = typeof fkLicenseChecks.$inferSelect;
export type FkUploadedFile = typeof fkUploadedFiles.$inferSelect;
export type FkConsentRecord = typeof fkConsentRecords.$inferSelect;
export type FkAuditLogEntry = typeof fkAuditLog.$inferSelect;
