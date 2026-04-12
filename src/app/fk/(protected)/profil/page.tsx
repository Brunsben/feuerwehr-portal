import { fkAuth } from "@/lib/fk-auth";
import { db } from "@/lib/db";
import { fkUsers } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import WithdrawConsentButton from "./withdraw-consent-button";
import ExportDataButton from "./export-data-button";

export default async function ProfilPage() {
  const session = await fkAuth();
  if (!session?.user) redirect("/fk/login");

  const user = await db.query.fkUsers.findFirst({
    where: eq(fkUsers.id, session.user.id),
    with: {
      memberLicenses: {
        with: { licenseClass: true },
      },
      consentRecords: {
        orderBy: (c: any, { desc }: any) => [desc(c.createdAt)],
      },
    },
  });

  if (!user) redirect("/fk/login");

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Mein Profil</h2>
        <p className="text-gray-500">
          Deine persönlichen Daten und Einstellungen
        </p>
      </div>

      {/* Personal info */}
      <Card>
        <CardHeader>
          <CardTitle>Persönliche Daten</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between">
            <span className="text-gray-500">Name</span>
            <span className="font-medium">{user.name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">E-Mail</span>
            <span className="font-medium">{user.email}</span>
          </div>
          {user.phone && (
            <div className="flex justify-between">
              <span className="text-gray-500">Telefon</span>
              <span className="font-medium">{user.phone}</span>
            </div>
          )}
          {user.dateOfBirth && (
            <div className="flex justify-between">
              <span className="text-gray-500">Geburtsdatum</span>
              <span className="font-medium">
                {new Date(user.dateOfBirth).toLocaleDateString("de-DE")}
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* License classes */}
      <Card>
        <CardHeader>
          <CardTitle>Meine Führerscheinklassen</CardTitle>
        </CardHeader>
        <CardContent>
          {user.memberLicenses.length === 0 ? (
            <p className="text-gray-400">Keine Klassen hinterlegt.</p>
          ) : (
            <div className="space-y-2">
              {user.memberLicenses.map((ml) => (
                <div
                  key={ml.id}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{ml.licenseClass.code}</Badge>
                    <span className="text-sm">{ml.licenseClass.name}</span>
                    {ml.restriction188 && (
                      <Badge className="text-xs bg-amber-100 text-amber-800">
                        SZ 188
                      </Badge>
                    )}
                  </div>
                  <span className="text-sm text-gray-500">
                    {ml.expiryDate
                      ? `bis ${new Date(ml.expiryDate).toLocaleDateString("de-DE")}`
                      : "Unbefristet"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* DSGVO section */}
      <Card>
        <CardHeader>
          <CardTitle>Datenschutz & DSGVO</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-medium mb-2">Aktive Einwilligungen</h4>
            <div className="space-y-2">
              {user.consentRecords
                .filter((c) => c.given && !c.withdrawnAt)
                .map((c) => (
                  <div
                    key={c.id}
                    className="flex items-center justify-between text-sm"
                  >
                    <span>
                      {c.consentType === "data_processing"
                        ? "📋 Datenverarbeitung"
                        : c.consentType === "email_notifications"
                          ? "📧 E-Mail-Benachrichtigungen"
                          : "📷 Foto-Upload"}
                    </span>
                    <span className="text-gray-400">
                      seit{" "}
                      {c.givenAt
                        ? new Date(c.givenAt).toLocaleDateString("de-DE")
                        : "—"}
                    </span>
                  </div>
                ))}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <ExportDataButton />
            <WithdrawConsentButton />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
