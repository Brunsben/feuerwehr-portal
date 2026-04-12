import {
  NextResponse,
  db,
  pruefungen,
  getPsaUser,
  canEdit,
  desc,
  logChange,
} from "../_shared";
import type { NextRequest } from "next/server";

// GET /api/psa/pruefungen
export async function GET() {
  const user = await getPsaUser();
  if (!user)
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const result = await db
    .select()
    .from(pruefungen)
    .orderBy(desc(pruefungen.datum));
  return NextResponse.json(result);
}

// POST /api/psa/pruefungen
export async function POST(req: NextRequest) {
  const user = await getPsaUser();
  if (!user)
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (!canEdit(user))
    return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const body = await req.json();
  const [created] = await db.insert(pruefungen).values(body).returning();
  await logChange(
    "Pruefungen",
    "Erstellt",
    `${body.ausruestungstyp || ""} – ${body.ergebnis || ""}`,
    user.sub,
  );
  return NextResponse.json(created, { status: 201 });
}
