import { fkAuth } from "@/lib/fk-auth";
import { db } from "@/lib/db";
import { fkUsers } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FkSyncButton } from "@/components/fk-sync-button";

export default async function MitgliederPage() {
  const session = await fkAuth();
  if (!session?.user || session.user.role !== "admin")
    redirect("/fk/dashboard");

  const members = await db.query.fkUsers.findMany({
    where: eq(fkUsers.isActive, true),
    with: {
      memberLicenses: {
        with: { licenseClass: true },
      },
    },
    orderBy: (u: any, { asc }: any) => [asc(u.name)],
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Mitglieder</h2>
          <p className="text-gray-500">{members.length} aktive Mitglieder</p>
        </div>
        <FkSyncButton />
      </div>

      <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-blue-700 dark:border-blue-800 dark:bg-blue-900/20 dark:text-blue-300">
        Mitglieder werden zentral im Portal verwaltet. Nutze &quot;Sync mit
        Portal&quot; um Änderungen zu übernehmen. Führerscheinklassen kannst du
        in der Detailansicht verwalten.
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {members.map((member) => (
          <Link key={member.id} href={`/fk/admin/mitglieder/${member.id}`}>
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold">{member.name}</h3>
                    <p className="text-sm text-gray-500">{member.email}</p>
                    {member.phone && (
                      <p className="text-sm text-gray-400 mt-1">
                        {member.phone}
                      </p>
                    )}
                  </div>
                  <Badge
                    variant={member.role === "admin" ? "default" : "secondary"}
                    className="text-xs"
                  >
                    {member.role === "admin" ? "Admin" : "Mitglied"}
                  </Badge>
                </div>
                <div className="flex flex-wrap gap-1 mt-3">
                  {member.memberLicenses.map((ml) => (
                    <Badge key={ml.id} variant="outline" className="text-xs">
                      {ml.licenseClass.code}
                      {ml.restriction188 && " (188)"}
                    </Badge>
                  ))}
                  {member.memberLicenses.length === 0 && (
                    <span className="text-xs text-gray-400">
                      Keine FS-Klassen
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
