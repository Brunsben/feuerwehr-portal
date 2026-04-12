import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { kameraden } from "@/lib/db/schema";
import { getAuthUser } from "@/lib/auth";
import { eq } from "drizzle-orm";

// PATCH /api/kameraden/[id] — Kamerad aktualisieren
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
  const [updated] = await db
    .update(kameraden)
    .set(body)
    .where(eq(kameraden.id, parseInt(id)))
    .returning();

  if (!updated) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  return NextResponse.json(updated);
}

// DELETE /api/kameraden/[id] — Kamerad löschen
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
    .delete(kameraden)
    .where(eq(kameraden.id, parseInt(id)))
    .returning();

  if (!deleted) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
