import { redirect } from "next/navigation";
import { getPsaUser, canEdit, isAdmin } from "@/lib/psa-auth";
import { PsaLayoutClient } from "./layout-client";

export default async function PsaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getPsaUser();
  if (!user) redirect("/login");

  const feuerwehrName = process.env.FEUERWEHR_NAME || "Feuerwehr";

  return (
    <PsaLayoutClient
      user={{
        sub: user.sub,
        psa_rolle: user.psa_rolle,
        kamerad_id: user.kamerad_id,
        kamerad_name: user.kamerad_name,
        canEdit: canEdit(user),
        isAdmin: isAdmin(user),
      }}
      feuerwehrName={feuerwehrName}
    >
      {children}
    </PsaLayoutClient>
  );
}
