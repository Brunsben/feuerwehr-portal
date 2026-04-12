import { randomBytes } from "crypto";
import { db } from "./db";
import {
  foodMenus,
  foodRegistrations,
  foodGuests,
  foodUsers,
  foodAdminLog,
} from "./db/schema";
import { eq, and, sql } from "drizzle-orm";

/** Generate a random token for mobile links. */
export function generateFoodToken(): string {
  return randomBytes(24).toString("hex");
}

/** Get today's date as YYYY-MM-DD string. */
export function foodToday(): string {
  return new Date().toISOString().split("T")[0];
}

/** Get the menu for a specific date. */
export async function getFoodMenuForDate(date: string) {
  const [menu] = await db
    .select()
    .from(foodMenus)
    .where(eq(foodMenus.date, date))
    .limit(1);
  return menu || null;
}

/** Get guests for a specific date by menu choice. */
export async function getFoodGuestsForDate(date: string) {
  const rows = await db
    .select()
    .from(foodGuests)
    .where(eq(foodGuests.date, date));
  return {
    menu1: rows.find((g) => g.menuChoice === 1)?.count || 0,
    menu2: rows.find((g) => g.menuChoice === 2)?.count || 0,
  };
}

/** Get registrations for a date with user info. */
export async function getFoodRegistrationsForDate(date: string) {
  return db
    .select({
      id: foodRegistrations.id,
      userId: foodRegistrations.userId,
      menuChoice: foodRegistrations.menuChoice,
      userName: foodUsers.name,
      personalNumber: foodUsers.personalNumber,
    })
    .from(foodRegistrations)
    .innerJoin(foodUsers, eq(foodRegistrations.userId, foodUsers.id))
    .where(eq(foodRegistrations.date, date))
    .orderBy(foodUsers.name);
}

/** Check if registration is still open for a menu. */
export function isFoodRegistrationOpen(menu: {
  registrationDeadline: string;
  deadlineEnabled: boolean;
}) {
  if (!menu.deadlineEnabled) return true;
  const now = new Date();
  const [hours, minutes] = menu.registrationDeadline.split(":").map(Number);
  const deadline = new Date();
  deadline.setHours(hours, minutes, 0, 0);
  return now < deadline;
}

/** Toggle registration for a user on today. */
export async function toggleFoodRegistration(
  userId: number,
  menuChoice: number = 1,
) {
  const dateStr = foodToday();
  const [existing] = await db
    .select()
    .from(foodRegistrations)
    .where(
      and(
        eq(foodRegistrations.userId, userId),
        eq(foodRegistrations.date, dateStr),
      ),
    )
    .limit(1);

  if (existing) {
    await db
      .delete(foodRegistrations)
      .where(eq(foodRegistrations.id, existing.id));
    return { registered: false, menuChoice: existing.menuChoice };
  } else {
    await db
      .insert(foodRegistrations)
      .values({ userId, date: dateStr, menuChoice });
    return { registered: true, menuChoice };
  }
}

/** Save menu for a date. */
export async function saveFoodMenu(
  date: string,
  data: {
    description: string;
    zweiMenuesAktiv?: boolean;
    menu1Name?: string;
    menu2Name?: string;
    registrationDeadline?: string;
    deadlineEnabled?: boolean;
  },
) {
  const existing = await getFoodMenuForDate(date);
  const values = {
    date,
    description: data.description,
    zweiMenuesAktiv: data.zweiMenuesAktiv || false,
    menu1Name: data.menu1Name || null,
    menu2Name: data.menu2Name || null,
    registrationDeadline: data.registrationDeadline || "19:45",
    deadlineEnabled: data.deadlineEnabled !== false,
  };
  if (existing) {
    await db.update(foodMenus).set(values).where(eq(foodMenus.id, existing.id));
  } else {
    await db.insert(foodMenus).values(values);
  }
}

/** Set guest count for a date and menu choice. */
export async function setFoodGuestCount(
  date: string,
  menuChoice: number,
  count: number,
) {
  const [existing] = await db
    .select()
    .from(foodGuests)
    .where(
      and(eq(foodGuests.date, date), eq(foodGuests.menuChoice, menuChoice)),
    )
    .limit(1);

  if (existing) {
    await db
      .update(foodGuests)
      .set({ count: Math.max(0, count) })
      .where(eq(foodGuests.id, existing.id));
  } else if (count > 0) {
    await db
      .insert(foodGuests)
      .values({ date, menuChoice, count: Math.max(0, count) });
  }
}

/** Get registration count for a date. */
export async function getFoodRegistrationCount(date: string) {
  const [result] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(foodRegistrations)
    .where(eq(foodRegistrations.date, date));
  return result?.count || 0;
}

/** Get total count (registrations + guests) for a date. */
export async function getFoodTotalCount(date: string) {
  const regCount = await getFoodRegistrationCount(date);
  const guestData = await getFoodGuestsForDate(date);
  return regCount + guestData.menu1 + guestData.menu2;
}

/** Log a food admin action. */
export async function logFoodAdmin(
  adminUser: string,
  action: string,
  details?: string,
) {
  await db.insert(foodAdminLog).values({ adminUser, action, details });
}
