import { NextResponse } from "next/server";

// GET /api/psa/health
export function GET() {
  return NextResponse.json({ status: "ok", module: "psa" });
}
