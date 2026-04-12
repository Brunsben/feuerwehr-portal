import {
  NextResponse,
  db,
  foodMenus,
  getFoodUser,
  isFoodAdmin,
  logFoodAdmin,
  eq,
} from "../../../_shared";
import type { NextRequest } from "next/server";

type RouteParams = { params: Promise<{ id: string }> };

export async function PUT(req: NextRequest, { params }: RouteParams) {
  try {
    const user = await getFoodUser();
    if (!user || !isFoodAdmin(user)) {
      return NextResponse.json({ error: "Nicht berechtigt" }, { status: 403 });
    }

    const { id } = await params;
    const menuId = parseInt(id, 10);
    const body = await req.json();

    const updates: Record<string, unknown> = {};
    if (body.description !== undefined) updates.description = body.description;
    if (body.zweiMenuesAktiv !== undefined)
      updates.zweiMenuesAktiv = body.zweiMenuesAktiv;
    if (body.menu1Name !== undefined) updates.menu1Name = body.menu1Name;
    if (body.menu2Name !== undefined) updates.menu2Name = body.menu2Name;
    if (body.registrationDeadline !== undefined)
      updates.registrationDeadline = body.registrationDeadline;
    if (body.deadlineEnabled !== undefined)
      updates.deadlineEnabled = body.deadlineEnabled;

    const [updated] = await db
      .update(foodMenus)
      .set(updates)
      .where(eq(foodMenus.id, menuId))
      .returning();

    if (!updated) {
      return NextResponse.json(
        { error: "Menü nicht gefunden" },
        { status: 404 },
      );
    }

    await logFoodAdmin(
      user.sub,
      "Wochenplan: Tag bearbeitet",
      `${updated.date}: ${updated.description}`,
    );

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Weekly PUT error:", error);
    return NextResponse.json({ error: "Interner Fehler" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: RouteParams) {
  try {
    const user = await getFoodUser();
    if (!user || !isFoodAdmin(user)) {
      return NextResponse.json({ error: "Nicht berechtigt" }, { status: 403 });
    }

    const { id } = await params;
    const menuId = parseInt(id, 10);

    const [deleted] = await db
      .delete(foodMenus)
      .where(eq(foodMenus.id, menuId))
      .returning();

    if (!deleted) {
      return NextResponse.json(
        { error: "Menü nicht gefunden" },
        { status: 404 },
      );
    }

    await logFoodAdmin(user.sub, "Wochenplan: Tag gelöscht", deleted.date);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Weekly DELETE error:", error);
    return NextResponse.json({ error: "Interner Fehler" }, { status: 500 });
  }
}
