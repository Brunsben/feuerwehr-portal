"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { ArrowLeft, CheckCircle, XCircle } from "lucide-react";
import { fkApiFetch } from "@/lib/fk-api-fetch";

interface Member {
  id: string;
  name: string;
  email: string;
  memberLicenses: {
    id: string;
    licenseClass: { code: string; name: string };
  }[];
}

function NeueKontrolleContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedUserId = searchParams.get("userId") || "";

  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [userId, setUserId] = useState(preselectedUserId);
  const [checkType, setCheckType] = useState("in_person");
  const [result, setResult] = useState("approved");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    fkApiFetch("/api/admin/members")
      .then((r) => {
        if (!r.ok) throw new Error();
        return r.json();
      })
      .then((data) => {
        setMembers(data);
      })
      .catch(() => toast.error("Mitglieder konnten nicht geladen werden"))
      .finally(() => setLoading(false));
  }, []);

  const selectedMember = members.find((m) => m.id === userId);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!userId) {
      toast.error("Bitte ein Mitglied auswählen");
      return;
    }

    setSaving(true);
    try {
      const res = await fkApiFetch("/api/admin/checks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          checkType,
          result,
          notes: notes || null,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Fehler");
      }

      toast.success(
        result === "approved"
          ? "✅ Kontrolle erfolgreich bestätigt"
          : "❌ Kontrolle abgelehnt",
      );
      router.push("/fk/admin/kontrollen");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Fehler beim Speichern");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-500">Lade Mitglieder...</div>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Zurück
        </Button>
      </div>

      <div>
        <h2 className="text-2xl font-bold">Neue Kontrolle</h2>
        <p className="text-gray-500">
          Sichtkontrolle eines Führerscheins dokumentieren
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Kontrolle durchführen</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Mitglied *</Label>
              <Select value={userId} onValueChange={setUserId}>
                <SelectTrigger>
                  <SelectValue placeholder="Mitglied auswählen..." />
                </SelectTrigger>
                <SelectContent>
                  {members.map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      {m.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedMember && selectedMember.memberLicenses.length > 0 && (
                <p className="text-xs text-gray-500">
                  Klassen:{" "}
                  {selectedMember.memberLicenses
                    .map((ml) => ml.licenseClass.code)
                    .join(", ")}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Kontrollart</Label>
              <Select value={checkType} onValueChange={setCheckType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="in_person">
                    👁️ Sichtkontrolle (vor Ort)
                  </SelectItem>
                  <SelectItem value="photo_upload">
                    📷 Foto-Upload (nachträglich bestätigen)
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Ergebnis</Label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setResult("approved")}
                  className={`flex items-center gap-2 rounded-lg border-2 p-4 text-left transition-colors ${
                    result === "approved"
                      ? "border-green-500 bg-green-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <CheckCircle
                    className={`h-5 w-5 ${
                      result === "approved" ? "text-green-600" : "text-gray-400"
                    }`}
                  />
                  <div>
                    <p className="font-medium text-sm">Bestätigt</p>
                    <p className="text-xs text-gray-500">
                      Führerschein ist gültig
                    </p>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => setResult("rejected")}
                  className={`flex items-center gap-2 rounded-lg border-2 p-4 text-left transition-colors ${
                    result === "rejected"
                      ? "border-red-500 bg-red-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <XCircle
                    className={`h-5 w-5 ${
                      result === "rejected" ? "text-red-600" : "text-gray-400"
                    }`}
                  />
                  <div>
                    <p className="font-medium text-sm">Abgelehnt</p>
                    <p className="text-xs text-gray-500">
                      Problem festgestellt
                    </p>
                  </div>
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notizen (optional)</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="z.B. Führerschein vorgezeigt beim Dienstabend am..."
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-3">
          <Button
            type="submit"
            className={
              result === "approved"
                ? "bg-green-600 hover:bg-green-700"
                : "bg-red-600 hover:bg-red-700"
            }
            disabled={saving || !userId}
          >
            {saving
              ? "Speichere..."
              : result === "approved"
                ? "✅ Kontrolle bestätigen"
                : "❌ Kontrolle ablehnen"}
          </Button>
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Abbrechen
          </Button>
        </div>
      </form>
    </div>
  );
}

export default function NeueKontrollePage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-12">
          <div className="text-gray-500">Lade...</div>
        </div>
      }
    >
      <NeueKontrolleContent />
    </Suspense>
  );
}
