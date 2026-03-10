-- migration-authenticate-app-roles.sql
-- Erweitert authenticate() um per-User App-Rollen aus Kameraden-Tabelle.
-- Die App-Rollen (psa_rolle, food_rolle, fk_rolle) werden aus der
-- verknuepften Kameraden-Zeile gelesen und ins JWT + Response gepackt.

BEGIN;

CREATE OR REPLACE FUNCTION pxicv3djlauluse.authenticate(benutzername text, pin text)
  RETURNS json
  LANGUAGE plpgsql
  SECURITY DEFINER
AS $$
DECLARE
  u          record;
  k          record;
  token      text;
  fail_count integer;
  v_psa_rolle  text;
  v_food_rolle text;
  v_fk_rolle   text;
BEGIN
  -- Brute-Force-Schutz: Fehlversuche der letzten 15 Minuten pruefen
  SELECT count(*) INTO fail_count
    FROM pxicv3djlauluse.login_attempts la
   WHERE lower(la.benutzername) = lower(authenticate.benutzername)
     AND la.zeitpunkt > now() - interval '15 minutes'
     AND la.erfolgreich = false;
  IF fail_count >= 5 THEN
    RAISE EXCEPTION 'Zu viele Fehlversuche – Account für 15 Minuten gesperrt'
      USING ERRCODE = 'check_violation';
  END IF;

  -- Benutzer mit bcrypt-Vergleich suchen
  SELECT *
    INTO u
    FROM pxicv3djlauluse."Benutzer"
   WHERE lower("Benutzername") = lower(authenticate.benutzername)
     AND "PIN" = crypt(authenticate.pin, "PIN")
     AND "Aktiv" = true
   LIMIT 1;

  IF NOT FOUND THEN
    INSERT INTO pxicv3djlauluse.login_attempts (benutzername, erfolgreich)
      VALUES (lower(authenticate.benutzername), false);
    RAISE EXCEPTION 'Benutzername oder Passwort falsch'
      USING ERRCODE = 'invalid_password';
  END IF;

  -- Erfolgreichen Login protokollieren + alte Eintraege bereinigen
  INSERT INTO pxicv3djlauluse.login_attempts (benutzername, erfolgreich)
    VALUES (lower(authenticate.benutzername), true);
  DELETE FROM pxicv3djlauluse.login_attempts
    WHERE zeitpunkt < now() - interval '24 hours';

  -- App-Rollen aus verknuepftem Kamerad lesen (falls vorhanden)
  IF u."KameradId" IS NOT NULL THEN
    SELECT psa_rolle, food_rolle, fk_rolle
      INTO v_psa_rolle, v_food_rolle, v_fk_rolle
      FROM pxicv3djlauluse."Kameraden"
     WHERE id = u."KameradId";
  END IF;

  -- Fallback: Wenn Benutzer-Rolle Admin ist und keine KameradId
  -- verknuepft ist, bekommt er ueberall Admin-Zugriff
  IF u."Rolle" = 'Admin' AND u."KameradId" IS NULL THEN
    v_psa_rolle  := 'Admin';
    v_food_rolle := 'Admin';
    v_fk_rolle   := 'Admin';
  END IF;

  token := pxicv3djlauluse.jwt_sign(json_build_object(
    'role', 'psa_user',
    'sub',  u."Benutzername",
    'app_role', u."Rolle",
    'kamerad_id', u."KameradId",
    'psa_rolle',  v_psa_rolle,
    'food_rolle', v_food_rolle,
    'fk_rolle',   v_fk_rolle,
    'iat',  extract(epoch from now())::integer,
    'exp',  extract(epoch from now() + interval '8 hours')::integer
  ));
  RETURN json_build_object(
    'token', token,
    'user',  json_build_object(
      'Id',          u.id,
      'Benutzername', u."Benutzername",
      'Rolle',        u."Rolle",
      'KameradId',    u."KameradId",
      'psa_rolle',    v_psa_rolle,
      'food_rolle',   v_food_rolle,
      'fk_rolle',     v_fk_rolle
    )
  );
END;
$$;

COMMIT;
