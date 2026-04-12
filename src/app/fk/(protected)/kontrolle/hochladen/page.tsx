"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { toast } from "sonner";
import { fkApiFetch } from "@/lib/fk-api-fetch";

export default function UploadPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [frontPreview, setFrontPreview] = useState<string | null>(null);
  const [backPreview, setBackPreview] = useState<string | null>(null);
  const frontRef = useRef<HTMLInputElement>(null);
  const backRef = useRef<HTMLInputElement>(null);
  const [success, setSuccess] = useState(false);

  function handleFileSelect(side: "front" | "back", file: File | null) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      if (side === "front") setFrontPreview(e.target?.result as string);
      else setBackPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  }

  async function handleSubmit() {
    const frontFile = frontRef.current?.files?.[0];
    if (!frontFile) {
      toast.error("Bitte fotografiere die Vorderseite deines Führerscheins.");
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("front", frontFile);

      const backFile = backRef.current?.files?.[0];
      if (backFile) formData.append("back", backFile);

      const res = await fkApiFetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        setSuccess(true);
        toast.success("Führerschein-Fotos hochgeladen!");
      } else {
        const data = await res.json();
        toast.error(data.error || "Fehler beim Upload.");
      }
    } catch {
      toast.error("Ein Fehler ist aufgetreten.");
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="max-w-lg mx-auto">
        <Card className="border-green-200 bg-green-50">
          <CardContent className="pt-6 text-center space-y-4">
            <div className="text-4xl">✅</div>
            <h2 className="text-xl font-bold text-green-800">
              Erfolgreich hochgeladen!
            </h2>
            <p className="text-green-700">
              Deine Führerschein-Fotos wurden verschlüsselt gespeichert. Der
              Administrator wird die Kontrolle prüfen und bestätigen.
            </p>
            <Button
              onClick={() => router.push("/fk/dashboard")}
              className="bg-green-600 hover:bg-green-700"
            >
              Zurück zum Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Führerschein hochladen</h2>
        <p className="text-gray-500">
          Fotografiere deinen Führerschein (Vorder- und Rückseite). Die Fotos
          werden verschlüsselt gespeichert und nach Bestätigung automatisch
          gelöscht.
        </p>
      </div>

      {/* Front */}
      <Card>
        <CardHeader>
          <CardTitle>Vorderseite *</CardTitle>
          <CardDescription>
            Foto der Vorderseite deines Führerscheins
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div
            className="flex flex-col items-center justify-center border-2 border-dashed rounded-lg p-6 cursor-pointer hover:bg-gray-50"
            onClick={() => frontRef.current?.click()}
          >
            {frontPreview ? (
              <img
                src={frontPreview}
                alt="Vorderseite"
                className="max-h-48 rounded-lg"
              />
            ) : (
              <>
                <span className="text-3xl mb-2">📷</span>
                <span className="text-sm text-gray-500">
                  Tippen zum Fotografieren / Auswählen
                </span>
              </>
            )}
            <input
              ref={frontRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={(e) =>
                handleFileSelect("front", e.target.files?.[0] || null)
              }
            />
          </div>
        </CardContent>
      </Card>

      {/* Back */}
      <Card>
        <CardHeader>
          <CardTitle>Rückseite</CardTitle>
          <CardDescription>Optional – Foto der Rückseite</CardDescription>
        </CardHeader>
        <CardContent>
          <div
            className="flex flex-col items-center justify-center border-2 border-dashed rounded-lg p-6 cursor-pointer hover:bg-gray-50"
            onClick={() => backRef.current?.click()}
          >
            {backPreview ? (
              <img
                src={backPreview}
                alt="Rückseite"
                className="max-h-48 rounded-lg"
              />
            ) : (
              <>
                <span className="text-3xl mb-2">📷</span>
                <span className="text-sm text-gray-500">
                  Tippen zum Fotografieren / Auswählen
                </span>
              </>
            )}
            <input
              ref={backRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={(e) =>
                handleFileSelect("back", e.target.files?.[0] || null)
              }
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-3">
        <Button
          onClick={handleSubmit}
          className="flex-1 bg-red-600 hover:bg-red-700"
          disabled={loading || !frontPreview}
        >
          {loading ? "Wird hochgeladen..." : "📤 Fotos verschlüsselt hochladen"}
        </Button>
        <Button variant="outline" onClick={() => router.back()}>
          Abbrechen
        </Button>
      </div>

      <p className="text-xs text-center text-gray-400">
        🔒 Deine Fotos werden mit AES-256 verschlüsselt gespeichert und nach
        Bestätigung der Kontrolle automatisch gelöscht.
      </p>
    </div>
  );
}
