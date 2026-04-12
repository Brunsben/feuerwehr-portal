import { NextResponse } from "next/server";
import { fkAuth } from "@/lib/fk-auth";
import { db } from "@/lib/db";

export async function GET() {
  const session = await fkAuth();
  if (!session?.user) {
    return NextResponse.json({ error: "Nicht angemeldet" }, { status: 401 });
  }

  const classes = await db.query.fkLicenseClasses.findMany({
    orderBy: (c: any, { asc }: any) => [asc(c.sortOrder)],
  });

  return NextResponse.json(classes);
}
