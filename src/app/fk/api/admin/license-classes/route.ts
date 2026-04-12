import { NextResponse } from "next/server";
import { fkAuth } from "@/lib/fk-auth";
import { db } from "@/lib/db";
import { fkLicenseClasses } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { v4 as uuid } from "uuid";
import { logAudit } from "@/lib/fk-audit";
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
  if (!session?.user || session.user.role !== "admin") {
    return NextResponse.json({ error: "Nicht berechtigt" }, { status: 403 });
  }

  const classes = await db.query.fkLicenseClasses.findMany({
    orderBy: (c: any, { asc }: any) => [asc(c.sortOrder)],
  });

  return NextResponse.json(classes);
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
  const {
    code,
    name,
    description,
    isExpiring,
    defaultCheckIntervalMonths,
    defaultValidityYears,
    sortOrder,
  } = body;

  if (!code?.trim() || !name?.trim()) {
    return NextResponse.json(
      { error: "Code und Name sind Pflichtfelder" },
      { status: 400 },
    );
  }

  const existing = await db.query.fkLicenseClasses.findFirst({
    where: eq(fkLicenseClasses.code, code.trim()),
  });
  if (existing) {
    return NextResponse.json(
      { error: `Klasse mit Code „${code}" existiert bereits` },
      { status: 409 },
    );
  }

  const id = uuid();
  await db.insert(fkLicenseClasses).values({
    id,
    code: code.trim(),
    name: name.trim(),
    description: description?.trim() || null,
    isExpiring: isExpiring ?? false,
    defaultCheckIntervalMonths: defaultCheckIntervalMonths ?? 6,
    defaultValidityYears: defaultValidityYears || null,
    sortOrder: sortOrder ?? 0,
  });

  await logAudit({
    userId: session.user.id,
    action: "license_class.created",
    entityType: "license_class",
    entityId: id,
    details: { code: code.trim(), name: name.trim() },
    ipAddress: ip,
  });

  return NextResponse.json(
    { id, code: code.trim(), name: name.trim() },
    { status: 201 },
  );
}
