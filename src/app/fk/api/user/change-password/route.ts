import { NextResponse } from "next/server";
import { fkAuth } from "@/lib/fk-auth";
import { db } from "@/lib/db";
import { fkUsers } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { hashSync } from "bcryptjs";
import { logAudit } from "@/lib/fk-audit";
import { changePasswordSchema, validateBody } from "@/lib/fk-validations";
import {
  passwordLimiter,
  getClientIp,
  rateLimitResponse,
} from "@/lib/fk-rate-limit";

export async function POST(req: Request) {
  const ip = getClientIp(req);
  const limit = passwordLimiter.check(ip);
  if (!limit.success) return rateLimitResponse(limit.retryAfterMs);

  const session = await fkAuth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Nicht angemeldet" }, { status: 401 });
  }

  const body = await req.json();
  const validation = validateBody(changePasswordSchema, body);
  if (!validation.success) return validation.response;
  const { newPassword } = validation.data;

  const passwordHash = hashSync(newPassword, 12);

  await db
    .update(fkUsers)
    .set({
      passwordHash,
      mustChangePassword: false,
      updatedAt: new Date().toISOString(),
    })
    .where(eq(fkUsers.id, session.user.id));

  await logAudit({
    userId: session.user.id,
    action: "password_changed",
    entityType: "user",
    entityId: session.user.id,
  });

  return NextResponse.json({ success: true });
}
