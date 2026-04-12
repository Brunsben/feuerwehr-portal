import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { kameraden } from "@/lib/db/schema";
import { getAuthUser } from "@/lib/auth";
import { asc, eq } from "drizzle-orm";

// GET /api/kameraden — Kameraden-Liste (authentifiziert)
export async function GET() {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ error: "not_authenticated" }, { status: 401 });
  }

  const result = await db
    .select()
    .from(kameraden)
    .where(eq(kameraden.aktiv, true))
    .orderBy(asc(kameraden.name), asc(kameraden.vorname));

  return NextResponse.json(result);
}

// POST /api/kameraden — Neuen Kamerad erstellen (nur Admin)
export async function POST(req: NextRequest) {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ error: "not_authenticated" }, { status: 401 });
  }
  if (user.app_role !== "Admin") {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const [created] = await db.insert(kameraden).values(body).returning();
  return NextResponse.json(created, { status: 201 });
}
