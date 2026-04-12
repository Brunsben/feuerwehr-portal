import { NextResponse } from "next/server";
import { getFoodUser, isFoodAdmin } from "@/lib/food-auth";

export async function GET() {
  try {
    const user = await getFoodUser();
    if (!user || !isFoodAdmin(user)) {
      return NextResponse.json({ error: "Nicht berechtigt" }, { status: 403 });
    }

    const csv =
      "Name,Personalnummer,KartenID\nMax Mustermann,12345,ABC123\nErika Musterfrau,12346,DEF456\n";

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": 'attachment; filename="beispiel_import.csv"',
      },
    });
  } catch (error) {
    console.error("Example CSV error:", error);
    return NextResponse.json({ error: "Interner Fehler" }, { status: 500 });
  }
}
