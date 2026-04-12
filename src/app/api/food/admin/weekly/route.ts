import {
  NextResponse,
  db,
  foodMenus,
  getFoodUser,
  isFoodAdmin,
  logFoodAdmin,
  eq,
  gte,
  asc,
} from "../../_shared";
import type { NextRequest } from "next/server";

export async function GET() {
  try {
    const user = await getFoodUser();
    if (!user || !isFoodAdmin(user)) {
      return NextResponse.json({ error: "Nicht berechtigt" }, { status: 403 });
    }

    const today = new Date().toISOString().split("T")[0];
    const menus = await db
      .select()
      .from(foodMenus)
      .where(gte(foodMenus.date, today))
      .orderBy(asc(foodMenus.date));

    return NextResponse.json(menus);
  } catch (error) {
    console.error("Weekly GET error:", error);
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
    const { date } = body;

    if (!date) {
      return NextResponse.json(
        { error: "Datum erforderlich" },
        { status: 400 },
      );
    }

    // Check if menu already exists for this date
    const [existing] = await db
      .select()
      .from(foodMenus)
      .where(eq(foodMenus.date, date))
      .limit(1);

    if (existing) {
      return NextResponse.json(existing);
    }

    const [created] = await db
      .insert(foodMenus)
      .values({
        date,
        description: "",
        zweiMenuesAktiv: false,
        menu1Name: null,
        menu2Name: null,
        registrationDeadline: "19:45",
        deadlineEnabled: true,
      })
      .returning();

    await logFoodAdmin(user.sub, "Wochenplan: Tag hinzugefügt", date);
    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    console.error("Weekly POST error:", error);
    return NextResponse.json({ error: "Interner Fehler" }, { status: 500 });
  }
}
