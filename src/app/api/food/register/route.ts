import {
  NextResponse,
  db,
  foodUsers,
  toggleFoodRegistration,
  eq,
} from "../_shared";
import type { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { user_id, card_id, personal_number, menu_choice } = body;

    let userId = user_id;

    // Lookup by card_id or personal_number if no user_id given
    if (!userId && (card_id || personal_number)) {
      const condition = card_id
        ? eq(foodUsers.cardId, card_id)
        : eq(foodUsers.personalNumber, personal_number);
      const [found] = await db
        .select({ id: foodUsers.id })
        .from(foodUsers)
        .where(condition)
        .limit(1);
      if (!found) {
        return NextResponse.json(
          { error: "Benutzer nicht gefunden" },
          { status: 404 },
        );
      }
      userId = found.id;
    }

    if (!userId) {
      return NextResponse.json(
        { error: "user_id, card_id oder personal_number erforderlich" },
        { status: 400 },
      );
    }

    const result = await toggleFoodRegistration(userId, menu_choice || 1);

    return NextResponse.json({
      success: true,
      registered: result.registered,
      menu_choice: result.menuChoice,
    });
  } catch (error) {
    console.error("Food register error:", error);
    return NextResponse.json({ error: "Interner Fehler" }, { status: 500 });
  }
}
