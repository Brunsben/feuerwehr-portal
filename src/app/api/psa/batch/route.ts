import {
  NextResponse,
  db,
  ausruestungstuecke,
  pruefungen,
  waesche,
  getPsaUser,
  canEdit,
  eq,
  logChange,
} from "../_shared";
import type { NextRequest } from "next/server";

// POST /api/psa/batch — Massen-Prüfung oder Massen-Wäsche
export async function POST(req: NextRequest) {
  const user = await getPsaUser();
  if (!user)
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (!canEdit(user))
    return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const body = await req.json();
  const { action, ids, data } = body as {
    action: "pruefung" | "waesche";
    ids: number[];
    data: Record<string, string>;
  };

  if (!action || !ids?.length) {
    return NextResponse.json(
      { error: "missing action or ids" },
      { status: 400 },
    );
  }

  const results = [];

  for (const id of ids) {
    const [item] = await db
      .select()
      .from(ausruestungstuecke)
      .where(eq(ausruestungstuecke.id, id));
    if (!item) continue;

    if (action === "pruefung") {
      await db.insert(pruefungen).values({
        ausruestungstueckId: id,
        ausruestungstyp: item.ausruestungstyp,
        kamerad: item.kamerad,
        kameradId: item.kameradId,
        datum: data.datum,
        ergebnis: data.ergebnis || "Bestanden",
        pruefer: data.pruefer || user.sub,
        naechstePruefung: data.naechstePruefung,
        notizen: data.notizen,
      });
      if (data.naechstePruefung) {
        await db
          .update(ausruestungstuecke)
          .set({ naechstePruefung: data.naechstePruefung })
          .where(eq(ausruestungstuecke.id, id));
      }
      results.push(id);
    } else if (action === "waesche") {
      await db.insert(waesche).values({
        ausruestungstueckId: id,
        ausruestungstyp: item.ausruestungstyp,
        kamerad: item.kamerad,
        kameradId: item.kameradId,
        datum: data.datum,
        notizen: data.notizen,
      });
      results.push(id);
    }
  }

  await logChange(
    action === "pruefung" ? "Pruefungen" : "Waesche",
    "Erstellt",
    `Massen-${action}: ${results.length} Stück`,
    user.sub,
  );

  return NextResponse.json({ ok: true, count: results.length });
}
