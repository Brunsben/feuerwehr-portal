import { db } from "@/lib/db";
import { fkAuditLog } from "@/lib/db/schema";
import { randomUUID } from "crypto";

interface AuditEntry {
  userId?: string;
  action: string;
  entityType?: string;
  entityId?: string;
  details?: string | Record<string, unknown>;
  ipAddress?: string;
}

export async function logAudit(entry: AuditEntry) {
  const details = entry.details
    ? typeof entry.details === "string"
      ? entry.details
      : JSON.stringify(entry.details)
    : null;
  await db.insert(fkAuditLog).values({
    id: randomUUID(),
    userId: entry.userId || null,
    action: entry.action,
    entityType: entry.entityType || null,
    entityId: entry.entityId || null,
    details,
    ipAddress: entry.ipAddress || null,
  });
}

export async function logAuditWithRequest(
  req: Request,
  entry: Omit<AuditEntry, "ipAddress">,
) {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown";
  await logAudit({ ...entry, ipAddress: ip });
}
