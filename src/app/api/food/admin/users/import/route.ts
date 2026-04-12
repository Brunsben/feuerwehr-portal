import {
  NextResponse,
  db,
  foodUsers,
  getFoodUser,
  isFoodAdmin,
  logFoodAdmin,
  generateFoodToken,
} from "../../../_shared";
import type { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const user = await getFoodUser();
    if (!user || !isFoodAdmin(user)) {
      return NextResponse.json({ error: "Nicht berechtigt" }, { status: 403 });
    }

    const body = await req.json();
    const { csv_data } = body;

    if (!csv_data || typeof csv_data !== "string") {
      return NextResponse.json(
        { error: "csv_data erforderlich" },
        { status: 400 },
      );
    }

    const lines = csv_data.split("\n").filter((l: string) => l.trim());
    if (lines.length < 2) {
      return NextResponse.json(
        { error: "CSV muss Header + Datenzeilen enthalten" },
        { status: 400 },
      );
    }

    let imported = 0;
    let skipped = 0;

    for (let i = 1; i < lines.length; i++) {
      const parts = lines[i].split(",").map((p: string) => p.trim());
      const name = parts[0];
      const personalNumber = parts[1] || null;
      const cardId = parts[2] || null;

      if (!name) {
        skipped++;
        continue;
      }

      try {
        await db.insert(foodUsers).values({
          name,
          personalNumber,
          cardId,
          mobileToken: generateFoodToken(),
        });
        imported++;
      } catch {
        skipped++;
      }
    }

    await logFoodAdmin(
      user.sub,
      "CSV-Import",
      `${imported} importiert, ${skipped} übersprungen`,
    );

    return NextResponse.json({ success: true, imported, skipped });
  } catch (error) {
    console.error("Food admin users import error:", error);
    return NextResponse.json({ error: "Interner Fehler" }, { status: 500 });
  }
}
