import {
  NextResponse,
  db,
  schadensdokumentation,
  getPsaUser,
  canEdit,
  eq,
  logChange,
} from "../../_shared";
import type { NextRequest } from "next/server";

type RouteCtx = { params: Promise<{ id: string }> };

// DELETE /api/psa/schaeden/[id]
export async function DELETE(_req: NextRequest, { params }: RouteCtx) {
  const user = await getPsaUser();
  if (!user)
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (!canEdit(user))
    return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const { id } = await params;
  const [deleted] = await db
    .delete(schadensdokumentation)
    .where(eq(schadensdokumentation.id, parseInt(id)))
    .returning();

  if (!deleted)
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  await logChange("Schadensdokumentation", "Gelöscht", `ID ${id}`, user.sub);
  return NextResponse.json({ ok: true });
}
