import {
  NextResponse,
  db,
  ausgaben,
  getPsaUser,
  canEdit,
  eq,
  logChange,
} from "../../_shared";
import type { NextRequest } from "next/server";

type RouteCtx = { params: Promise<{ id: string }> };

// PATCH /api/psa/ausgaben/[id]
export async function PATCH(req: NextRequest, { params }: RouteCtx) {
  const user = await getPsaUser();
  if (!user)
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (!canEdit(user))
    return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const { id } = await params;
  const body = await req.json();
  const [updated] = await db
    .update(ausgaben)
    .set(body)
    .where(eq(ausgaben.id, parseInt(id)))
    .returning();

  if (!updated)
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  await logChange("Ausgaben", "Bearbeitet", `ID ${id}`, user.sub);
  return NextResponse.json(updated);
}

// DELETE /api/psa/ausgaben/[id]
export async function DELETE(_req: NextRequest, { params }: RouteCtx) {
  const user = await getPsaUser();
  if (!user)
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (!canEdit(user))
    return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const { id } = await params;
  const [deleted] = await db
    .delete(ausgaben)
    .where(eq(ausgaben.id, parseInt(id)))
    .returning();

  if (!deleted)
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  await logChange("Ausgaben", "Gelöscht", `ID ${id}`, user.sub);
  return NextResponse.json({ ok: true });
}
