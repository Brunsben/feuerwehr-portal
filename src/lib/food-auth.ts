import { getAuthUser, type AuthUser } from "./auth";

export type FoodRolle = "Admin" | "Nutzer";

export interface FoodUser extends AuthUser {
  food_rolle: FoodRolle;
}

/** Portal-User mit Food-Rolle laden. Gibt null zurück wenn nicht eingeloggt. */
export async function getFoodUser(): Promise<FoodUser | null> {
  const user = await getAuthUser();
  if (!user) return null;

  const foodRolle: FoodRolle =
    user.app_role === "Admin"
      ? "Admin"
      : (user.food_rolle as FoodRolle) || "Nutzer";

  return { ...user, food_rolle: foodRolle };
}

/** Prüft ob der User Food-Admin ist. */
export function isFoodAdmin(user: FoodUser): boolean {
  return user.food_rolle === "Admin";
}
