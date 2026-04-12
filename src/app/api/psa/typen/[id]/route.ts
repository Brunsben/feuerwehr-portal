import {
  NextResponse,
  db,
  ausruestungstypen,
  ausruestungstuecke,
  getPsaUser,
  canEdit,
  eq,
  logChange,
} from "../../_shared";
import type { NextRequest } from "next/server";

type RouteCtx = { params: Promise<{ id: string }> };

// PATCH /api/psa/typen/[id]
export async function PATCH(req: NextRequest, { params }: RouteCtx) {
  const user = await getPsaUser();
  if (!user)
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (!canEdit(user))
    return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const { id } = await params;
  const body = await req.json();

  // Bei Namens-Änderung: Kaskade auf Ausrüstungsstücke
  if (body.bezeichnung) {
    const [old] = await db
      .select({ bezeichnung: ausruestungstypen.bezeichnung })
      .from(ausruestungstypen)
      .where(eq(ausruestungstypen.id, parseInt(id)));
    if (old && old.bezeichnung && old.bezeichnung !== body.bezeichnung) {
      await db
        .update(ausruestungstuecke)
        .set({ ausruestungstyp: body.bezeichnung })
        .where(eq(ausruestungstuecke.ausruestungstyp, old.bezeichnung));
    }
  }

  const [updated] = await db
    .update(ausruestungstypen)
    .set(body)
    .where(eq(ausruestungstypen.id, parseInt(id)))
    .returning();

  if (!updated)
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  await logChange(
    "Ausruestungstypen",
    "Bearbeitet",
    `${updated.bezeichnung || ""}`,
    user.sub,
  );
  return NextResponse.json(updated);
}

// DELETE /api/psa/typen/[id]
export async function DELETE(_req: NextRequest, { params }: RouteCtx) {
  const user = await getPsaUser();
  if (!user)
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (!canEdit(user))
    return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const { id } = await params;
  const [deleted] = await db
    .delete(ausruestungstypen)
    .where(eq(ausruestungstypen.id, parseInt(id)))
    .returning();

  if (!deleted)
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  await logChange(
    "Ausruestungstypen",
    "Gelöscht",
    `${deleted.bezeichnung || ""}`,
    user.sub,
  );
  return NextResponse.json({ ok: true });
}
