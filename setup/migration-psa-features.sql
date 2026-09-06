-- migration-psa-features.sql
-- Erweiterungen fuer PSA-Verwaltung:
--   1) Ergebnis-/Zustandsfeld fuer Waesche
--   2) Ausbildungen (Qualifikationen) pro Kamerad
-- Ausfuehren:
--   cat setup/migration-psa-features.sql | docker compose exec -T postgres psql -U nocodb -d nocodb

BEGIN;

-- 1) Waesche: Ergebnis-/Zustandsfeld ---------------------------------------
ALTER TABLE pxicv3djlauluse."Waesche"
  ADD COLUMN IF NOT EXISTS "Ergebnis" TEXT;

-- 2) Ausbildungen (Qualifikationen) pro Kamerad ----------------------------
CREATE TABLE IF NOT EXISTS pxicv3djlauluse."Ausbildungen" (
  "id"           SERIAL PRIMARY KEY,
  "kamerad_id"   INTEGER NOT NULL
                   REFERENCES pxicv3djlauluse."Kameraden"("id") ON DELETE CASCADE,
  "Bezeichnung"  TEXT NOT NULL,
  "Erworben_Am"  DATE,
  "Notizen"      TEXT,
  "Erstellt_Am"  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE ("kamerad_id", "Bezeichnung")
);

CREATE INDEX IF NOT EXISTS "Ausbildungen_kamerad_id_idx"
  ON pxicv3djlauluse."Ausbildungen" ("kamerad_id");

-- Rechte fuer PostgREST-Rolle (Konsistenz mit uebrigen Tabellen)
GRANT SELECT, UPDATE ON pxicv3djlauluse."Waesche" TO psa_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON pxicv3djlauluse."Ausbildungen" TO psa_user;
GRANT USAGE, SELECT ON SEQUENCE pxicv3djlauluse."Ausbildungen_id_seq" TO psa_user;

COMMIT;
