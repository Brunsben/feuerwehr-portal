import { redirect } from "next/navigation";
import { getAuthUser, buildAppPermissions } from "@/lib/auth";
import { DashboardClient } from "./client";

export default async function DashboardPage() {
  const user = await getAuthUser();
  if (!user) redirect("/login");

  const feuerwehrName = process.env.FEUERWEHR_NAME || "Feuerwehr";

  return (
    <DashboardClient
      user={{
        Benutzername: user.sub,
        Rolle: user.app_role,
        KameradId: user.kamerad_id,
        KameradName: user.kamerad_name,
        app_permissions: user.app_permissions,
      }}
      feuerwehrName={feuerwehrName}
    />
  );
}
