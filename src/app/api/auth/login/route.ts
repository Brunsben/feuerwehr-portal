import { NextRequest, NextResponse } from "next/server";
import { compare } from "bcryptjs";
import { db } from "@/lib/db";
import { benutzer, kameraden, loginAttempts } from "@/lib/db/schema";
import { eq, and, gt, lt, sql } from "drizzle-orm";
import { signJwt, setAuthCookie, buildAppPermissions } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const username = body.benutzername || body.username;
    const password = body.pin || body.password;

    if (!username || !password) {
      return NextResponse.json(
        { error: "Benutzername und Passwort erforderlich" },
        { status: 400 },
      );
    }

    // Brute-Force-Schutz: Fehlversuche der letzten 15 Minuten prüfen
    const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
    const [failCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(loginAttempts)
      .where(
        and(
          eq(sql`lower(${loginAttempts.benutzername})`, username.toLowerCase()),
          eq(loginAttempts.erfolgreich, false),
          gt(loginAttempts.zeitpunkt, fifteenMinutesAgo),
        ),
      );

    if (failCount && failCount.count >= 5) {
      return NextResponse.json(
        { error: "Zu viele Fehlversuche – Account für 15 Minuten gesperrt" },
        { status: 429 },
      );
    }

    // Benutzer suchen
    const [user] = await db
      .select()
      .from(benutzer)
      .where(
        and(
          eq(sql`lower(${benutzer.benutzername})`, username.toLowerCase()),
          eq(benutzer.aktiv, true),
        ),
      )
      .limit(1);

    if (!user) {
      await db
        .insert(loginAttempts)
        .values({ benutzername: username.toLowerCase(), erfolgreich: false });
      return NextResponse.json(
        { error: "Benutzername oder Passwort falsch" },
        { status: 401 },
      );
    }

    // Passwort prüfen (bcrypt)
    const valid = await compare(password, user.pin);
    if (!valid) {
      await db
        .insert(loginAttempts)
        .values({ benutzername: username.toLowerCase(), erfolgreich: false });
      return NextResponse.json(
        { error: "Benutzername oder Passwort falsch" },
        { status: 401 },
      );
    }

    // Erfolgreichen Login protokollieren + alte Einträge bereinigen
    await db
      .insert(loginAttempts)
      .values({ benutzername: username.toLowerCase(), erfolgreich: true });
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    await db
      .delete(loginAttempts)
      .where(lt(loginAttempts.zeitpunkt, oneDayAgo));

    // App-Rollen aus verknüpftem Kamerad lesen
    let psaRolle: string | null = null;
    let foodRolle: string | null = null;
    let fkRolle: string | null = null;
    let kameradName: string | undefined;

    if (user.kameradId) {
      const [kamerad] = await db
        .select()
        .from(kameraden)
        .where(eq(kameraden.id, user.kameradId))
        .limit(1);
      if (kamerad) {
        psaRolle = kamerad.psaRolle;
        foodRolle = kamerad.foodRolle;
        fkRolle = kamerad.fkRolle;
        kameradName = `${kamerad.vorname} ${kamerad.name}`;
      }
    }

    // Fallback: Admin ohne Kamerad → überall Admin
    if (user.rolle === "Admin" && !user.kameradId) {
      psaRolle = "Admin";
      foodRolle = "Admin";
      fkRolle = "Admin";
    }

    // JWT signieren
    const token = await signJwt({
      role: "psa_user",
      sub: user.benutzername,
      app_role: user.rolle,
      kamerad_id: user.kameradId,
      kamerad_name: kameradName,
      psa_rolle: psaRolle,
      food_rolle: foodRolle,
      fk_rolle: fkRolle,
    });

    // Cookie setzen
    const isHttps = req.headers.get("x-forwarded-proto") === "https";
    await setAuthCookie(token, isHttps);

    // User-Info zurückgeben (Token bleibt nur im Cookie)
    return NextResponse.json({
      user: {
        Id: user.id,
        Benutzername: user.benutzername,
        Rolle: user.rolle,
        KameradId: user.kameradId,
        KameradName: kameradName,
        psa_rolle: psaRolle,
        food_rolle: foodRolle,
        fk_rolle: fkRolle,
        app_permissions: buildAppPermissions({
          rolle: user.rolle,
          psa_rolle: psaRolle,
          food_rolle: foodRolle,
          fk_rolle: fkRolle,
        }),
      },
    });
  } catch (e) {
    console.error("Login error:", e);
    return NextResponse.json({ error: "Interner Fehler" }, { status: 500 });
  }
}
