"use client";

import { useState } from "react";
import { fkApiFetch } from "@/lib/fk-api-fetch";

export function FkSyncButton() {
  const [syncing, setSyncing] = useState(false);
  const [result, setResult] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);

  async function handleSync() {
    setSyncing(true);
    setResult(null);
    try {
      const res = await fkApiFetch("/api/admin/sync", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
      setResult({
        message: `Sync erfolgreich: ${data.created} neu, ${data.updated} aktualisiert, ${data.deactivated} deaktiviert`,
        type: "success",
      });
      setTimeout(() => window.location.reload(), 1500);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Unbekannter Fehler";
      setResult({ message: msg, type: "error" });
    } finally {
      setSyncing(false);
    }
  }

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={handleSync}
        disabled={syncing}
        className="inline-flex items-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
      >
        {syncing ? "Synchronisiere…" : "↻ Sync mit Portal"}
      </button>
      {result && (
        <span
          className={`text-sm ${result.type === "success" ? "text-green-600" : "text-red-600"}`}
        >
          {result.message}
        </span>
      )}
    </div>
  );
}
