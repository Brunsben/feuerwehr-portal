import {
  NextResponse,
  db,
  schadensdokumentation,
  getPsaUser,
  canEdit,
  desc,
  eq,
  logChange,
} from "../_shared";
import type { NextRequest } from "next/server";

// GET /api/psa/schaeden
export async function GET() {
  const user = await getPsaUser();
  if (!user)
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const result = await db
    .select()
    .from(schadensdokumentation)
    .orderBy(desc(schadensdokumentation.erstelltAm));
  return NextResponse.json(result);
}

// POST /api/psa/schaeden
export async function POST(req: NextRequest) {
  const user = await getPsaUser();
  if (!user)
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await req.json();
  const [created] = await db
    .insert(schadensdokumentation)
    .values(body)
    .returning();
  await logChange(
    "Schadensdokumentation",
    "Erstellt",
    `${body.ausruestungstyp || ""} ${body.seriennummer || ""}`.trim(),
    user.sub,
  );
  return NextResponse.json(created, { status: 201 });
}
