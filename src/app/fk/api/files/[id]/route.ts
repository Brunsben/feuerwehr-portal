import { NextResponse } from "next/server";
import { fkAuth } from "@/lib/fk-auth";
import { db } from "@/lib/db";
import { fkUploadedFiles } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { readAndDecrypt } from "@/lib/fk-encryption";
import { sanitizeFilename } from "@/lib/fk-security";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await fkAuth();
  if (!session?.user) {
    return NextResponse.json({ error: "Nicht angemeldet" }, { status: 401 });
  }

  const { id } = await params;

  const file = await db.query.fkUploadedFiles.findFirst({
    where: eq(fkUploadedFiles.id, id),
  });

  if (!file) {
    return NextResponse.json(
      { error: "Datei nicht gefunden" },
      { status: 404 },
    );
  }

  if (session.user.role !== "admin" && file.userId !== session.user.id) {
    return NextResponse.json({ error: "Nicht berechtigt" }, { status: 403 });
  }

  try {
    const decrypted = await readAndDecrypt(file.filePath);

    const safeFilename = sanitizeFilename(file.originalFilename);

    return new NextResponse(new Uint8Array(decrypted), {
      headers: {
        "Content-Type": file.mimeType,
        "Content-Disposition": `inline; filename="${safeFilename}"`,
        "Cache-Control": "no-store, no-cache, must-revalidate",
      },
    });
  } catch (error) {
    console.error("Decryption error:", error);
    return NextResponse.json(
      { error: "Datei konnte nicht entschlüsselt werden" },
      { status: 500 },
    );
  }
}
