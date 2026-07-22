"use client";

// ============================================
// ACCESS SUSPENDED OVERLAY - Bloqueo total de acceso
// ============================================
// Overlay a pantalla completa que cubre TODO el dashboard y bloquea
// la interacción cuando la academia tiene el acceso suspendido
// (Company.access_suspended). Se enciende/apaga manualmente por Paul
// desde el admin de Django. Es independiente del AccountBanner
// (overdue_banner_enabled), que solo es un aviso y no bloquea nada.

import { Lock } from "lucide-react";
import { useAuth } from "@/lib/hooks/useAuth";
import { Button } from "@/components/ui/button";

export function AccessSuspendedOverlay() {
  const { currentCompany, logout } = useAuth();

  if (!currentCompany?.access_suspended) return null;

  return (
    <div
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="access-suspended-title"
      aria-describedby="access-suspended-description"
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-background/95 p-4 backdrop-blur-sm"
    >
      <div className="w-full max-w-md rounded-xl border bg-card p-8 text-center shadow-lg">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-100 text-red-600">
          <Lock className="h-7 w-7" />
        </div>

        <h2 id="access-suspended-title" className="text-lg font-semibold">
          Acceso suspendido
        </h2>

        <p
          id="access-suspended-description"
          className="mt-2 text-sm text-muted-foreground"
        >
          Para seguir usando la plataforma, ponte en contacto con el
          administrador de tu cuenta para restablecer el acceso.
        </p>

        <Button
          variant="secondary"
          className="mt-6 w-full"
          onClick={() => logout()}
        >
          Cerrar sesión
        </Button>
      </div>
    </div>
  );
}
