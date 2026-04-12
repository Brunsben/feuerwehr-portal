import { NextResponse } from "next/server";
import { fkAuth } from "@/lib/fk-auth";
import { db } from "@/lib/db";
import { fkUsers, fkMemberLicenses } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { v4 as uuid } from "uuid";
import { logAudit } from "@/lib/fk-audit";
import { updateMemberSchema, validateBody } from "@/lib/fk-validations";
import {
  apiLimiter,
  getClientIp,
  rateLimitResponse,
} from "@/lib/fk-rate-limit";

export async function GET(
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
    with: {
      memberLicenses: {
        with: { licenseClass: true },
      },
      licenseChecks: {
        orderBy: (checks: any, { desc }: any) => [desc(checks.checkDate)],
      },
    },
  });

  if (!member) {
    return NextResponse.json(
      { error: "Mitglied nicht gefunden" },
      { status: 404 },
    );
  }

  const { passwordHash: _pw, ...safeMember } = member;

  return NextResponse.json(safeMember);
}

export async function PUT(
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
  const body = await req.json();
  const validation = validateBody(updateMemberSchema, body);
  if (!validation.success) return validation.response;
  const { name, email, dateOfBirth, phone, role, isActive, licenses } =
    validation.data;

  await db
    .update(fkUsers)
    .set({
      name: name,
      email: email?.toLowerCase().trim(),
      dateOfBirth: dateOfBirth || null,
      phone: phone || null,
      role: role,
      isActive: isActive ?? true,
      updatedAt: new Date().toISOString(),
    })
    .where(eq(fkUsers.id, id));

  if (licenses && Array.isArray(licenses)) {
    await db.delete(fkMemberLicenses).where(eq(fkMemberLicenses.userId, id));

    for (const lic of licenses) {
      await db.insert(fkMemberLicenses).values({
        id: uuid(),
        userId: id,
        licenseClassId: lic.licenseClassId,
        issueDate: lic.issueDate || null,
        expiryDate: lic.expiryDate || null,
        checkIntervalMonths: lic.checkIntervalMonths || 6,
        restriction188: lic.restriction188 || false,
        notes: lic.notes || null,
      });
    }
  }

  await logAudit({
    userId: session.user.id,
    action: "member_updated",
    entityType: "user",
    entityId: id,
    details: { name, email },
  });

  return NextResponse.json({ success: true });
}

export async function DELETE(
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

  await db
    .update(fkUsers)
    .set({ isActive: false, updatedAt: new Date().toISOString() })
    .where(eq(fkUsers.id, id));

  await logAudit({
    userId: session.user.id,
    action: "member_deactivated",
    entityType: "user",
    entityId: id,
  });

  return NextResponse.json({ success: true });
}
