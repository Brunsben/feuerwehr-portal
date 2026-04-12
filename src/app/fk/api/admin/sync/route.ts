import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { fkAuth } from "@/lib/fk-auth";
import {
  apiLimiter,
  getClientIp,
  rateLimitResponse,
} from "@/lib/fk-rate-limit";
import { syncMembers } from "@/lib/fk-sync";

const COOKIE_NAME = "fw_jwt";

export async function POST(req: Request) {
  const ip = getClientIp(req);
  const limit = apiLimiter.check(ip);
  if (!limit.success) return rateLimitResponse(limit.retryAfterMs);

  const session = await fkAuth();
  if (!session?.user || session.user.role !== "admin") {
    return NextResponse.json({ error: "Nicht berechtigt" }, { status: 403 });
  }

  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) {
    return NextResponse.json(
      { error: "Keine Authentifizierung" },
      { status: 401 },
    );
  }

  try {
    const result = await syncMembers(token);
    return NextResponse.json(result);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Unbekannter Fehler";
    return NextResponse.json(
      { error: `Sync fehlgeschlagen: ${msg}` },
      { status: 500 },
    );
  }
}
