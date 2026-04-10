import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";

export async function GET() {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ error: "not_authenticated" }, { status: 401 });
  }
  return NextResponse.json({
    Benutzername: user.sub,
    Rolle: user.app_role,
    KameradId: user.kamerad_id,
    KameradName: user.kamerad_name,
    app_permissions: user.app_permissions,
  });
}
