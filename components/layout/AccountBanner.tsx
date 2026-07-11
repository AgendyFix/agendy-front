"use client";

// ============================================
// ACCOUNT BANNER - Aviso de pago pendiente
// ============================================
// Banner persistente (sin botón de cerrar) que se muestra en todo el
// dashboard cuando la academia tiene la suscripción de AgendyFix impaga.
// Se enciende/apaga manualmente por Paul desde el admin de Django
// (Company.overdue_banner_enabled). No es configurable ni automático.

import { AlertTriangle } from "lucide-react";
import { useAuth } from "@/lib/hooks/useAuth";

export function AccountBanner() {
  const { currentCompany } = useAuth();

  if (!currentCompany?.overdue_banner_enabled) return null;

  return (
    <div
      role="alert"
      className="w-full shrink-0 border-b border-red-700 bg-red-600 px-4 py-2.5 text-white"
    >
      <div className="flex items-center justify-center gap-2.5 text-center">
        <AlertTriangle className="h-5 w-5 shrink-0" />
        <p className="text-sm font-medium">
          Tienes un pago pendiente de tu suscripción a AgendyFix. Escríbenos para
          regularizarlo y seguir usando la plataforma sin interrupciones.
        </p>
      </div>
    </div>
  );
}
