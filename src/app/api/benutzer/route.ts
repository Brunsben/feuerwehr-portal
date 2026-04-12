import { NextRequest, NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { db } from "@/lib/db";
import { benutzer } from "@/lib/db/schema";
import { getAuthUser } from "@/lib/auth";
import { asc } from "drizzle-orm";

// GET /api/benutzer — Benutzer-Liste (nur Admin)
export async function GET() {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ error: "not_authenticated" }, { status: 401 });
  }
  if (user.app_role !== "Admin") {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const result = await db
    .select({
      id: benutzer.id,
      Benutzername: benutzer.benutzername,
      Rolle: benutzer.rolle,
      KameradId: benutzer.kameradId,
      Aktiv: benutzer.aktiv,
    })
    .from(benutzer)
    .orderBy(asc(benutzer.benutzername));

  return NextResponse.json(result);
}

// POST /api/benutzer — Neuen Benutzer erstellen (nur Admin)
export async function POST(req: NextRequest) {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ error: "not_authenticated" }, { status: 401 });
  }
  if (user.app_role !== "Admin") {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const body = await req.json();
  if (!body.Benutzername || !body.PIN) {
    return NextResponse.json(
      { error: "Benutzername und PIN erforderlich" },
      { status: 400 },
    );
  }

  const pinHash = await hash(body.PIN, 12);
  const [created] = await db
    .insert(benutzer)
    .values({
      benutzername: body.Benutzername,
      pin: pinHash,
      rolle: body.Rolle || "User",
      kameradId: body.KameradId || null,
      aktiv: body.Aktiv !== false,
    })
    .returning({
      id: benutzer.id,
      Benutzername: benutzer.benutzername,
      Rolle: benutzer.rolle,
      KameradId: benutzer.kameradId,
      Aktiv: benutzer.aktiv,
    });

  return NextResponse.json(created, { status: 201 });
}
