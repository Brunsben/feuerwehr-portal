import {
  NextResponse,
  db,
  ausruestungstuecke,
  getPsaUser,
  canEdit,
  eq,
  logChange,
} from "../../_shared";
import type { NextRequest } from "next/server";

type RouteCtx = { params: Promise<{ id: string }> };

// GET /api/psa/ausruestung/[id]
export async function GET(_req: NextRequest, { params }: RouteCtx) {
  const user = await getPsaUser();
  if (!user)
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { id } = await params;
  const [item] = await db
    .select()
    .from(ausruestungstuecke)
    .where(eq(ausruestungstuecke.id, parseInt(id)));

  if (!item) return NextResponse.json({ error: "not_found" }, { status: 404 });
  return NextResponse.json(item);
}

// PATCH /api/psa/ausruestung/[id]
export async function PATCH(req: NextRequest, { params }: RouteCtx) {
  const user = await getPsaUser();
  if (!user)
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (!canEdit(user))
    return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const { id } = await params;
  const body = await req.json();
  const [updated] = await db
    .update(ausruestungstuecke)
    .set(body)
    .where(eq(ausruestungstuecke.id, parseInt(id)))
    .returning();

  if (!updated)
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  await logChange(
    "Ausruestungstuecke",
    "Bearbeitet",
    `${updated.ausruestungstyp || ""} ${updated.seriennummer || ""}`.trim(),
    user.sub,
  );
  return NextResponse.json(updated);
}

// DELETE /api/psa/ausruestung/[id]
export async function DELETE(_req: NextRequest, { params }: RouteCtx) {
  const user = await getPsaUser();
  if (!user)
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (!canEdit(user))
    return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const { id } = await params;
  const [deleted] = await db
    .delete(ausruestungstuecke)
    .where(eq(ausruestungstuecke.id, parseInt(id)))
    .returning();

  if (!deleted)
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  await logChange(
    "Ausruestungstuecke",
    "Gelöscht",
    `${deleted.ausruestungstyp || ""} ${deleted.seriennummer || ""}`.trim(),
    user.sub,
  );
  return NextResponse.json({ ok: true });
}
