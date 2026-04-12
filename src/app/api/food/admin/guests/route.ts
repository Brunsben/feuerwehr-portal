import {
  NextResponse,
  getFoodUser,
  isFoodAdmin,
  setFoodGuestCount,
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
    const { date, menu_choice, count } = body;

    if (!date || menu_choice === undefined || count === undefined) {
      return NextResponse.json(
        { error: "date, menu_choice und count erforderlich" },
        { status: 400 },
      );
    }

    await setFoodGuestCount(date, menu_choice, count);
    await logFoodAdmin(
      user.sub,
      "Gäste aktualisiert",
      `${date}: Menü ${menu_choice} = ${count}`,
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Food admin guests error:", error);
    return NextResponse.json({ error: "Interner Fehler" }, { status: 500 });
  }
}
