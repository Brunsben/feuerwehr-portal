"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import useSWR from "swr";
import Link from "next/link";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

interface StatusData {
  menu: {
    description: string;
    zweiMenuesAktiv: boolean;
    menu1Name: string | null;
    menu2Name: string | null;
    registrationDeadline: string;
    deadlineEnabled: boolean;
  } | null;
  registrationCount: number;
  registrationOpen: boolean;
}

interface StatusPopup {
  type: "success" | "error";
  message: string;
}

export default function FoodTouchPage() {
  const [manualInput, setManualInput] = useState("");
  const [status, setStatus] = useState<StatusPopup | null>(null);
  const [pendingIdentifier, setPendingIdentifier] = useState<{
    card_id?: string;
    personal_number?: string;
  } | null>(null);
  const bufferRef = useRef("");
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { data, mutate } = useSWR<StatusData>("/api/food/status", fetcher, {
    refreshInterval: 10000,
  });

  const { data: me } = useSWR<{ Rolle: string; food_rolle: string | null }>(
    "/api/auth/me",
    fetcher,
  );
  const isFoodAdmin = me?.Rolle === "Admin" || me?.food_rolle === "Admin";

  const showStatus = useCallback(
    (type: "success" | "error", message: string) => {
      setStatus({ type, message });
      setTimeout(() => setStatus(null), 3000);
    },
    [],
  );

  const doRegister = useCallback(
    async (
      identifier: { card_id?: string; personal_number?: string },
      choice?: number,
    ) => {
      try {
        const res = await fetch("/api/food/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...identifier, menu_choice: choice || 1 }),
        });
        const result = await res.json();
        if (res.ok) {
          showStatus(
            "success",
            result.registered ? "Angemeldet ✓" : "Abgemeldet",
          );
          mutate();
        } else {
          showStatus("error", result.error || "Fehler");
        }
      } catch {
        showStatus("error", "Verbindungsfehler");
      }
    },
    [showStatus, mutate],
  );

  const processInput = useCallback(
    (input: string) => {
      const trimmed = input.trim();
      if (!trimmed) return;

      const identifier = /^\d+$/.test(trimmed)
        ? { personal_number: trimmed }
        : { card_id: trimmed };

      if (data?.menu?.zweiMenuesAktiv) {
        setPendingIdentifier(identifier);
      } else {
        doRegister(identifier);
      }
    },
    [data, doRegister],
  );

  // RFID/Barcode scanner keyboard listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.tagName === "INPUT") return;

      if (e.key === "Enter") {
        e.preventDefault();
        const input = bufferRef.current;
        bufferRef.current = "";
        if (timerRef.current) clearTimeout(timerRef.current);
        processInput(input);
      } else if (e.key.length === 1) {
        bufferRef.current += e.key;
        if (timerRef.current) clearTimeout(timerRef.current);
        timerRef.current = setTimeout(() => {
          bufferRef.current = "";
        }, 500);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [processInput]);

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    processInput(manualInput);
    setManualInput("");
  };

  const handleMenuChoiceSelect = (choice: number) => {
    if (pendingIdentifier) {
      doRegister(pendingIdentifier, choice);
      setPendingIdentifier(null);
    }
  };

  const enterFullscreen = () => {
    document.documentElement.requestFullscreen?.();
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 select-none bg-background">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold">Essensanmeldung</h1>
        <p className="text-2xl mt-2 text-muted-foreground">
          {data?.registrationCount ?? 0} Anmeldungen
        </p>
      </div>

      {/* Menu display */}
      {data?.menu ? (
        <div className="bg-card border border-border rounded-2xl shadow-lg p-6 mb-8 w-full max-w-lg text-center">
          <h2 className="text-xl font-semibold mb-2">Heutiges Menü</h2>
          <p className="text-lg text-muted-foreground">
            {data.menu.description}
          </p>
          {data.menu.zweiMenuesAktiv && (
            <div className="mt-3 flex gap-4 justify-center text-sm">
              <span className="bg-blue-500/10 text-blue-500 px-3 py-1 rounded-full">
                Menü 1: {data.menu.menu1Name || "Standard"}
              </span>
              <span className="bg-green-500/10 text-green-500 px-3 py-1 rounded-full">
                Menü 2: {data.menu.menu2Name || "Alternativ"}
              </span>
            </div>
          )}
          {data.menu.deadlineEnabled && (
            <p className="text-sm text-muted-foreground mt-2">
              Anmeldeschluss: {data.menu.registrationDeadline} Uhr
            </p>
          )}
        </div>
      ) : (
        <div className="bg-card border border-border rounded-2xl shadow-lg p-6 mb-8 w-full max-w-lg text-center">
          <p className="text-muted-foreground">
            Kein Menü für heute eingetragen
          </p>
        </div>
      )}

      {/* Scanner area */}
      <div className="bg-blue-500/5 border-2 border-dashed border-blue-500/30 rounded-2xl p-8 mb-6 w-full max-w-lg text-center">
        <p className="text-xl text-blue-500 font-medium">
          Karte an den Scanner halten
        </p>
        <p className="text-sm text-blue-500/70 mt-1">RFID / Barcode</p>
      </div>

      {/* Manual input */}
      <form onSubmit={handleManualSubmit} className="w-full max-w-lg mb-6">
        <div className="flex gap-3">
          <input
            type="text"
            value={manualInput}
            onChange={(e) => setManualInput(e.target.value)}
            placeholder="Personalnummer eingeben..."
            className="flex-1 text-xl p-4 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white text-xl font-semibold rounded-xl transition-colors"
          >
            OK
          </button>
        </div>
      </form>

      {/* Footer links */}
      <div className="flex gap-4 items-center">
        <button
          onClick={enterFullscreen}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          Vollbild
        </button>
        {isFoodAdmin && (
          <Link
            href="/food/admin"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Admin →
          </Link>
        )}
      </div>

      {/* Status popup */}
      {status && (
        <div
          className={`fixed top-8 left-1/2 -translate-x-1/2 px-8 py-4 rounded-xl text-xl font-semibold shadow-2xl z-50 ${
            status.type === "success"
              ? "bg-green-500 text-white"
              : "bg-red-500 text-white"
          }`}
        >
          {status.message}
        </div>
      )}

      {/* Menu choice overlay */}
      {pendingIdentifier && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center">
          <div className="bg-card rounded-2xl p-8 max-w-md w-full mx-4 text-center">
            <h2 className="text-2xl font-bold mb-6">Menü wählen</h2>
            <div className="flex gap-4">
              <button
                onClick={() => handleMenuChoiceSelect(1)}
                className="flex-1 p-6 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-lg font-semibold transition-colors"
              >
                {data?.menu?.menu1Name || "Menü 1"}
              </button>
              <button
                onClick={() => handleMenuChoiceSelect(2)}
                className="flex-1 p-6 bg-green-600 hover:bg-green-700 text-white rounded-xl text-lg font-semibold transition-colors"
              >
                {data?.menu?.menu2Name || "Menü 2"}
              </button>
            </div>
            <button
              onClick={() => setPendingIdentifier(null)}
              className="mt-4 text-sm text-muted-foreground hover:text-foreground"
            >
              Abbrechen
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
