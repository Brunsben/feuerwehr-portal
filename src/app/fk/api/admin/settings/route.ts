import { NextResponse } from "next/server";
import { fkAuth } from "@/lib/fk-auth";
import { db } from "@/lib/db";
import { fkAppSettings } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
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

  const settings = await db.query.fkAppSettings.findMany();

  const settingsMap: Record<string, string> = {};
  for (const s of settings) {
    settingsMap[s.key] = s.value;
  }

  return NextResponse.json(settingsMap);
}

export async function PUT(req: Request) {
  const ip = getClientIp(req);
  const limit = apiLimiter.check(ip);
  if (!limit.success) return rateLimitResponse(limit.retryAfterMs);

  const session = await fkAuth();
  if (!session?.user || session.user.role !== "admin") {
    return NextResponse.json({ error: "Nicht berechtigt" }, { status: 403 });
  }

  const body = await req.json();
  const now = new Date().toISOString();

  const allowedKeys = [
    "check_interval_months",
    "reminder_weeks_before",
    "reminder_weeks_before_2",
    "license_expiry_warning_months",
    "photo_auto_delete_days",
    "privacy_policy_version",
    "fire_department_name",
  ];

  const updates: { key: string; oldValue: string; newValue: string }[] = [];

  for (const [key, value] of Object.entries(body)) {
    if (!allowedKeys.includes(key)) continue;

    const existing = await db.query.fkAppSettings.findFirst({
      where: eq(fkAppSettings.key, key),
    });
    const oldValue = existing?.value || "";

    if (oldValue === String(value)) continue;

    if (existing) {
      await db
        .update(fkAppSettings)
        .set({ value: String(value), updatedAt: now })
        .where(eq(fkAppSettings.key, key));
    } else {
      await db
        .insert(fkAppSettings)
        .values({ key, value: String(value), updatedAt: now });
    }

    updates.push({ key, oldValue, newValue: String(value) });
  }

  if (updates.length > 0) {
    await logAudit({
      userId: session.user.id,
      action: "settings_updated",
      entityType: "app_settings",
      entityId: "global",
      details: { updates },
    });
  }

  return NextResponse.json({
    success: true,
    updatedCount: updates.length,
  });
}
