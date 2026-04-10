import {
  NextResponse,
  db,
  normen,
  getPsaUser,
  canEdit,
  asc,
  logChange,
} from "../_shared";
import type { NextRequest } from "next/server";

// GET /api/psa/normen
export async function GET() {
  const user = await getPsaUser();
  if (!user)
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const result = await db
    .select()
    .from(normen)
    .orderBy(asc(normen.ausruestungstypKategorie), asc(normen.bezeichnung));
  return NextResponse.json(result);
}

// POST /api/psa/normen
export async function POST(req: NextRequest) {
  const user = await getPsaUser();
  if (!user)
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (!canEdit(user))
    return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const body = await req.json();
  const [created] = await db.insert(normen).values(body).returning();
  await logChange(
    "Normen",
    "Erstellt",
    `${body.bezeichnung || ""} (${body.normbezeichnung || ""})`,
    user.sub,
  );
  return NextResponse.json(created, { status: 201 });
}
