import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { benutzer } from "@/lib/db/schema";
import { sql } from "drizzle-orm";

export async function POST() {
  try {
    const [result] = await db
      .select({ count: sql<number>`count(*)` })
      .from(benutzer);

    return NextResponse.json(result.count > 0);
  } catch {
    return NextResponse.json(false);
  }
}
