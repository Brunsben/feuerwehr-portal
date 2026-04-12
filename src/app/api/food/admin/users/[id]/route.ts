import {
  NextResponse,
  db,
  foodUsers,
  getFoodUser,
  isFoodAdmin,
  logFoodAdmin,
  eq,
} from "../../../_shared";
import type { NextRequest } from "next/server";

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: RouteParams) {
  try {
    const user = await getFoodUser();
    if (!user || !isFoodAdmin(user)) {
      return NextResponse.json({ error: "Nicht berechtigt" }, { status: 403 });
    }

    const { id } = await params;
    const [found] = await db
      .select()
      .from(foodUsers)
      .where(eq(foodUsers.id, parseInt(id, 10)))
      .limit(1);

    if (!found) {
      return NextResponse.json(
        { error: "Benutzer nicht gefunden" },
        { status: 404 },
      );
    }

    return NextResponse.json({ user: found });
  } catch (error) {
    console.error("Food admin user GET error:", error);
    return NextResponse.json({ error: "Interner Fehler" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: RouteParams) {
  try {
    const user = await getFoodUser();
    if (!user || !isFoodAdmin(user)) {
      return NextResponse.json({ error: "Nicht berechtigt" }, { status: 403 });
    }

    const { id } = await params;
    const userId = parseInt(id, 10);

    const [existing] = await db
      .select()
      .from(foodUsers)
      .where(eq(foodUsers.id, userId))
      .limit(1);

    if (!existing) {
      return NextResponse.json(
        { error: "Benutzer nicht gefunden" },
        { status: 404 },
      );
    }

    const body = await req.json();
    const updates: Record<string, unknown> = {};
    if (body.name !== undefined) updates.name = body.name;
    if (body.personal_number !== undefined)
      updates.personalNumber = body.personal_number;
    if (body.card_id !== undefined) updates.cardId = body.card_id;

    const [updated] = await db
      .update(foodUsers)
      .set(updates)
      .where(eq(foodUsers.id, userId))
      .returning();

    await logFoodAdmin(
      user.sub,
      "Benutzer bearbeitet",
      `${existing.name} → ${updated.name}`,
    );

    return NextResponse.json({ success: true, user: updated });
  } catch (error) {
    console.error("Food admin user PUT error:", error);
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
    const userId = parseInt(id, 10);

    const [existing] = await db
      .select()
      .from(foodUsers)
      .where(eq(foodUsers.id, userId))
      .limit(1);

    if (!existing) {
      return NextResponse.json(
        { error: "Benutzer nicht gefunden" },
        { status: 404 },
      );
    }

    await db.delete(foodUsers).where(eq(foodUsers.id, userId));
    await logFoodAdmin(user.sub, "Benutzer gelöscht", existing.name);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Food admin user DELETE error:", error);
    return NextResponse.json({ error: "Interner Fehler" }, { status: 500 });
  }
}
