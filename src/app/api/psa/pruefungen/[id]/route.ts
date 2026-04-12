import {
  NextResponse,
  db,
  pruefungen,
  getPsaUser,
  canEdit,
  eq,
  logChange,
} from "../../_shared";
import type { NextRequest } from "next/server";

type RouteCtx = { params: Promise<{ id: string }> };

// PATCH /api/psa/pruefungen/[id]
export async function PATCH(req: NextRequest, { params }: RouteCtx) {
  const user = await getPsaUser();
  if (!user)
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (!canEdit(user))
    return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const { id } = await params;
  const body = await req.json();
  const [updated] = await db
    .update(pruefungen)
    .set(body)
    .where(eq(pruefungen.id, parseInt(id)))
    .returning();

  if (!updated)
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  await logChange("Pruefungen", "Bearbeitet", `ID ${id}`, user.sub);
  return NextResponse.json(updated);
}

// DELETE /api/psa/pruefungen/[id]
export async function DELETE(_req: NextRequest, { params }: RouteCtx) {
  const user = await getPsaUser();
  if (!user)
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (!canEdit(user))
    return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const { id } = await params;
  const [deleted] = await db
    .delete(pruefungen)
    .where(eq(pruefungen.id, parseInt(id)))
    .returning();

  if (!deleted)
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  await logChange("Pruefungen", "Gelöscht", `ID ${id}`, user.sub);
  return NextResponse.json({ ok: true });
}
