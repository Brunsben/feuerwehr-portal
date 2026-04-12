"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { fkApiFetch } from "@/lib/fk-api-fetch";

const POLICY_VERSION = "1.0";

export default function FkConsentPage() {
  const router = useRouter();
  const [dataProcessing, setDataProcessing] = useState(false);
  const [emailNotifications, setEmailNotifications] = useState(false);
  const [photoUpload, setPhotoUpload] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    if (!dataProcessing) {
      setError(
        "Die Einwilligung zur Datenverarbeitung ist erforderlich, um das Tool nutzen zu können.",
      );
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const res = await fkApiFetch("/api/user/consent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dataProcessing,
          emailNotifications,
          photoUpload,
          policyVersion: POLICY_VERSION,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Fehler beim Speichern der Einwilligung.");
      } else {
        router.push("/fk/dashboard");
        router.refresh();
      }
    } catch {
      setError("Ein Fehler ist aufgetreten.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-8">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 text-3xl">
            🛡️
          </div>
          <CardTitle className="text-2xl">Datenschutz-Einwilligung</CardTitle>
          <CardDescription>
            Gemäß DSGVO benötigen wir deine Einwilligung zur Datenverarbeitung.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {error && (
            <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="rounded-lg bg-gray-50 p-4 text-sm leading-relaxed max-h-64 overflow-y-auto">
            <h3 className="font-bold mb-2">
              Datenschutzerklärung (Version {POLICY_VERSION})
            </h3>
            <p className="mb-2">
              <strong>Verantwortliche Stelle:</strong> Verantwortlicher der
              Organisation
            </p>
            <p className="mb-2">
              <strong>Zweck der Datenverarbeitung:</strong> Durchführung der
              gesetzlich vorgeschriebenen Führerscheinkontrolle gem. § 21 StVG,
              DGUV Vorschrift 70.
            </p>
            <p className="mb-2">
              <strong>Verarbeitete Daten:</strong> Name, E-Mail-Adresse,
              Geburtsdatum, Telefonnummer, Führerscheinklassen mit Ablaufdaten,
              Prüfprotokolle, ggf. Fotos des Führerscheins.
            </p>
            <p className="mb-2">
              <strong>Rechtsgrundlage:</strong> Art. 6 Abs. 1 lit. a DSGVO
              (Einwilligung) sowie Art. 6 Abs. 1 lit. c DSGVO (rechtliche
              Verpflichtung).
            </p>
            <p className="mb-2">
              <strong>Speicherdauer:</strong> Daten werden gespeichert, solange
              du Mitglied der Organisation bist. Führerscheinfotos werden nach
              Bestätigung der Kontrolle automatisch gelöscht (max. 30 Tage).
            </p>
            <p className="mb-2">
              <strong>Deine Rechte:</strong> Auskunft (Art. 15), Berichtigung
              (Art. 16), Löschung (Art. 17), Einschränkung (Art. 18),
              Datenübertragbarkeit (Art. 20), Widerspruch (Art. 21).
            </p>
            <p>
              <strong>Datensicherheit:</strong> Alle Daten werden verschlüsselt
              gespeichert. Führerscheinfotos werden mit AES-256 verschlüsselt.
              Der Zugriff ist rollenbasiert beschränkt.
            </p>
          </div>

          <Separator />

          <div className="space-y-4">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={dataProcessing}
                onChange={(e) => setDataProcessing(e.target.checked)}
                className="mt-1 h-4 w-4 rounded border-gray-300"
              />
              <div>
                <span className="font-medium">Datenverarbeitung</span>
                <span className="text-red-500 ml-1">*</span>
                <p className="text-sm text-gray-500">
                  Ich willige ein, dass meine personenbezogenen Daten zum Zweck
                  der Führerscheinkontrolle verarbeitet und gespeichert werden.
                </p>
              </div>
            </label>

            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={emailNotifications}
                onChange={(e) => setEmailNotifications(e.target.checked)}
                className="mt-1 h-4 w-4 rounded border-gray-300"
              />
              <div>
                <span className="font-medium">E-Mail-Benachrichtigungen</span>
                <p className="text-sm text-gray-500">
                  Ich möchte per E-Mail an fällige Führerscheinkontrollen und
                  ablaufende Führerscheine erinnert werden.
                </p>
              </div>
            </label>

            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={photoUpload}
                onChange={(e) => setPhotoUpload(e.target.checked)}
                className="mt-1 h-4 w-4 rounded border-gray-300"
              />
              <div>
                <span className="font-medium">Foto-Upload</span>
                <p className="text-sm text-gray-500">
                  Ich willige ein, Fotos meines Führerscheins hochzuladen. Diese
                  werden verschlüsselt gespeichert und nach Bestätigung der
                  Kontrolle automatisch gelöscht.
                </p>
              </div>
            </label>
          </div>

          <Button
            onClick={handleSubmit}
            className="w-full bg-red-600 hover:bg-red-700"
            disabled={loading || !dataProcessing}
          >
            {loading
              ? "Wird gespeichert..."
              : "Einwilligung erteilen & fortfahren"}
          </Button>

          <p className="text-xs text-center text-gray-400">
            Du kannst deine Einwilligung jederzeit in deinem Profil widerrufen.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
