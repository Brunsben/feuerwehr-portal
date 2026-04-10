import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";

// Interner Verify-Endpoint: Sub-Apps validieren fw_jwt Cookie
// Identisch mit /me — gibt 200 + User-Info zurück wenn gültig
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
