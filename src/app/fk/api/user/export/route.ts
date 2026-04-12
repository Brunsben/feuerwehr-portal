import { NextResponse } from "next/server";
import { fkAuth } from "@/lib/fk-auth";
import { db } from "@/lib/db";
import { fkUsers } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { logAudit } from "@/lib/fk-audit";

export async function GET() {
  const session = await fkAuth();
  if (!session?.user) {
    return NextResponse.json({ error: "Nicht angemeldet" }, { status: 401 });
  }

  const user = await db.query.fkUsers.findFirst({
    where: eq(fkUsers.id, session.user.id),
    with: {
      memberLicenses: { with: { licenseClass: true } },
      licenseChecks: true,
      consentRecords: true,
    },
  });

  if (!user) {
    return NextResponse.json(
      { error: "Benutzer nicht gefunden" },
      { status: 404 },
    );
  }

  const { passwordHash: _pw, ...safeUser } = user;

  await logAudit({
    userId: session.user.id,
    action: "data_exported",
    entityType: "user",
    entityId: session.user.id,
  });

  return NextResponse.json({
    exportedAt: new Date().toISOString(),
    userData: safeUser,
  });
}
