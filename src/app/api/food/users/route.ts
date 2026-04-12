import {
  NextResponse,
  db,
  foodUsers,
  getFoodUser,
  isFoodAdmin,
  sql,
} from "../_shared";
import type { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const user = await getFoodUser();
    if (!user || !isFoodAdmin(user)) {
      return NextResponse.json({ error: "Nicht berechtigt" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const page = Math.max(parseInt(searchParams.get("page") || "1", 10), 1);
    const perPage = Math.min(
      Math.max(parseInt(searchParams.get("per_page") || "50", 10), 1),
      200,
    );
    const offset = (page - 1) * perPage;

    const [countResult] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(foodUsers);
    const total = countResult?.count || 0;

    const data = await db
      .select()
      .from(foodUsers)
      .orderBy(foodUsers.name)
      .limit(perPage)
      .offset(offset);

    return NextResponse.json({
      users: data,
      pagination: {
        page,
        per_page: perPage,
        total,
        pages: Math.ceil(total / perPage),
      },
    });
  } catch (error) {
    console.error("Food users error:", error);
    return NextResponse.json({ error: "Interner Fehler" }, { status: 500 });
  }
}
