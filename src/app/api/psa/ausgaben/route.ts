import {
  NextResponse,
  db,
  ausgaben,
  getPsaUser,
  canEdit,
  desc,
  logChange,
} from "../_shared";
import type { NextRequest } from "next/server";

// GET /api/psa/ausgaben
export async function GET() {
  const user = await getPsaUser();
  if (!user)
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const result = await db
    .select()
    .from(ausgaben)
    .orderBy(desc(ausgaben.ausgabedatum));
  return NextResponse.json(result);
}

// POST /api/psa/ausgaben
export async function POST(req: NextRequest) {
  const user = await getPsaUser();
  if (!user)
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (!canEdit(user))
    return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const body = await req.json();
  const [created] = await db.insert(ausgaben).values(body).returning();
  await logChange(
    "Ausgaben",
    "Erstellt",
    `${body.ausruestungstyp || ""} → ${body.kamerad || ""}`,
    user.sub,
  );
  return NextResponse.json(created, { status: 201 });
}
