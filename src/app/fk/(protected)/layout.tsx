import { redirect } from "next/navigation";
import { fkAuth } from "@/lib/fk-auth";
import { db } from "@/lib/db";
import { fkUsers } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import FkAppShell from "@/components/fk-app-shell";
import { FkUserProvider } from "@/lib/fk-user-context";

export default async function FkProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await fkAuth();

  if (!session?.user?.id) {
    redirect("/fk/login");
  }

  const user = await db.query.fkUsers.findFirst({
    where: eq(fkUsers.id, session.user.id),
  });

  if (!user || !user.isActive) {
    redirect("/fk/login");
  }

  if (user.mustChangePassword) {
    redirect("/fk/passwort-aendern");
  }

  if (!user.consentGiven) {
    redirect("/fk/datenschutz-einwilligung");
  }

  return (
    <FkUserProvider
      user={{
        id: user.id,
        name: user.name,
        role: user.role as "admin" | "member",
      }}
    >
      <FkAppShell>{children}</FkAppShell>
    </FkUserProvider>
  );
}
