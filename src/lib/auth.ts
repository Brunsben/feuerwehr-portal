import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

// ── Konfiguration ──────────────────────────────────────────────────────────

const COOKIE_NAME = "fw_jwt";
const COOKIE_MAX_AGE = 28800; // 8 Stunden

function getJwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("FATAL: JWT_SECRET ist nicht gesetzt");
  return new TextEncoder().encode(secret);
}

// ── Rollen → App-Berechtigungen ────────────────────────────────────────────

const ROLE_APP_MAP: Record<string, Record<string, string>> = {
  Admin: { psa: "Admin", food: "Admin", fk: "Admin" },
  Gerätewart: { psa: "Verwalter", fk: "Prüfer" },
  Maschinist: { psa: "Nur lesen", fk: "Mitglied" },
  User: { psa: "Nur lesen" },
};

export function buildAppPermissions(user: {
  rolle?: string;
  app_role?: string;
  psa_rolle?: string | null;
  food_rolle?: string | null;
  fk_rolle?: string | null;
  psaRolle?: string | null;
  foodRolle?: string | null;
  fkRolle?: string | null;
}): Record<string, string> {
  const perms: Record<string, string> = {};
  const psa = user.psa_rolle || user.psaRolle;
  const food = user.food_rolle || user.foodRolle;
  const fk = user.fk_rolle || user.fkRolle;

  if (psa || food || fk) {
    if (psa) perms.psa = psa;
    if (food) perms.food = food;
    if (fk) perms.fk = fk;
    return perms;
  }

  const rolle = user.rolle || user.app_role || "";
  return ROLE_APP_MAP[rolle] || {};
}

// ── JWT Signing ────────────────────────────────────────────────────────────

export interface JwtPayload {
  role: string;
  sub: string;
  app_role: string;
  kamerad_id: number | null;
  kamerad_name?: string;
  psa_rolle?: string | null;
  food_rolle?: string | null;
  fk_rolle?: string | null;
}

export async function signJwt(payload: JwtPayload): Promise<string> {
  return new SignJWT({ ...payload } as unknown as Record<string, unknown>)
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setIssuedAt()
    .setExpirationTime("8h")
    .sign(getJwtSecret());
}

// ── JWT Verification ───────────────────────────────────────────────────────

export interface AuthUser {
  sub: string;
  app_role: string;
  kamerad_id: number | null;
  kamerad_name?: string;
  psa_rolle?: string | null;
  food_rolle?: string | null;
  fk_rolle?: string | null;
  app_permissions: Record<string, string>;
}

export async function verifyJwt(token: string): Promise<AuthUser | null> {
  try {
    const { payload } = await jwtVerify(token, getJwtSecret());
    return {
      sub: payload.sub as string,
      app_role: payload.app_role as string,
      kamerad_id: (payload.kamerad_id as number) ?? null,
      kamerad_name: payload.kamerad_name as string | undefined,
      psa_rolle: payload.psa_rolle as string | null | undefined,
      food_rolle: payload.food_rolle as string | null | undefined,
      fk_rolle: payload.fk_rolle as string | null | undefined,
      app_permissions: buildAppPermissions(
        payload as unknown as Parameters<typeof buildAppPermissions>[0],
      ),
    };
  } catch {
    return null;
  }
}

// ── Cookie Handling ────────────────────────────────────────────────────────

export async function setAuthCookie(token: string, isHttps: boolean) {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    secure: isHttps,
    maxAge: COOKIE_MAX_AGE,
  });
}

export async function clearAuthCookie(isHttps: boolean) {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, "", {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    secure: isHttps,
    maxAge: 0,
  });
}

export async function getAuthUser(): Promise<AuthUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifyJwt(token);
}

// ── Token aus Request (für Middleware) ──────────────────────────────────────

export function getTokenFromRequest(
  cookieHeader: string | null,
): string | null {
  if (!cookieHeader) return null;
  const match = cookieHeader.match(
    new RegExp(`(?:^|;\\s*)${COOKIE_NAME}=([^;]+)`),
  );
  return match?.[1] || null;
}
