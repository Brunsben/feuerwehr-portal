import { NextResponse } from "next/server";
import { fkAuth } from "@/lib/fk-auth";
import { db } from "@/lib/db";
import { fkLicenseChecks, fkMemberLicenses } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { v4 as uuid } from "uuid";
import { logAudit } from "@/lib/fk-audit";
import { createCheckSchema, validateBody } from "@/lib/fk-validations";
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

  const isAdmin = session.user.role === "admin";

  const checks = await db.query.fkLicenseChecks.findMany({
    where: isAdmin ? undefined : eq(fkLicenseChecks.userId, session.user.id),
    with: {
      user: true,
      checkedBy: true,
      uploadedFiles: true,
    },
    orderBy: (c: any, { desc }: any) => [desc(c.checkDate)],
  });

  const safeChecks = checks.map((check: any) => {
    const { user, checkedBy, ...rest } = check;
    const { passwordHash: _pw1, ...safeUser } = user || {};
    const { passwordHash: _pw2, ...safeChecker } = checkedBy || {};
    return {
      ...rest,
      user: safeUser,
      checkedBy: check.checkedBy ? safeChecker : null,
    };
  });

  return NextResponse.json(safeChecks);
}

export async function POST(req: Request) {
  const ip = getClientIp(req);
  const limit = apiLimiter.check(ip);
  if (!limit.success) return rateLimitResponse(limit.retryAfterMs);

  const session = await fkAuth();
  if (!session?.user || session.user.role !== "admin") {
    return NextResponse.json({ error: "Nicht berechtigt" }, { status: 403 });
  }

  const body = await req.json();
  const validation = validateBody(createCheckSchema, body);
  if (!validation.success) return validation.response;
  const { userId, checkType, result, notes } = validation.data;

  const now = new Date();
  const checkDate = now.toISOString().split("T")[0];

  const memberLicense = await db.query.fkMemberLicenses.findFirst({
    where: eq(fkMemberLicenses.userId, userId),
  });
  const intervalMonths = memberLicense?.checkIntervalMonths || 6;
  const nextCheckDue = new Date(now);
  nextCheckDue.setMonth(nextCheckDue.getMonth() + intervalMonths);

  const checkId = uuid();

  await db.insert(fkLicenseChecks).values({
    id: checkId,
    userId,
    checkedByUserId: session.user.id,
    checkDate,
    checkType: checkType || "in_person",
    result: result || "approved",
    nextCheckDue: nextCheckDue.toISOString().split("T")[0],
    notes: notes || null,
  });

  await logAudit({
    userId: session.user.id,
    action: `check_${result || "approved"}`,
    entityType: "license_check",
    entityId: checkId,
    details: { userId, checkType: checkType || "in_person" },
  });

  return NextResponse.json({ success: true, checkId });
}
