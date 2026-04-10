import { NextRequest, NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { db } from "@/lib/db";
import { benutzer } from "@/lib/db/schema";
import { signJwt, setAuthCookie, buildAppPermissions } from "@/lib/auth";
import { sql } from "drizzle-orm";

export async function POST(req: NextRequest) {
  try {
    // Prüfen ob bereits Benutzer existieren
    const [result] = await db
      .select({ count: sql<number>`count(*)` })
      .from(benutzer);

    if (result.count > 0) {
      return NextResponse.json(
        { error: "System ist bereits initialisiert" },
        { status: 400 },
      );
    }

    const body = await req.json();
    const username = body.benutzername || body.username;
    const password = body.pin || body.password;

    if (!username || !password) {
      return NextResponse.json(
        { error: "Benutzername und Passwort erforderlich" },
        { status: 400 },
      );
    }

    if (password.length < 4) {
      return NextResponse.json(
        { error: "Passwort muss mindestens 4 Zeichen lang sein" },
        { status: 400 },
      );
    }

    // Passwort hashen und Admin erstellen
    const pinHash = await hash(password, 12);
    const [user] = await db
      .insert(benutzer)
      .values({
        benutzername: username,
        pin: pinHash,
        rolle: "Admin",
        aktiv: true,
      })
      .returning();

    // JWT signieren
    const token = await signJwt({
      role: "psa_user",
      sub: user.benutzername,
      app_role: user.rolle,
      kamerad_id: null,
      psa_rolle: "Admin",
      food_rolle: "Admin",
      fk_rolle: "Admin",
    });

    const isHttps = req.headers.get("x-forwarded-proto") === "https";
    await setAuthCookie(token, isHttps);

    return NextResponse.json({
      user: {
        Id: user.id,
        Benutzername: user.benutzername,
        Rolle: user.rolle,
        KameradId: null,
        psa_rolle: "Admin",
        food_rolle: "Admin",
        fk_rolle: "Admin",
        app_permissions: buildAppPermissions({ rolle: "Admin" }),
      },
    });
  } catch (e) {
    console.error("Setup error:", e);
    return NextResponse.json({ error: "Interner Fehler" }, { status: 500 });
  }
}
