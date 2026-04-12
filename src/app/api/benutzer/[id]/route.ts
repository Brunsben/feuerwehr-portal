import { NextRequest, NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { db } from "@/lib/db";
import { benutzer } from "@/lib/db/schema";
import { getAuthUser } from "@/lib/auth";
import { eq } from "drizzle-orm";

// PATCH /api/benutzer/[id] — Benutzer aktualisieren (nur Admin)
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ error: "not_authenticated" }, { status: 401 });
  }
  if (user.app_role !== "Admin") {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const body = await req.json();

  // Wenn neues Passwort gesetzt wird, hashen
  const updates: Record<string, unknown> = {};
  if (body.Benutzername !== undefined) updates.benutzername = body.Benutzername;
  if (body.Rolle !== undefined) updates.rolle = body.Rolle;
  if (body.KameradId !== undefined) updates.kameradId = body.KameradId;
  if (body.Aktiv !== undefined) updates.aktiv = body.Aktiv;
  if (body.PIN) {
    updates.pin = await hash(body.PIN, 12);
  }

  const [updated] = await db
    .update(benutzer)
    .set(updates)
    .where(eq(benutzer.id, parseInt(id)))
    .returning({
      id: benutzer.id,
      Benutzername: benutzer.benutzername,
      Rolle: benutzer.rolle,
      KameradId: benutzer.kameradId,
      Aktiv: benutzer.aktiv,
    });

  if (!updated) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  return NextResponse.json(updated);
}

// DELETE /api/benutzer/[id] — Benutzer löschen (nur Admin)
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ error: "not_authenticated" }, { status: 401 });
  }
  if (user.app_role !== "Admin") {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const [deleted] = await db
    .delete(benutzer)
    .where(eq(benutzer.id, parseInt(id)))
    .returning();

  if (!deleted) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
