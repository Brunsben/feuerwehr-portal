import { NextResponse } from "next/server";
import { fkAuth } from "@/lib/fk-auth";
import { db } from "@/lib/db";
import { fkConsentRecords } from "@/lib/db/schema";
import { eq, and, isNull } from "drizzle-orm";
import { logAudit } from "@/lib/fk-audit";

export async function POST() {
  const session = await fkAuth();
  if (!session?.user) {
    return NextResponse.json({ error: "Nicht angemeldet" }, { status: 401 });
  }

  const now = new Date().toISOString();

  await db
    .update(fkConsentRecords)
    .set({ withdrawnAt: now })
    .where(
      and(
        eq(fkConsentRecords.userId, session.user.id),
        eq(fkConsentRecords.consentType, "email_notifications"),
        isNull(fkConsentRecords.withdrawnAt),
      ),
    );

  await logAudit({
    userId: session.user.id,
    action: "consent_withdrawn",
    details: { consentType: "email_notifications" },
  });

  return NextResponse.json({ success: true });
}
