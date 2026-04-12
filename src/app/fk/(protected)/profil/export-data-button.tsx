"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { fkApiFetch } from "@/lib/fk-api-fetch";

export default function ExportDataButton() {
  const [loading, setLoading] = useState(false);

  async function handleExport() {
    setLoading(true);
    try {
      const res = await fkApiFetch("/api/user/export");
      if (res.ok) {
        const data = await res.json();
        const blob = new Blob([JSON.stringify(data, null, 2)], {
          type: "application/json",
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `meine-daten-${new Date().toISOString().split("T")[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
        toast.success("Daten exportiert!");
      } else {
        toast.error("Export fehlgeschlagen.");
      }
    } catch {
      toast.error("Ein Fehler ist aufgetreten.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleExport}
      disabled={loading}
    >
      📥 {loading ? "Exportiert..." : "Meine Daten exportieren (Art. 15)"}
    </Button>
  );
}
