import {
  NextResponse,
  foodToday,
  getFoodMenuForDate,
  getFoodRegistrationsForDate,
  getFoodGuestsForDate,
} from "../../_shared";
import type { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const date = searchParams.get("date") || foodToday();

    const menu = await getFoodMenuForDate(date);
    if (!menu) {
      return NextResponse.json({
        date,
        menu: null,
        registrations: [],
        guests: { menu1: 0, menu2: 0 },
      });
    }

    const registrations = await getFoodRegistrationsForDate(date);
    const guests = await getFoodGuestsForDate(date);

    return NextResponse.json({
      date,
      menu: {
        description: menu.description,
        zwei_menues_aktiv: menu.zweiMenuesAktiv,
        menu1_name: menu.menu1Name,
        menu2_name: menu.menu2Name,
        registration_deadline: menu.registrationDeadline,
        deadline_enabled: menu.deadlineEnabled,
      },
      registrations: registrations.map((r) => ({
        id: r.id,
        user_id: r.userId,
        user_name: r.userName,
        personal_number: r.personalNumber,
        menu_choice: r.menuChoice,
      })),
      guests,
    });
  } catch (error) {
    console.error("Food menu/data error:", error);
    return NextResponse.json({ error: "Interner Fehler" }, { status: 500 });
  }
}
