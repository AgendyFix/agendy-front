"use client";

// ============================================
// BROWSER WARNING BANNER
// ============================================
// Detecta Safari < 16 / iOS < 16 y muestra un aviso
// informando al usuario que actualice su navegador.
// Solo se muestra si el browser es incompatible.
// No afecta a browsers modernos.

import { useEffect, useState } from "react";
import { AlertTriangle, X } from "lucide-react";

function detectIncompatibleBrowser(): boolean {
  if (typeof window === "undefined" || typeof navigator === "undefined") return false;

  const ua = navigator.userAgent;

  // Detectar iOS version
  const iosMatch = ua.match(/OS (\d+)_/);
  if (iosMatch) {
    const iosMajor = parseInt(iosMatch[1], 10);
    if (iosMajor < 16) return true;
  }

  // Detectar Safari desktop version (no Chrome/Firefox que también tienen "Safari" en UA)
  const isSafari = /Safari/.test(ua) && !/Chrome|CriOS|FxiOS|EdgA/.test(ua);
  if (isSafari) {
    const safariMatch = ua.match(/Version\/(\d+)/);
    if (safariMatch) {
      const safariMajor = parseInt(safariMatch[1], 10);
      if (safariMajor < 16) return true;
    }
  }

  // Verificar soporte de features clave usadas por el sistema
  // Si no existen, el browser es incompatible independientemente del UA
  try {
    // CSS color-mix es indicador de Safari 16+
    const testEl = document.createElement("div");
    testEl.style.color = "color-mix(in srgb, red 50%, blue)";
    if (!testEl.style.color) return true;
  } catch {
    return true;
  }

  return false;
}

export function BrowserWarning() {
  const [show, setShow] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Solo mostrar una vez por sesión
    const alreadyDismissed = sessionStorage.getItem("browser-warning-dismissed");
    if (alreadyDismissed) return;

    if (detectIncompatibleBrowser()) {
      setShow(true);
    }
  }, []);

  const handleDismiss = () => {
    setDismissed(true);
    sessionStorage.setItem("browser-warning-dismissed", "1");
  };

  if (!show || dismissed) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[9999] p-3 sm:p-4">
      <div className="mx-auto max-w-2xl rounded-xl border border-amber-200 bg-amber-50 shadow-lg px-4 py-3">
        <div className="flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-amber-900">
              Navegador no compatible
            </p>
            <p className="text-xs text-amber-700 mt-0.5">
              Tu navegador ({navigator.userAgent.includes("iPad") ? "iPad" : "dispositivo"}) puede tener problemas para mostrar el sistema correctamente.
              Para la mejor experiencia usa <strong>Safari 16+</strong>, <strong>Chrome</strong> o <strong>Firefox</strong> actualizados.
            </p>
            <p className="text-xs text-amber-600 mt-1">
              <strong>iPad Air 2 y modelos anteriores</strong> no son compatibles con iOS 16 y pueden presentar fallos.
            </p>
          </div>
          <button
            onClick={handleDismiss}
            className="shrink-0 p-1 rounded text-amber-600 hover:bg-amber-100 transition-colors"
            aria-label="Cerrar aviso"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
