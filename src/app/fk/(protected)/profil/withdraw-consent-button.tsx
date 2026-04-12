"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { fkApiFetch } from "@/lib/fk-api-fetch";

export default function WithdrawConsentButton() {
  const [loading, setLoading] = useState(false);

  async function handleWithdraw() {
    if (
      !confirm(
        "Möchtest du deine Einwilligung zu E-Mail-Benachrichtigungen widerrufen? Du erhältst dann keine Erinnerungen mehr.",
      )
    ) {
      return;
    }

    setLoading(true);
    try {
      const res = await fkApiFetch("/api/user/withdraw-consent", {
        method: "POST",
      });
      if (res.ok) {
        toast.success("Einwilligung zu E-Mail-Benachrichtigungen widerrufen.");
        window.location.reload();
      } else {
        toast.error("Fehler beim Widerrufen.");
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
      className="text-red-600 border-red-300"
      onClick={handleWithdraw}
      disabled={loading}
    >
      🚫 {loading ? "Wird widerrufen..." : "E-Mail-Einwilligung widerrufen"}
    </Button>
  );
}
