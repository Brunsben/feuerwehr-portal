import {
  NextResponse,
  db,
  foodUsers,
  foodMenus,
  foodRegistrations,
  sql,
} from "../../_shared";

export async function GET() {
  try {
    const [userCount] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(foodUsers);
    const [menuCount] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(foodMenus);
    const [regCount] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(foodRegistrations);

    return NextResponse.json({
      status: "ok",
      database: "connected",
      counts: {
        users: userCount?.count || 0,
        menus: menuCount?.count || 0,
        registrations: regCount?.count || 0,
      },
    });
  } catch (error) {
    console.error("Food health check error:", error);
    return NextResponse.json(
      {
        status: "error",
        database: "disconnected",
        error: error instanceof Error ? error.message : "Unbekannter Fehler",
      },
      { status: 503 },
    );
  }
}
