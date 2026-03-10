-- migration-app-roles.sql
-- Fuegt per-App Rollen-Spalten zur Kameraden-Tabelle hinzu.
-- Ausfuehren: cat setup/migration-app-roles.sql | docker compose exec -T postgres psql -U nocodb -d nocodb

BEGIN;

ALTER TABLE pxicv3djlauluse."Kameraden"
  ADD COLUMN IF NOT EXISTS psa_rolle TEXT,
  ADD COLUMN IF NOT EXISTS food_rolle TEXT,
  ADD COLUMN IF NOT EXISTS fk_rolle TEXT;

GRANT SELECT, UPDATE ON pxicv3djlauluse."Kameraden" TO psa_user;

COMMIT;
