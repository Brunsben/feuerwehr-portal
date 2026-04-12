import {
  NextResponse,
  db,
  foodPresetMenus,
  getFoodUser,
  isFoodAdmin,
  logFoodAdmin,
  eq,
} from "../../_shared";
import type { NextRequest } from "next/server";

export async function GET() {
  try {
    const user = await getFoodUser();
    if (!user || !isFoodAdmin(user)) {
      return NextResponse.json({ error: "Nicht berechtigt" }, { status: 403 });
    }

    const menus = await db
      .select()
      .from(foodPresetMenus)
      .orderBy(foodPresetMenus.sortOrder, foodPresetMenus.name);

    return NextResponse.json({ preset_menus: menus });
  } catch (error) {
    console.error("Preset menus GET error:", error);
    return NextResponse.json({ error: "Interner Fehler" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getFoodUser();
    if (!user || !isFoodAdmin(user)) {
      return NextResponse.json({ error: "Nicht berechtigt" }, { status: 403 });
    }

    const body = await req.json();
    const { name, sort_order } = body;

    if (!name) {
      return NextResponse.json({ error: "Name erforderlich" }, { status: 400 });
    }

    const [preset] = await db
      .insert(foodPresetMenus)
      .values({ name, sortOrder: sort_order || 0 })
      .returning();

    await logFoodAdmin(user.sub, "Voreinstellung erstellt", name);

    return NextResponse.json(
      { success: true, preset_menu: preset },
      { status: 201 },
    );
  } catch (error) {
    console.error("Preset menus POST error:", error);
    return NextResponse.json({ error: "Interner Fehler" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const user = await getFoodUser();
    if (!user || !isFoodAdmin(user)) {
      return NextResponse.json({ error: "Nicht berechtigt" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ID erforderlich" }, { status: 400 });
    }

    const [existing] = await db
      .select()
      .from(foodPresetMenus)
      .where(eq(foodPresetMenus.id, parseInt(id, 10)))
      .limit(1);

    if (!existing) {
      return NextResponse.json(
        { error: "Voreinstellung nicht gefunden" },
        { status: 404 },
      );
    }

    await db
      .delete(foodPresetMenus)
      .where(eq(foodPresetMenus.id, parseInt(id, 10)));
    await logFoodAdmin(user.sub, "Voreinstellung gelöscht", existing.name);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Preset menus DELETE error:", error);
    return NextResponse.json({ error: "Interner Fehler" }, { status: 500 });
  }
}
