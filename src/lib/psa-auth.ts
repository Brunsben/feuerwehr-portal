import { getAuthUser, type AuthUser } from "./auth";

export type PsaRolle = "Admin" | "Verwalter" | "Nur lesen";

export interface PsaUser extends AuthUser {
  psa_rolle: PsaRolle;
  kamerad_id: number | null;
}

/**
 * Prüft PSA-Berechtigung. Gibt PsaUser zurück oder null.
 * Akzeptiert Portal-Admins immer als PSA-Admin.
 */
export async function getPsaUser(): Promise<PsaUser | null> {
  const user = await getAuthUser();
  if (!user) return null;

  // Portal-Admin = PSA-Admin
  const psaRolle: PsaRolle =
    user.app_role === "Admin"
      ? "Admin"
      : (user.psa_rolle as PsaRolle) || "Nur lesen";

  return {
    ...user,
    psa_rolle: psaRolle,
    kamerad_id: user.kamerad_id ?? null,
  };
}

/** true wenn Admin oder Verwalter (Kleiderwart) */
export function canEdit(user: PsaUser): boolean {
  return user.psa_rolle === "Admin" || user.psa_rolle === "Verwalter";
}

/** true wenn nur Admin */
export function isAdmin(user: PsaUser): boolean {
  return user.psa_rolle === "Admin";
}
