import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  fkUsers,
  fkLicenseClasses,
  fkMemberLicenses,
  fkLicenseChecks,
  fkConsentRecords,
  fkNotificationsLog,
  fkAuditLog,
  fkAppSettings,
} from "@/lib/db/schema";
import crypto from "crypto";

export async function GET(req: Request) {
  const apiKey = req.headers.get("x-api-key");
  const expectedKey = process.env.BACKUP_API_KEY;
  if (
    !expectedKey ||
    expectedKey.includes("CHANGE_ME") ||
    !apiKey ||
    apiKey.length !== expectedKey.length ||
    !crypto.timingSafeEqual(Buffer.from(apiKey), Buffer.from(expectedKey))
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const allUsers = await db.select().from(fkUsers);
    const safeUsers = allUsers.map(({ passwordHash: _pw, ...rest }) => rest);

    const backup = {
      exportedAt: new Date().toISOString(),
      version: "1.0",
      tables: {
        users: safeUsers,
        licenseClasses: await db.select().from(fkLicenseClasses),
        memberLicenses: await db.select().from(fkMemberLicenses),
        licenseChecks: await db.select().from(fkLicenseChecks),
        consentRecords: await db.select().from(fkConsentRecords),
        notificationsLog: await db.select().from(fkNotificationsLog),
        auditLog: await db.select().from(fkAuditLog),
        appSettings: await db.select().from(fkAppSettings),
      },
    };

    return NextResponse.json(backup);
  } catch (error) {
    console.error("Backup export error:", error);
    return NextResponse.json(
      { error: "Backup fehlgeschlagen" },
      { status: 500 },
    );
  }
}
