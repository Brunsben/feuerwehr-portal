import { NextResponse } from "next/server";
import { fkAuth } from "@/lib/fk-auth";
import { db } from "@/lib/db";
import { fkUsers } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
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

  const allMembers = await db.query.fkUsers.findMany({
    where: eq(fkUsers.isActive, true),
    with: {
      memberLicenses: {
        with: { licenseClass: true },
      },
    },
    orderBy: (u: any, { asc }: any) => [asc(u.name)],
  });

  const safeMembers = allMembers.map(({ passwordHash: _pw, ...rest }) => rest);

  return NextResponse.json(safeMembers);
}
