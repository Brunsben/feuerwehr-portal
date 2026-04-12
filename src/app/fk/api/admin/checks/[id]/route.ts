import { NextResponse } from "next/server";
import { fkAuth } from "@/lib/fk-auth";
import { db } from "@/lib/db";
import { fkLicenseChecks, fkMemberLicenses } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { logAudit } from "@/lib/fk-audit";
import { updateCheckSchema, validateBody } from "@/lib/fk-validations";
import {
  apiLimiter,
  getClientIp,
  rateLimitResponse,
} from "@/lib/fk-rate-limit";

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
  const validation = validateBody(updateCheckSchema, body);
  if (!validation.success) return validation.response;
  const { result, rejectionReason } = validation.data;

  const check = await db.query.fkLicenseChecks.findFirst({
    where: eq(fkLicenseChecks.id, id),
  });

  if (!check) {
    return NextResponse.json(
      { error: "Kontrolle nicht gefunden" },
      { status: 404 },
    );
  }

  let nextCheckDue = check.nextCheckDue;

  if (result === "approved") {
    const memberLicense = await db.query.fkMemberLicenses.findFirst({
      where: eq(fkMemberLicenses.userId, check.userId),
    });
    const intervalMonths = memberLicense?.checkIntervalMonths || 6;
    const nextDue = new Date();
    nextDue.setMonth(nextDue.getMonth() + intervalMonths);
    nextCheckDue = nextDue.toISOString().split("T")[0];
  }

  await db
    .update(fkLicenseChecks)
    .set({
      result,
      rejectionReason: result === "rejected" ? rejectionReason : null,
      checkedByUserId: session.user.id,
      nextCheckDue,
    })
    .where(eq(fkLicenseChecks.id, id));

  await logAudit({
    userId: session.user.id,
    action: `check_${result}`,
    entityType: "license_check",
    entityId: id,
    details: { userId: check.userId, result, rejectionReason },
  });

  return NextResponse.json({ success: true });
}
