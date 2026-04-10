import { redirect } from "next/navigation";
import { getAuthUser } from "@/lib/auth";
import { MitgliederClient } from "./client";

export default async function MitgliederPage() {
  const user = await getAuthUser();
  if (!user) redirect("/login");
  if (user.app_role !== "Admin") redirect("/dashboard");

  const feuerwehrName = process.env.FEUERWEHR_NAME || "Feuerwehr";

  return (
    <MitgliederClient
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
