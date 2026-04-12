"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { fkApiFetch } from "@/lib/fk-api-fetch";

export default function CheckActions({ checkId }: { checkId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");

  async function handleAction(result: "approved" | "rejected") {
    setLoading(true);
    try {
      const res = await fkApiFetch(`/api/admin/checks/${checkId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ result, rejectionReason }),
      });

      if (res.ok) {
        toast.success(
          result === "approved"
            ? "Kontrolle bestätigt!"
            : "Kontrolle abgelehnt.",
        );
        router.refresh();
      } else {
        const data = await res.json();
        toast.error(data.error || "Fehler");
      }
    } catch {
      toast.error("Ein Fehler ist aufgetreten.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col sm:flex-row gap-2">
      <Button
        size="sm"
        className="bg-green-600 hover:bg-green-700"
        onClick={() => handleAction("approved")}
        disabled={loading}
      >
        ✅ Bestätigen
      </Button>
      <div className="flex gap-2 flex-1">
        <Input
          placeholder="Ablehnungsgrund..."
          value={rejectionReason}
          onChange={(e) => setRejectionReason(e.target.value)}
          className="text-sm"
        />
        <Button
          size="sm"
          variant="outline"
          className="text-red-600 border-red-300 hover:bg-red-50"
          onClick={() => handleAction("rejected")}
          disabled={loading || !rejectionReason}
        >
          ❌ Ablehnen
        </Button>
      </div>
    </div>
  );
}
