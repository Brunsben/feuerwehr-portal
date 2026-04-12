import {
  NextResponse,
  foodToday,
  getFoodMenuForDate,
  getFoodRegistrationsForDate,
  getFoodGuestsForDate,
} from "../../_shared";

export async function GET() {
  try {
    const date = foodToday();
    const menu = await getFoodMenuForDate(date);

    if (!menu) {
      return NextResponse.json({
        date,
        has_menu: false,
        menu1: { name: "Menü 1", registrations: 0, guests: 0, total: 0 },
        menu2: { name: "Menü 2", registrations: 0, guests: 0, total: 0 },
        total: 0,
      });
    }

    const registrations = await getFoodRegistrationsForDate(date);
    const guests = await getFoodGuestsForDate(date);

    const menu1Regs = registrations.filter((r) => r.menuChoice === 1).length;
    const menu2Regs = registrations.filter((r) => r.menuChoice === 2).length;

    return NextResponse.json({
      date,
      has_menu: true,
      description: menu.description,
      menu1: {
        name: menu.menu1Name || "Menü 1",
        registrations: menu1Regs,
        guests: guests.menu1,
        total: menu1Regs + guests.menu1,
      },
      menu2: {
        name: menu.menu2Name || "Menü 2",
        registrations: menu2Regs,
        guests: guests.menu2,
        total: menu2Regs + guests.menu2,
      },
      total: menu1Regs + menu2Regs + guests.menu1 + guests.menu2,
      zwei_menues_aktiv: menu.zweiMenuesAktiv,
    });
  } catch (error) {
    console.error("Food kitchen/data error:", error);
    return NextResponse.json({ error: "Interner Fehler" }, { status: 500 });
  }
}
