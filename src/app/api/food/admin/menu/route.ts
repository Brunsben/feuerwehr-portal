import {
  NextResponse,
  getFoodUser,
  isFoodAdmin,
  saveFoodMenu,
  logFoodAdmin,
} from "../../_shared";
import type { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const user = await getFoodUser();
    if (!user || !isFoodAdmin(user)) {
      return NextResponse.json({ error: "Nicht berechtigt" }, { status: 403 });
    }

    const body = await req.json();
    const { date, description } = body;

    if (!date || !description) {
      return NextResponse.json(
        { error: "date und description erforderlich" },
        { status: 400 },
      );
    }

    await saveFoodMenu(date, {
      description,
      zweiMenuesAktiv: body.zwei_menues_aktiv,
      menu1Name: body.menu1_name,
      menu2Name: body.menu2_name,
      registrationDeadline: body.registration_deadline,
      deadlineEnabled: body.deadline_enabled,
    });

    await logFoodAdmin(user.sub, "Menü gespeichert", `${date}: ${description}`);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Food admin menu error:", error);
    return NextResponse.json({ error: "Interner Fehler" }, { status: 500 });
  }
}
