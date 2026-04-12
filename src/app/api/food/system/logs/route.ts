import {
  NextResponse,
  db,
  foodAdminLog,
  getFoodUser,
  isFoodAdmin,
  desc,
} from "../../_shared";

export async function GET() {
  try {
    const user = await getFoodUser();
    if (!user || !isFoodAdmin(user)) {
      return NextResponse.json({ error: "Nicht berechtigt" }, { status: 403 });
    }

    const logs = await db
      .select()
      .from(foodAdminLog)
      .orderBy(desc(foodAdminLog.timestamp))
      .limit(100);

    return NextResponse.json({ logs });
  } catch (error) {
    console.error("Food system logs error:", error);
    return NextResponse.json({ error: "Interner Fehler" }, { status: 500 });
  }
}
