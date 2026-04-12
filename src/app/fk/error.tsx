"use client";

import { useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function FkError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100 text-3xl">
            ⚠️
          </div>
          <CardTitle className="text-2xl">Etwas ist schiefgelaufen</CardTitle>
        </CardHeader>
        <CardContent className="text-center">
          <p className="text-sm text-muted-foreground mb-6">
            Ein unerwarteter Fehler ist aufgetreten. Bitte versuche es erneut.
          </p>
          <button
            onClick={reset}
            className="inline-flex items-center justify-center rounded-lg bg-red-600 px-6 py-3 text-sm font-medium text-white hover:bg-red-700 transition-colors"
          >
            Erneut versuchen
          </button>
        </CardContent>
      </Card>
    </div>
  );
}
