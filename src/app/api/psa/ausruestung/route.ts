import {
  NextResponse,
  db,
  ausruestungstuecke,
  getPsaUser,
  canEdit,
  asc,
  eq,
  logChange,
} from "../_shared";
import type { NextRequest } from "next/server";

// GET /api/psa/ausruestung
export async function GET() {
  const user = await getPsaUser();
  if (!user)
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const result = await db
    .select()
    .from(ausruestungstuecke)
    .orderBy(asc(ausruestungstuecke.ausruestungstyp));
  return NextResponse.json(result);
}

// POST /api/psa/ausruestung
export async function POST(req: NextRequest) {
  const user = await getPsaUser();
  if (!user)
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (!canEdit(user))
    return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const body = await req.json();
  const [created] = await db
    .insert(ausruestungstuecke)
    .values(body)
    .returning();
  await logChange(
    "Ausruestungstuecke",
    "Erstellt",
    `${body.ausruestungstyp || ""} ${body.seriennummer || ""}`.trim(),
    user.sub,
  );
  return NextResponse.json(created, { status: 201 });
}
