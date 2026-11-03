"use client";

// ============================================
// BROWSER WARNING BANNER
// ============================================
// Detecta Safari < 15.4 / iOS < 15.4 y muestra un aviso
// informando al usuario que actualice su navegador.
// Solo se muestra si el browser es incompatible.
// No afecta a browsers modernos.

import { useState, useSyncExternalStore } from "react";
import { AlertTriangle, X } from "lucide-react";

// Piso real: Safari/iOS 15.4 (oklch y los fallbacks de postcss-color-mix-fallback.cjs).
const MIN_VERSION = { major: 15, minor: 4 };
const DISMISSED_KEY = "browser-warning-dismissed";

function isBelowMinimum(major: number, minor: number): boolean {
  return major < MIN_VERSION.major || (major === MIN_VERSION.major && minor < MIN_VERSION.minor);
}

function detectIncompatibleBrowser(): boolean {
  const ua = navigator.userAgent;

  // Detectar iOS version
  const iosMatch = ua.match(/OS (\d+)_(\d+)/);
  if (iosMatch && isBelowMinimum(Number(iosMatch[1]), Number(iosMatch[2]))) return true;

  // Detectar Safari desktop version (no Chrome/Firefox que también tienen "Safari" en UA)
  const isSafari = /Safari/.test(ua) && !/Chrome|CriOS|FxiOS|EdgA/.test(ua);
  const safariMatch = isSafari && ua.match(/Version\/(\d+)\.(\d+)/);
  if (safariMatch && isBelowMinimum(Number(safariMatch[1]), Number(safariMatch[2]))) return true;

  return false;
}

// Ni el UA ni el aviso descartado cambian durante la sesión: no hay nada a qué suscribirse.
const subscribe = () => () => {};
const getSnapshot = () => !sessionStorage.getItem(DISMISSED_KEY) && detectIncompatibleBrowser();
const getServerSnapshot = () => false;

export function BrowserWarning() {
  const show = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const [dismissed, setDismissed] = useState(false);

  const handleDismiss = () => {
    setDismissed(true);
    sessionStorage.setItem(DISMISSED_KEY, "1");
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
              Para la mejor experiencia usa <strong>Safari 15.4+</strong>, <strong>Chrome</strong> o <strong>Firefox</strong> actualizados.
            </p>
            <p className="text-xs text-amber-600 mt-1">
              <strong>iPad mini 3, iPad Air (1ª gen.) y modelos anteriores</strong> no son compatibles con iOS 15 y pueden presentar fallos.
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
