import { NextResponse } from "next/server";
import { fkAuth } from "@/lib/fk-auth";
import { db } from "@/lib/db";
import { fkUsers } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { logAudit } from "@/lib/fk-audit";
import { generateSecurePassword } from "@/lib/fk-security";
import {
  apiLimiter,
  getClientIp,
  rateLimitResponse,
} from "@/lib/fk-rate-limit";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const ip = getClientIp(req);
  const limit = apiLimiter.check(ip);
  if (!limit.success) return rateLimitResponse(limit.retryAfterMs);

  const session = await fkAuth();
  if (!session?.user || session.user.role !== "admin") {
    return NextResponse.json({ error: "Nicht berechtigt" }, { status: 403 });
  }

  const { id } = await params;

  const member = await db.query.fkUsers.findFirst({
    where: eq(fkUsers.id, id),
  });

  if (!member) {
    return NextResponse.json(
      { error: "Mitglied nicht gefunden" },
      { status: 404 },
    );
  }

  const tempPassword = generateSecurePassword();
  const passwordHash = await bcrypt.hash(tempPassword, 12);

  await db
    .update(fkUsers)
    .set({
      passwordHash,
      mustChangePassword: true,
      updatedAt: new Date().toISOString(),
    })
    .where(eq(fkUsers.id, id));

  await logAudit({
    userId: session.user.id,
    action: "password_reset",
    entityType: "user",
    entityId: id,
    details: { targetUser: member.email },
  });

  return NextResponse.json({
    success: true,
    tempPassword,
    message: `Neues temporäres Passwort für ${member.name}`,
  });
}
