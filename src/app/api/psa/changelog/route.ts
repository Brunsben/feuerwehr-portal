import {
  NextResponse,
  db,
  changelog,
  getPsaUser,
  canEdit,
  desc,
} from "../_shared";

// GET /api/psa/changelog
export async function GET() {
  const user = await getPsaUser();
  if (!user)
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (!canEdit(user))
    return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const result = await db
    .select()
    .from(changelog)
    .orderBy(desc(changelog.zeitpunkt));
  return NextResponse.json(result);
}
