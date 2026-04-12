import { NextResponse } from "next/server";
import { fkAuth } from "@/lib/fk-auth";
import { db } from "@/lib/db";
import { fkMemberLicenses } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { v4 as uuid } from "uuid";
import { logAudit } from "@/lib/fk-audit";
import { updateUserLicensesSchema, validateBody } from "@/lib/fk-validations";
import {
  apiLimiter,
  getClientIp,
  rateLimitResponse,
} from "@/lib/fk-rate-limit";

export async function GET(req: Request) {
  const ip = getClientIp(req);
  const limit = apiLimiter.check(ip);
  if (!limit.success) return rateLimitResponse(limit.retryAfterMs);

  const session = await fkAuth();
  if (!session?.user) {
    return NextResponse.json({ error: "Nicht angemeldet" }, { status: 401 });
  }

  const licenses = await db.query.fkMemberLicenses.findMany({
    where: eq(fkMemberLicenses.userId, session.user.id),
    with: { licenseClass: true },
  });

  return NextResponse.json(licenses);
}

export async function PUT(req: Request) {
  const ip = getClientIp(req);
  const limit = apiLimiter.check(ip);
  if (!limit.success) return rateLimitResponse(limit.retryAfterMs);

  const session = await fkAuth();
  if (!session?.user) {
    return NextResponse.json({ error: "Nicht angemeldet" }, { status: 401 });
  }

  const body = await req.json();
  const validation = validateBody(updateUserLicensesSchema, body);
  if (!validation.success) return validation.response;

  const { licenses } = validation.data;
  const userId = session.user.id;

  // Delete-All + Re-Insert (same pattern as admin)
  await db.delete(fkMemberLicenses).where(eq(fkMemberLicenses.userId, userId));

  for (const lic of licenses) {
    if (!lic.licenseClassId) continue;
    await db.insert(fkMemberLicenses).values({
      id: uuid(),
      userId,
      licenseClassId: lic.licenseClassId,
      issueDate: lic.issueDate || null,
      expiryDate: lic.expiryDate || null,
      checkIntervalMonths: 6,
      restriction188: lic.restriction188 || false,
    });
  }

  await logAudit({
    userId,
    action: "user_licenses_self_updated",
    entityType: "user",
    entityId: userId,
    details: { count: licenses.length },
  });

  return NextResponse.json({ success: true });
}
