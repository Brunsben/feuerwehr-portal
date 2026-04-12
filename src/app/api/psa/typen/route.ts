import {
  NextResponse,
  db,
  ausruestungstypen,
  getPsaUser,
  canEdit,
  asc,
  logChange,
} from "../_shared";
import type { NextRequest } from "next/server";

// GET /api/psa/typen
export async function GET() {
  const user = await getPsaUser();
  if (!user)
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const result = await db
    .select()
    .from(ausruestungstypen)
    .orderBy(asc(ausruestungstypen.bezeichnung));
  return NextResponse.json(result);
}

// POST /api/psa/typen
export async function POST(req: NextRequest) {
  const user = await getPsaUser();
  if (!user)
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (!canEdit(user))
    return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const body = await req.json();
  const [created] = await db.insert(ausruestungstypen).values(body).returning();
  await logChange(
    "Ausruestungstypen",
    "Erstellt",
    `${body.bezeichnung || ""}`,
    user.sub,
  );
  return NextResponse.json(created, { status: 201 });
}
