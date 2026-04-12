import { fkAuth } from "@/lib/fk-auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import CheckActions from "./check-actions";

export default async function KontrollenPage() {
  const session = await fkAuth();
  if (!session?.user || session.user.role !== "admin")
    redirect("/fk/dashboard");

  const checks = await db.query.fkLicenseChecks.findMany({
    with: {
      user: true,
      checkedBy: true,
      uploadedFiles: true,
    },
    orderBy: (c: any, { desc }: any) => [desc(c.createdAt)],
  });

  const pendingChecks = checks.filter((c) => c.result === "pending");
  const completedChecks = checks.filter((c) => c.result !== "pending");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Kontrollen</h2>
          <p className="text-gray-500">
            {pendingChecks.length} ausstehend · {completedChecks.length}{" "}
            abgeschlossen
          </p>
        </div>
      </div>

      {pendingChecks.length > 0 && (
        <Card className="border-amber-200">
          <CardHeader>
            <CardTitle className="text-amber-700">
              📋 Ausstehende Kontrollen ({pendingChecks.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {pendingChecks.map((check) => (
              <div key={check.id} className="rounded-lg border p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{check.user.name}</p>
                    <p className="text-sm text-gray-500">
                      {check.checkType === "photo_upload"
                        ? "📷 Foto-Upload"
                        : "👁️ Sichtkontrolle"}{" "}
                      · {new Date(check.checkDate).toLocaleDateString("de-DE")}
                    </p>
                  </div>
                  <Badge className="bg-amber-100 text-amber-800">
                    Ausstehend
                  </Badge>
                </div>

                {check.uploadedFiles.length > 0 && (
                  <div className="flex gap-3">
                    {check.uploadedFiles.map((file) => (
                      <a
                        key={file.id}
                        href={`/fk/api/files/${file.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-sm text-blue-600 hover:underline rounded-lg border p-2"
                      >
                        🖼️ {file.side === "front" ? "Vorderseite" : "Rückseite"}
                      </a>
                    ))}
                  </div>
                )}

                <CheckActions checkId={check.id} />
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Abgeschlossene Kontrollen</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {completedChecks.slice(0, 50).map((check) => (
              <div
                key={check.id}
                className="flex items-center justify-between rounded-lg border p-3 text-sm"
              >
                <div>
                  <span className="font-medium">{check.user.name}</span>
                  <span className="ml-3 text-gray-500">
                    {new Date(check.checkDate).toLocaleDateString("de-DE")}
                  </span>
                  <span className="ml-2 text-gray-400">
                    {check.checkType === "photo_upload" ? "📷" : "👁️"}
                  </span>
                  {check.checkedBy && (
                    <span className="ml-2 text-gray-400 text-xs">
                      geprüft von {check.checkedBy.name}
                    </span>
                  )}
                </div>
                <Badge
                  className={
                    check.result === "approved"
                      ? "bg-green-100 text-green-800"
                      : "bg-red-100 text-red-800"
                  }
                >
                  {check.result === "approved"
                    ? "✅ Bestätigt"
                    : "❌ Abgelehnt"}
                </Badge>
              </div>
            ))}
            {completedChecks.length === 0 && (
              <p className="py-4 text-center text-gray-400">
                Noch keine abgeschlossenen Kontrollen.
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
