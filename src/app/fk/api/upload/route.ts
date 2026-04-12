import { NextResponse } from "next/server";
import { fkAuth } from "@/lib/fk-auth";
import { db } from "@/lib/db";
import {
  fkLicenseChecks,
  fkUploadedFiles,
  fkMemberLicenses,
  fkAppSettings,
} from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { v4 as uuid } from "uuid";
import { encryptAndSave, generateUploadPath } from "@/lib/fk-encryption";
import { logAudit } from "@/lib/fk-audit";
import {
  uploadLimiter,
  getClientIp,
  rateLimitResponse,
} from "@/lib/fk-rate-limit";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

export async function POST(req: Request) {
  const ip = getClientIp(req);
  const limit = uploadLimiter.check(ip);
  if (!limit.success) return rateLimitResponse(limit.retryAfterMs);

  const session = await fkAuth();
  if (!session?.user) {
    return NextResponse.json({ error: "Nicht angemeldet" }, { status: 401 });
  }

  try {
    const formData = await req.formData();
    const frontFile = formData.get("front") as File | null;
    const backFile = formData.get("back") as File | null;

    if (!frontFile) {
      return NextResponse.json(
        { error: "Vorderseite ist erforderlich" },
        { status: 400 },
      );
    }

    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/heic",
    ];
    if (!allowedTypes.includes(frontFile.type)) {
      return NextResponse.json(
        { error: "Nur Bilder (JPEG, PNG, WebP, HEIC) erlaubt" },
        { status: 400 },
      );
    }

    if (frontFile.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "Datei zu groß (max. 10 MB)" },
        { status: 400 },
      );
    }
    if (backFile && backFile.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "Rückseite zu groß (max. 10 MB)" },
        { status: 400 },
      );
    }

    const now = new Date();
    const checkDate = now.toISOString().split("T")[0];
    const checkId = uuid();

    const memberLicense = await db.query.fkMemberLicenses.findFirst({
      where: eq(fkMemberLicenses.userId, session.user.id),
    });
    const intervalMonths = memberLicense?.checkIntervalMonths || 6;
    const nextCheckDue = new Date(now);
    nextCheckDue.setMonth(nextCheckDue.getMonth() + intervalMonths);

    const retentionSetting = await db.query.fkAppSettings.findFirst({
      where: eq(fkAppSettings.key, "photo_retention_days"),
    });
    const retentionDays = retentionSetting
      ? parseInt(retentionSetting.value, 10) || 30
      : 30;
    const autoDeleteAfter = new Date(now);
    autoDeleteAfter.setDate(autoDeleteAfter.getDate() + retentionDays);

    await db.insert(fkLicenseChecks).values({
      id: checkId,
      userId: session.user.id,
      checkDate,
      checkType: "photo_upload",
      result: "pending",
      nextCheckDue: nextCheckDue.toISOString().split("T")[0],
    });

    const frontBuffer = Buffer.from(await frontFile.arrayBuffer());
    const frontPath = generateUploadPath(session.user.id, "front");
    encryptAndSave(frontBuffer, frontPath);

    await db.insert(fkUploadedFiles).values({
      id: uuid(),
      checkId,
      userId: session.user.id,
      filePath: frontPath,
      originalFilename: frontFile.name,
      mimeType: frontFile.type,
      fileSize: frontFile.size,
      side: "front",
      autoDeleteAfter: autoDeleteAfter.toISOString(),
    });

    if (backFile && allowedTypes.includes(backFile.type)) {
      const backBuffer = Buffer.from(await backFile.arrayBuffer());
      const backPath = generateUploadPath(session.user.id, "back");
      encryptAndSave(backBuffer, backPath);

      await db.insert(fkUploadedFiles).values({
        id: uuid(),
        checkId,
        userId: session.user.id,
        filePath: backPath,
        originalFilename: backFile.name,
        mimeType: backFile.type,
        fileSize: backFile.size,
        side: "back",
        autoDeleteAfter: autoDeleteAfter.toISOString(),
      });
    }

    await logAudit({
      userId: session.user.id,
      action: "photo_uploaded",
      entityType: "license_check",
      entityId: checkId,
    });

    return NextResponse.json({ success: true, checkId });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: "Fehler beim Upload" }, { status: 500 });
  }
}
