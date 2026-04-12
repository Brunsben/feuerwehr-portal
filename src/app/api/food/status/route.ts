import {
  NextResponse,
  db,
  foodUsers,
  foodToday,
  getFoodMenuForDate,
  getFoodGuestsForDate,
  getFoodRegistrationsForDate,
  isFoodRegistrationOpen,
  asc,
} from "../_shared";

export async function GET() {
  try {
    const date = foodToday();
    const menu = await getFoodMenuForDate(date);

    if (!menu) {
      return NextResponse.json({
        date,
        hasMenu: false,
        menu: null,
        registrations: [],
        guests: { menu1: 0, menu2: 0 },
        registrationOpen: false,
        users: [],
      });
    }

    const registrations = await getFoodRegistrationsForDate(date);
    const guests = await getFoodGuestsForDate(date);
    const registrationOpen = isFoodRegistrationOpen(menu);

    // Load all users for the admin/touch grid
    const allUsers = await db
      .select()
      .from(foodUsers)
      .orderBy(asc(foodUsers.name));

    const registeredIds = new Set(registrations.map((r) => r.userId));

    return NextResponse.json({
      date,
      hasMenu: true,
      menu: {
        description: menu.description,
        zweiMenuesAktiv: menu.zweiMenuesAktiv,
        menu1Name: menu.menu1Name,
        menu2Name: menu.menu2Name,
        registrationDeadline: menu.registrationDeadline,
        deadlineEnabled: menu.deadlineEnabled,
      },
      registrationOpen,
      registrations: registrations.map((r) => ({
        id: r.id,
        userId: r.userId,
        userName: r.userName,
        personalNumber: r.personalNumber,
        menuChoice: r.menuChoice,
      })),
      guests,
      registrationCount: registrations.length,
      users: allUsers.map((u) => {
        const reg = registrations.find((r) => r.userId === u.id);
        return {
          id: u.id,
          name: u.name,
          personalNumber: u.personalNumber,
          cardId: u.cardId,
          registered: registeredIds.has(u.id),
          menuChoice: reg?.menuChoice ?? null,
        };
      }),
    });
  } catch (error) {
    console.error("Food status error:", error);
    return NextResponse.json({ error: "Interner Fehler" }, { status: 500 });
  }
}
