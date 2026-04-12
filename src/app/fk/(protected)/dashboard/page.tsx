import { fkAuth } from "@/lib/fk-auth";
import { db } from "@/lib/db";
import { fkUsers } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { cookies } from "next/headers";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { redirect } from "next/navigation";
import Link from "next/link";
import { syncMembers } from "@/lib/fk-sync";

function getCheckStatus(
  nextCheckDue: string | null,
): "ok" | "warning" | "overdue" | "unknown" {
  if (!nextCheckDue) return "unknown";
  const now = new Date();
  const due = new Date(nextCheckDue);
  const diffDays = (due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
  if (diffDays < 0) return "overdue";
  if (diffDays <= 28) return "warning";
  return "ok";
}

function getLicenseExpiryStatus(
  expiryDate: string | null,
): "ok" | "warning" | "expired" | "none" {
  if (!expiryDate) return "none";
  const now = new Date();
  const expiry = new Date(expiryDate);
  const diffDays = (expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
  if (diffDays < 0) return "expired";
  if (diffDays <= 90) return "warning";
  return "ok";
}

const statusBadge = {
  ok: (
    <Badge className="bg-green-100 text-green-800 hover:bg-green-100 dark:bg-green-900/40 dark:text-green-300">
      ✅ Gültig
    </Badge>
  ),
  warning: (
    <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100 dark:bg-amber-900/40 dark:text-amber-300">
      🟡 Bald fällig
    </Badge>
  ),
  overdue: (
    <Badge className="bg-red-100 text-red-800 hover:bg-red-100 dark:bg-red-900/40 dark:text-red-300">
      🔴 Überfällig
    </Badge>
  ),
  unknown: (
    <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-100 dark:bg-gray-800 dark:text-gray-300">
      ⚪ Keine Kontrolle
    </Badge>
  ),
};

export default async function FkDashboardPage() {
  const session = await fkAuth();
  if (!session?.user) redirect("/fk/login");

  const isAdmin = session.user.role === "admin";

  if (isAdmin) {
    const cookieStore = await cookies();
    const token = cookieStore.get("fw_jwt")?.value;
    if (token) {
      try {
        await syncMembers(token);
      } catch {
        /* Sync-Fehler nicht blockierend */
      }
    }
  }

  if (isAdmin) {
    return <AdminDashboard />;
  } else {
    return (
      <MemberDashboard
        userId={session.user.id}
        userName={session.user.name || ""}
      />
    );
  }
}

async function AdminDashboard() {
  const allMembers = await db.query.fkUsers.findMany({
    where: eq(fkUsers.isActive, true),
    with: {
      licenseChecks: {
        orderBy: (checks: any, { desc }: any) => [desc(checks.checkDate)],
        limit: 1,
      },
      memberLicenses: {
        with: {
          licenseClass: true,
        },
      },
    },
  });

  let overdueCount = 0;
  let warningCount = 0;
  let okCount = 0;

  const membersWithStatus = allMembers.map((member: any) => {
    const latestCheck = member.licenseChecks[0];
    const checkStatus = getCheckStatus(latestCheck?.nextCheckDue || null);

    if (checkStatus === "overdue") overdueCount++;
    else if (checkStatus === "warning") warningCount++;
    else if (checkStatus === "ok") okCount++;

    const expiringLicenses: {
      code: string;
      status: "expired" | "warning";
      date: string;
    }[] = [];
    for (const ml of member.memberLicenses) {
      const status = getLicenseExpiryStatus(ml.expiryDate);
      if (status === "expired" || status === "warning") {
        expiringLicenses.push({
          code: ml.licenseClass.code,
          status,
          date: ml.expiryDate,
        });
      }
    }

    return { ...member, checkStatus, expiringLicenses, latestCheck };
  });

  const statusOrder: Record<string, number> = {
    overdue: 0,
    warning: 1,
    unknown: 2,
    ok: 3,
  };
  membersWithStatus.sort(
    (a: any, b: any) => statusOrder[a.checkStatus] - statusOrder[b.checkStatus],
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Dashboard</h2>
        <p className="text-muted-foreground">
          Übersicht aller Führerscheinkontrollen
        </p>
      </div>

      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Mitglieder
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{allMembers.length}</div>
          </CardContent>
        </Card>
        <Card className="border-red-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-red-600">
              Überfällig
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600">
              {overdueCount}
            </div>
          </CardContent>
        </Card>
        <Card className="border-amber-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-amber-600">
              Bald fällig
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-amber-600">
              {warningCount}
            </div>
          </CardContent>
        </Card>
        <Card className="border-green-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-green-600">
              Gültig
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{okCount}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Mitglieder-Übersicht</CardTitle>
          <Link
            href="/fk/admin/mitglieder/neu"
            className="inline-flex items-center rounded-md bg-red-600 px-3 py-2 text-sm font-medium text-white hover:bg-red-700"
          >
            + Mitglied anlegen
          </Link>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="pb-3 font-medium">Name</th>
                  <th className="pb-3 font-medium">Führerscheinklassen</th>
                  <th className="pb-3 font-medium">Kontrollstatus</th>
                  <th className="pb-3 font-medium">FS-Ablauf</th>
                  <th className="pb-3 font-medium">Nächste Kontrolle</th>
                  <th className="pb-3 font-medium">Aktionen</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {membersWithStatus.map((member) => (
                  <tr key={member.id} className="hover:bg-muted/50">
                    <td className="py-3">
                      <div>
                        <p className="font-medium">{member.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {member.email}
                        </p>
                      </div>
                    </td>
                    <td className="py-3">
                      <div className="flex flex-wrap gap-1">
                        {member.memberLicenses.map((ml: any) => (
                          <Badge
                            key={ml.id}
                            variant="outline"
                            className="text-xs"
                          >
                            {ml.licenseClass.code}
                            {ml.restriction188 && " (188)"}
                          </Badge>
                        ))}
                        {member.memberLicenses.length === 0 && (
                          <span className="text-muted-foreground text-xs">
                            Keine
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3">
                      {
                        statusBadge[
                          member.checkStatus as keyof typeof statusBadge
                        ]
                      }
                    </td>
                    <td className="py-3">
                      {member.expiringLicenses.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {member.expiringLicenses.map((el: any) => (
                            <Badge
                              key={el.code}
                              className={
                                el.status === "expired"
                                  ? "bg-red-100 text-red-800 hover:bg-red-100 dark:bg-red-900/40 dark:text-red-300 text-xs"
                                  : "bg-amber-100 text-amber-800 hover:bg-amber-100 dark:bg-amber-900/40 dark:text-amber-300 text-xs"
                              }
                            >
                              {el.code} {el.status === "expired" ? "⛔" : "⚠️"}{" "}
                              {new Date(el.date).toLocaleDateString("de-DE", {
                                month: "2-digit",
                                year: "2-digit",
                              })}
                            </Badge>
                          ))}
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="py-3 text-xs text-muted-foreground">
                      {member.latestCheck?.nextCheckDue
                        ? new Date(
                            member.latestCheck.nextCheckDue,
                          ).toLocaleDateString("de-DE")
                        : "—"}
                    </td>
                    <td className="py-3">
                      <div className="flex gap-2">
                        <Link
                          href={`/fk/admin/mitglieder/${member.id}`}
                          className="text-xs text-blue-600 hover:underline"
                        >
                          Details
                        </Link>
                        <Link
                          href={`/fk/admin/kontrollen/neu?userId=${member.id}`}
                          className="text-xs text-red-600 hover:underline"
                        >
                          Kontrolle
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
                {membersWithStatus.length === 0 && (
                  <tr>
                    <td
                      colSpan={6}
                      className="py-8 text-center text-muted-foreground"
                    >
                      Noch keine Mitglieder angelegt.{" "}
                      <Link
                        href="/fk/admin/mitglieder/neu"
                        className="text-red-600 hover:underline"
                      >
                        Jetzt Mitglied anlegen
                      </Link>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

async function MemberDashboard({
  userId,
  userName,
}: {
  userId: string;
  userName: string;
}) {
  const member = await db.query.fkUsers.findFirst({
    where: eq(fkUsers.id, userId),
    with: {
      memberLicenses: {
        with: { licenseClass: true },
      },
      licenseChecks: {
        orderBy: (checks: any, { desc }: any) => [desc(checks.checkDate)],
        limit: 5,
      },
    },
  });

  if (!member) redirect("/fk/login");

  const latestCheck = member.licenseChecks[0];
  const checkStatus = getCheckStatus(latestCheck?.nextCheckDue || null);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Hallo {userName} 👋</h2>
        <p className="text-muted-foreground">
          Dein Führerscheinkontroll-Status
        </p>
      </div>

      <Card
        className={
          checkStatus === "overdue"
            ? "border-red-300 bg-red-50"
            : checkStatus === "warning"
              ? "border-amber-300 bg-amber-50"
              : ""
        }
      >
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            Kontrollstatus {statusBadge[checkStatus]}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {checkStatus === "overdue" && (
            <p className="text-red-700">
              Deine Führerscheinkontrolle ist überfällig. Bitte bringe deinen
              Führerschein zum nächsten Dienst mit oder lade ein Foto hoch.
            </p>
          )}
          {checkStatus === "warning" && (
            <p className="text-amber-700">
              Deine Führerscheinkontrolle ist bald fällig (bis{" "}
              {latestCheck?.nextCheckDue
                ? new Date(latestCheck.nextCheckDue).toLocaleDateString("de-DE")
                : "—"}
              ).
            </p>
          )}
          {checkStatus === "ok" && (
            <p className="text-green-700">
              Alles in Ordnung! Nächste Kontrolle am{" "}
              {latestCheck?.nextCheckDue
                ? new Date(latestCheck.nextCheckDue).toLocaleDateString("de-DE")
                : "—"}
              .
            </p>
          )}
          {checkStatus === "unknown" && (
            <p className="text-muted-foreground">
              Noch keine Führerscheinkontrolle durchgeführt.
            </p>
          )}

          {(checkStatus === "overdue" ||
            checkStatus === "warning" ||
            checkStatus === "unknown") && (
            <Link
              href="/fk/kontrolle/hochladen"
              className="mt-4 inline-flex items-center rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
            >
              📷 Führerschein-Foto hochladen
            </Link>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Meine Führerscheinklassen</CardTitle>
        </CardHeader>
        <CardContent>
          {member.memberLicenses.length === 0 ? (
            <p className="text-muted-foreground">
              Noch keine Klassen hinterlegt.{" "}
              <Link
                href="/fk/profil"
                className="text-red-600 hover:underline"
              >
                Jetzt im Profil eintragen →
              </Link>
            </p>
          ) : (
            <div className="space-y-3">
              {member.memberLicenses.map((ml) => {
                const expiryStatus = getLicenseExpiryStatus(ml.expiryDate);
                return (
                  <div
                    key={ml.id}
                    className="flex items-center justify-between rounded-lg border p-3"
                  >
                    <div>
                      <span className="font-medium">
                        {ml.licenseClass.name}
                      </span>
                      {ml.restriction188 && (
                        <Badge variant="outline" className="ml-2 text-xs">
                          SZ 188
                        </Badge>
                      )}
                    </div>
                    <div className="text-right">
                      {ml.expiryDate ? (
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-muted-foreground">
                            Gültig bis:{" "}
                            {new Date(ml.expiryDate).toLocaleDateString(
                              "de-DE",
                            )}
                          </span>
                          {expiryStatus === "expired" && (
                            <Badge className="bg-red-100 text-red-800 hover:bg-red-100 dark:bg-red-900/40 dark:text-red-300">
                              ⛔ Abgelaufen
                            </Badge>
                          )}
                          {expiryStatus === "warning" && (
                            <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100 dark:bg-amber-900/40 dark:text-amber-300">
                              ⚠️ Läuft bald ab
                            </Badge>
                          )}
                          {expiryStatus === "ok" && (
                            <Badge className="bg-green-100 text-green-800 hover:bg-green-100 dark:bg-green-900/40 dark:text-green-300">
                              ✅ Gültig
                            </Badge>
                          )}
                        </div>
                      ) : (
                        <span className="text-sm text-muted-foreground">
                          Unbefristet
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Letzte Kontrollen</CardTitle>
        </CardHeader>
        <CardContent>
          {member.licenseChecks.length === 0 ? (
            <p className="text-muted-foreground">
              Noch keine Kontrollen durchgeführt.
            </p>
          ) : (
            <div className="space-y-2">
              {member.licenseChecks.map((check) => (
                <div
                  key={check.id}
                  className="flex items-center justify-between rounded-lg border p-3 text-sm"
                >
                  <div>
                    <span className="font-medium">
                      {new Date(check.checkDate).toLocaleDateString("de-DE")}
                    </span>
                    <span className="ml-2 text-muted-foreground">
                      {check.checkType === "in_person"
                        ? "Sichtkontrolle"
                        : "Foto-Upload"}
                    </span>
                  </div>
                  <Badge
                    className={
                      check.result === "approved"
                        ? "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300"
                        : check.result === "rejected"
                          ? "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300"
                          : "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300"
                    }
                  >
                    {check.result === "approved"
                      ? "Bestätigt"
                      : check.result === "rejected"
                        ? "Abgelehnt"
                        : "Ausstehend"}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
