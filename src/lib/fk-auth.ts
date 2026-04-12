import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import { db } from "@/lib/db";
import { fkUsers } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

function getJwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("FATAL: JWT_SECRET ist nicht gesetzt");
  return new TextEncoder().encode(secret);
}
const COOKIE_NAME = "fw_jwt";

function mapRole(payload: Record<string, unknown>): "admin" | "member" | null {
  const fkRolle = String(payload.fk_rolle || "");
  if (fkRolle === "Admin" || fkRolle === "Prüfer") return "admin";
  if (fkRolle === "Mitglied") return "member";

  const appRole = String(payload.app_role || "");
  const map: Record<string, "admin" | "member"> = {
    Admin: "admin",
    Gerätewart: "admin",
    Maschinist: "member",
  };
  return map[appRole] ?? null;
}

export interface FkAuthSession {
  user: {
    id: string;
    name: string;
    role: "admin" | "member";
    consentGiven: boolean;
    mustChangePassword: boolean;
  };
}

export async function fkAuth(): Promise<FkAuthSession | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, getJwtSecret());

    const rawId = payload.kamerad_id ?? payload.sub;
    const kameradId = String(rawId);
    const kameradName = String(
      payload.kamerad_name || payload.sub || "Unbekannt",
    );

    const fkRole = mapRole(payload as Record<string, unknown>);
    if (!fkRole) return null;

    let user = await db.query.fkUsers.findFirst({
      where: eq(fkUsers.id, kameradId),
    });

    if (!user) {
      const email =
        String(payload.email || "") || `portal-${kameradId}@portal.local`;
      await db.insert(fkUsers).values({
        id: kameradId,
        email,
        passwordHash: "portal-auth",
        name: kameradName,
        role: fkRole,
        isActive: true,
        consentGiven: false,
        mustChangePassword: false,
      });
      user = await db.query.fkUsers.findFirst({
        where: eq(fkUsers.id, kameradId),
      });
    } else {
      if (user.role !== fkRole || user.name !== kameradName) {
        await db
          .update(fkUsers)
          .set({
            role: fkRole,
            name: kameradName,
            updatedAt: new Date().toISOString(),
          })
          .where(eq(fkUsers.id, kameradId));
      }
    }

    if (!user || !user.isActive) return null;

    return {
      user: {
        id: user.id,
        name: user.name,
        role: user.role as "admin" | "member",
        consentGiven: user.consentGiven,
        mustChangePassword: user.mustChangePassword,
      },
    };
  } catch {
    return null;
  }
}
