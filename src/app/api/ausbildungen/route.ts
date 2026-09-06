import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { ausbildungen } from "@/lib/db/schema";
import { getAuthUser } from "@/lib/auth";
import { asc, eq } from "drizzle-orm";

// GET /api/ausbildungen — alle Ausbildungen (authentifiziert)
export async function GET() {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ error: "not_authenticated" }, { status: 401 });
  }

  const result = await db
    .select()
    .from(ausbildungen)
    .orderBy(asc(ausbildungen.kameradId), asc(ausbildungen.bezeichnung));

  return NextResponse.json(result);
}

// PUT /api/ausbildungen — Ausbildungen eines Kameraden ersetzen (nur Admin)
// Body: { kameradId: number, bezeichnungen: string[] }
export async function PUT(req: NextRequest) {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ error: "not_authenticated" }, { status: 401 });
  }
  if (user.app_role !== "Admin") {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const { kameradId, bezeichnungen } = (await req.json()) as {
    kameradId: number;
    bezeichnungen: string[];
  };

  if (!kameradId || !Array.isArray(bezeichnungen)) {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  const unique = [...new Set(bezeichnungen.map((b) => b.trim()).filter(Boolean))];

  await db.transaction(async (tx) => {
    await tx.delete(ausbildungen).where(eq(ausbildungen.kameradId, kameradId));
    if (unique.length > 0) {
      await tx
        .insert(ausbildungen)
        .values(unique.map((bezeichnung) => ({ kameradId, bezeichnung })));
    }
  });

  const result = await db
    .select()
    .from(ausbildungen)
    .where(eq(ausbildungen.kameradId, kameradId))
    .orderBy(asc(ausbildungen.bezeichnung));

  return NextResponse.json(result);
}
