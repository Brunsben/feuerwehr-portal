import {
  NextResponse,
  db,
  foodUsers,
  kameraden,
  getFoodUser,
  isFoodAdmin,
  logFoodAdmin,
  generateFoodToken,
  eq,
  sql,
} from "../../_shared";

export async function POST() {
  try {
    const user = await getFoodUser();
    if (!user || !isFoodAdmin(user)) {
      return NextResponse.json({ error: "Nicht berechtigt" }, { status: 403 });
    }

    // Alle Kameraden aus der Portal-DB laden
    const allKameraden = await db.select().from(kameraden);

    let added = 0;
    let updated = 0;

    for (const k of allKameraden) {
      const name = `${k.vorname} ${k.name}`.trim();
      const personalNumber = k.personalnummer || "";

      // Prüfen ob schon ein Food-User mit dieser Personalnummer existiert
      if (personalNumber) {
        const [existing] = await db
          .select()
          .from(foodUsers)
          .where(eq(foodUsers.personalNumber, personalNumber))
          .limit(1);

        if (existing) {
          // Name aktualisieren falls sich etwas geändert hat
          if (existing.name !== name) {
            await db
              .update(foodUsers)
              .set({ name })
              .where(eq(foodUsers.id, existing.id));
            updated++;
          }
          continue;
        }
      }

      // Prüfen ob ein Food-User mit gleichem Namen existiert
      const [byName] = await db
        .select()
        .from(foodUsers)
        .where(eq(foodUsers.name, name))
        .limit(1);

      if (byName) {
        // Personalnummer updaten falls fehlend
        if (!byName.personalNumber && personalNumber) {
          await db
            .update(foodUsers)
            .set({ personalNumber })
            .where(eq(foodUsers.id, byName.id));
          updated++;
        }
        continue;
      }

      // Neuen Food-User anlegen
      await db.insert(foodUsers).values({
        name,
        personalNumber: personalNumber || name,
        cardId: null,
        mobileToken: generateFoodToken(),
      });
      added++;
    }

    await logFoodAdmin(
      user.sub,
      "Sync mit Portal",
      `${added} hinzugefügt, ${updated} aktualisiert`,
    );

    return NextResponse.json({ success: true, added, updated });
  } catch (error) {
    console.error("Food admin sync error:", error);
    return NextResponse.json({ error: "Interner Fehler" }, { status: 500 });
  }
}
