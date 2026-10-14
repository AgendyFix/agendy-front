"use client";

// ============================================
// AVISO "MI SITIO" - Recuerda que las clases grupales se publican en el sitio
// ============================================

import Link from "next/link";
import { Globe } from "lucide-react";

import { useFeatures } from "@/lib/hooks/useFeatures";
import { useIsAdmin } from "@/lib/hooks/useIsAdmin";
import { PUBLIC_SITE_FEATURE } from "./constants";

/** Solo para admins (los únicos que pueden abrir Mi Sitio) y con el módulo encendido. */
export function PublicSiteNotice() {
  const { isFeatureEnabled } = useFeatures();
  const isAdmin = useIsAdmin();
  if (!isAdmin || !isFeatureEnabled(PUBLIC_SITE_FEATURE)) return null;

  return (
    <div className="flex flex-col gap-2 rounded-lg border border-primary/30 bg-primary/5 px-4 py-3 text-sm sm:flex-row sm:items-center sm:justify-between">
      <p className="flex items-start gap-2">
        <Globe className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
        Tus clases grupales activas aparecen en Mi Sitio con sus horarios, para que nuevos alumnos se inscriban.
      </p>
      <Link href="/public-page" className="shrink-0 font-medium text-primary hover:underline">
        Ver Mi Sitio
      </Link>
    </div>
  );
}
