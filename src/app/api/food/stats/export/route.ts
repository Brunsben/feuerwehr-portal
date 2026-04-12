import {
  NextResponse,
  db,
  foodRegistrations,
  foodUsers,
  foodMenus,
  getFoodUser,
  isFoodAdmin,
  eq,
  gte,
  desc,
} from "../../_shared";

export async function GET() {
  try {
    const user = await getFoodUser();
    if (!user || !isFoodAdmin(user)) {
      return NextResponse.json({ error: "Nicht berechtigt" }, { status: 403 });
    }

    const since = new Date();
    since.setDate(since.getDate() - 365);
    const sinceStr = since.toISOString().split("T")[0];

    const data = await db
      .select({
        date: foodRegistrations.date,
        userName: foodUsers.name,
        personalNumber: foodUsers.personalNumber,
        menuChoice: foodRegistrations.menuChoice,
        menuDescription: foodMenus.description,
      })
      .from(foodRegistrations)
      .innerJoin(foodUsers, eq(foodRegistrations.userId, foodUsers.id))
      .leftJoin(foodMenus, eq(foodRegistrations.date, foodMenus.date))
      .where(gte(foodRegistrations.date, sinceStr))
      .orderBy(desc(foodRegistrations.date), foodUsers.name);

    const lines = ["Datum;Name;Personalnummer;Menüwahl;Menübeschreibung"];
    for (const row of data) {
      lines.push(
        `${row.date};${row.userName};${row.personalNumber};Menü ${row.menuChoice};${row.menuDescription || ""}`,
      );
    }

    const csv = lines.join("\n");
    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="essensmeldung_export_${new Date().toISOString().split("T")[0]}.csv"`,
      },
    });
  } catch (error) {
    console.error("Food stats export error:", error);
    return NextResponse.json({ error: "Interner Fehler" }, { status: 500 });
  }
}
