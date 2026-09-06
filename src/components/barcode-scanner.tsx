"use client";

import { useEffect, useRef, useState } from "react";
import {
  BrowserMultiFormatReader,
  type IScannerControls,
} from "@zxing/browser";
import { X, Loader2, Camera } from "lucide-react";

interface BarcodeScannerProps {
  /** Wird mit dem erkannten Code aufgerufen. Der Scanner schließt sich danach. */
  onScan: (code: string) => void;
  onClose: () => void;
  title?: string;
}

/**
 * Kamera-Scanner für QR- und 1D-Barcodes (Seriennummern).
 * Nutzt ZXing (funktioniert auch auf iOS Safari, wo BarcodeDetector fehlt).
 */
export function BarcodeScanner({
  onScan,
  onClose,
  title = "Code scannen",
}: BarcodeScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const controlsRef = useRef<IScannerControls | null>(null);
  const onScanRef = useRef(onScan);
  onScanRef.current = onScan;

  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const reader = new BrowserMultiFormatReader();
    let active = true;

    (async () => {
      try {
        const controls = await reader.decodeFromConstraints(
          { video: { facingMode: { ideal: "environment" } } },
          videoRef.current!,
          (result) => {
            if (!active || !result) return;
            active = false;
            controlsRef.current?.stop();
            onScanRef.current(result.getText());
          },
        );
        controlsRef.current = controls;
        if (!active) controls.stop();
        else setReady(true);
      } catch (e) {
        setError(
          e instanceof Error
            ? e.message
            : "Kamera nicht verfügbar. Bitte Berechtigung prüfen.",
        );
      }
    })();

    return () => {
      active = false;
      controlsRef.current?.stop();
    };
  }, []);

  return (
    <div className="fixed inset-0 bg-black/80 z-[60] flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-lg p-4 w-full max-w-md space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold flex items-center gap-2">
            <Camera className="h-4 w-4" />
            {title}
          </h3>
          <button onClick={onClose} className="p-1 hover:bg-muted rounded">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="relative aspect-square w-full overflow-hidden rounded-md bg-black">
          {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
          <video
            ref={videoRef}
            className="h-full w-full object-cover"
            playsInline
            muted
          />
          {!ready && !error && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-white/80">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span className="text-xs">Kamera wird gestartet…</span>
            </div>
          )}
          {ready && (
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <div className="h-2/3 w-2/3 rounded-lg border-2 border-white/70" />
            </div>
          )}
        </div>

        {error ? (
          <p className="text-sm text-red-500">{error}</p>
        ) : (
          <p className="text-xs text-muted-foreground text-center">
            Code (QR oder Barcode) im Rahmen positionieren.
          </p>
        )}
      </div>
    </div>
  );
}
