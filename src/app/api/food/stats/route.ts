import {
  NextResponse,
  db,
  foodMenus,
  foodRegistrations,
  foodGuests,
  gte,
  desc,
  sql,
} from "../_shared";
import type { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const days = Math.min(
      Math.max(parseInt(searchParams.get("days") || "7", 10) || 7, 1),
      90,
    );

    const since = new Date();
    since.setDate(since.getDate() - days);
    const sinceStr = since.toISOString().split("T")[0];

    const menuData = await db
      .select()
      .from(foodMenus)
      .where(gte(foodMenus.date, sinceStr))
      .orderBy(desc(foodMenus.date));

    const regCounts = await db
      .select({
        date: foodRegistrations.date,
        menuChoice: foodRegistrations.menuChoice,
        count: sql<number>`count(*)::int`,
      })
      .from(foodRegistrations)
      .where(gte(foodRegistrations.date, sinceStr))
      .groupBy(foodRegistrations.date, foodRegistrations.menuChoice);

    const guestData = await db
      .select()
      .from(foodGuests)
      .where(gte(foodGuests.date, sinceStr));

    const stats = menuData.map((menu) => {
      const dayRegs = regCounts.filter((r) => r.date === menu.date);
      const dayGuests = guestData.filter((g) => g.date === menu.date);
      const menu1Regs = dayRegs.find((r) => r.menuChoice === 1)?.count || 0;
      const menu2Regs = dayRegs.find((r) => r.menuChoice === 2)?.count || 0;
      const menu1Guests = dayGuests.find((g) => g.menuChoice === 1)?.count || 0;
      const menu2Guests = dayGuests.find((g) => g.menuChoice === 2)?.count || 0;

      return {
        date: menu.date,
        description: menu.description,
        menu1: menu1Regs,
        menu2: menu2Regs,
        guests_menu1: menu1Guests,
        guests_menu2: menu2Guests,
        total: menu1Regs + menu2Regs + menu1Guests + menu2Guests,
      };
    });

    return NextResponse.json({ days, stats });
  } catch (error) {
    console.error("Food stats error:", error);
    return NextResponse.json({ error: "Interner Fehler" }, { status: 500 });
  }
}
