import { NextResponse } from "next/server";
import { fkAuth } from "@/lib/fk-auth";
import { db } from "@/lib/db";
import { fkLicenseClasses, fkMemberLicenses } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { logAudit } from "@/lib/fk-audit";
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
  const existing = await db.query.fkLicenseClasses.findFirst({
    where: eq(fkLicenseClasses.id, id),
  });
  if (!existing) {
    return NextResponse.json(
      { error: "Klasse nicht gefunden" },
      { status: 404 },
    );
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

  const duplicate = await db.query.fkLicenseClasses.findFirst({
    where: eq(fkLicenseClasses.code, code.trim()),
  });
  if (duplicate && duplicate.id !== id) {
    return NextResponse.json(
      { error: `Code „${code}" ist bereits vergeben` },
      { status: 409 },
    );
  }

  await db
    .update(fkLicenseClasses)
    .set({
      code: code.trim(),
      name: name.trim(),
      description: description?.trim() || null,
      isExpiring: isExpiring ?? false,
      defaultCheckIntervalMonths: defaultCheckIntervalMonths ?? 6,
      defaultValidityYears: defaultValidityYears || null,
      sortOrder: sortOrder ?? 0,
    })
    .where(eq(fkLicenseClasses.id, id));

  await logAudit({
    userId: session.user.id,
    action: "license_class.updated",
    entityType: "license_class",
    entityId: id,
    details: { code: code.trim(), name: name.trim() },
    ipAddress: ip,
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
  const existing = await db.query.fkLicenseClasses.findFirst({
    where: eq(fkLicenseClasses.id, id),
  });
  if (!existing) {
    return NextResponse.json(
      { error: "Klasse nicht gefunden" },
      { status: 404 },
    );
  }

  const usageCount = (
    await db.query.fkMemberLicenses.findMany({
      where: eq(fkMemberLicenses.licenseClassId, id),
    })
  ).length;
  if (usageCount > 0) {
    return NextResponse.json(
      {
        error: `Kann nicht gelöscht werden – ${usageCount} Mitglied(er) nutzen diese Klasse`,
      },
      { status: 409 },
    );
  }

  await db.delete(fkLicenseClasses).where(eq(fkLicenseClasses.id, id));

  await logAudit({
    userId: session.user.id,
    action: "license_class.deleted",
    entityType: "license_class",
    entityId: id,
    details: { code: existing.code, name: existing.name },
    ipAddress: ip,
  });

  return NextResponse.json({ success: true });
}
