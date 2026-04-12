import {
  NextResponse,
  db,
  foodUsers,
  getFoodUser,
  isFoodAdmin,
  logFoodAdmin,
  generateFoodToken,
  asc,
  sql,
} from "../../_shared";
import type { NextRequest } from "next/server";

export async function GET() {
  try {
    const user = await getFoodUser();
    if (!user || !isFoodAdmin(user)) {
      return NextResponse.json({ error: "Nicht berechtigt" }, { status: 403 });
    }

    const users = await db
      .select()
      .from(foodUsers)
      .orderBy(asc(foodUsers.name));

    return NextResponse.json({ users });
  } catch (error) {
    console.error("Food admin users GET error:", error);
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
    const { name, personal_number, card_id } = body;

    if (!name) {
      return NextResponse.json({ error: "Name erforderlich" }, { status: 400 });
    }

    const [created] = await db
      .insert(foodUsers)
      .values({
        name,
        personalNumber: personal_number || null,
        cardId: card_id || null,
        mobileToken: generateFoodToken(),
      })
      .returning();

    await logFoodAdmin(user.sub, "Benutzer erstellt", name);

    return NextResponse.json({ success: true, user: created }, { status: 201 });
  } catch (error) {
    console.error("Food admin users POST error:", error);
    return NextResponse.json({ error: "Interner Fehler" }, { status: 500 });
  }
}
