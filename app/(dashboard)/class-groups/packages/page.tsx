"use client";

// ============================================
// PAQUETES - Precio por número de grupos (lista)
// ============================================

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ChevronRight, Layers, Loader2, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { tuitionTablesApi } from "@/lib/api/tuitionTables";
import { formatFrom, tiersLabel } from "@/lib/tuition";
import type { TuitionTable } from "@/lib/types/models";

export default function PackagesPage() {
  const router = useRouter();
  const [tables, setTables] = useState<TuitionTable[] | null>(null);
  const [error, setError] = useState(false);

  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    tuitionTablesApi.getAll()
      .then((t) => { setTables(t); setError(false); })
      .catch(() => setError(true));
  }, [attempt]);
  const load = () => setAttempt((n) => n + 1);

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-start gap-3">
        <Button variant="ghost" size="icon" className="shrink-0" aria-label="Volver a grupos" onClick={() => router.push("/class-groups")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-bold tracking-tight">Paquetes</h1>
          <p className="text-sm text-muted-foreground">
            Un solo cobro mensual por todos los grupos del paquete.
          </p>
        </div>
        <Button className="shrink-0" onClick={() => router.push("/class-groups/packages/new")}>
          <Plus className="h-4 w-4 sm:mr-2" />
          <span className="hidden sm:inline">Nuevo</span>
          <span className="sr-only sm:hidden">Nuevo paquete</span>
        </Button>
      </div>

      {error ? (
        <div className="rounded-lg border p-6 text-center space-y-3">
          <p className="text-sm text-muted-foreground">No se pudieron cargar los paquetes.</p>
          <Button variant="outline" size="sm" onClick={load}>Reintentar</Button>
        </div>
      ) : tables === null ? (
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Cargando…
        </p>
      ) : tables.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-lg border py-10 px-4 text-center">
          <Layers className="h-8 w-8 text-muted-foreground/30" />
          <p className="text-sm text-muted-foreground">
            Aún no tienes paquetes. Crea uno y luego márcalo en cada grupo.
          </p>
        </div>
      ) : (
        <ul className="space-y-2">
          {tables.map((t) => {
            const n = t.groups?.length ?? 0;
            return (
              <li key={t.id}>
                <Link
                  href={`/class-groups/packages/${t.id}`}
                  className="flex items-center gap-3 rounded-lg border bg-card p-4 hover:bg-muted/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <div className="min-w-0 flex-1 space-y-1">
                    <p className="font-semibold break-words">
                      {t.name}
                      <span className="font-normal text-muted-foreground"> · {n} {n === 1 ? "grupo" : "grupos"}</span>
                    </p>
                    <p className="text-sm text-muted-foreground">{tiersLabel(t.tiers)}</p>
                    {t.pending_tiers && t.pending_from && (
                      <p className="text-xs text-blue-700 dark:text-blue-300">
                        Desde el {formatFrom(t.pending_from)}: {tiersLabel(t.pending_tiers)}
                      </p>
                    )}
                  </div>
                  <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
