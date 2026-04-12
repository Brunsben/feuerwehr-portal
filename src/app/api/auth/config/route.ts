import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    feuerwehrName: process.env.FEUERWEHR_NAME || "Feuerwehr",
  });
}
