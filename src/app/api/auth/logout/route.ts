import { NextRequest, NextResponse } from "next/server";
import { clearAuthCookie } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const isHttps = req.headers.get("x-forwarded-proto") === "https";
  await clearAuthCookie(isHttps);
  return NextResponse.json({ ok: true });
}
