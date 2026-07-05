"use client";

// Página dedicada de Novedades: historial completo del changelog, con espacio
// cómodo para leer (a diferencia del preview del megáfono en el header).

import { useEffect, useState } from "react";
import { Loader2, Megaphone } from "lucide-react";
import { novedadesApi, type ProductUpdate } from "@/lib/api/novedades";
import { format } from "date-fns";
import { es } from "date-fns/locale";

const formatPublishedAt = (isoDate: string): string => {
  try {
    return format(new Date(isoDate), "d 'de' MMMM, yyyy", { locale: es });
  } catch {
    return isoDate;
  }
};

// "Nuevo" para lo publicado en los últimos 7 días.
const isRecent = (isoDate: string): boolean => {
  const published = new Date(isoDate).getTime();
  if (Number.isNaN(published)) return false;
  return Date.now() - published < 7 * 24 * 60 * 60 * 1000;
};

export default function NovedadesPage() {
  const [updates, setUpdates] = useState<ProductUpdate[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    novedadesApi
      .list()
      .then((data) => setUpdates(data.results))
      .catch((error) => console.debug("[Novedades] error:", error))
      .finally(() => setIsLoading(false));
  }, []);

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      {/* Header */}
      <div className="mb-9 flex items-start gap-4">
        <span className="flex h-12 w-12 flex-none items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-sm">
          <Megaphone className="h-6 w-6" />
        </span>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Novedades</h1>
          <p className="mt-1 text-muted-foreground">
            Cada mejora y corrección que hacemos en AgendyFix, en un solo lugar.
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : updates.length === 0 ? (
        <div className="rounded-xl border border-dashed py-20 text-center">
          <Megaphone className="mx-auto mb-3 h-8 w-8 text-muted-foreground/50" />
          <p className="text-sm text-muted-foreground">
            No hay novedades por ahora. Aquí verás cada mejora que publiquemos.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {updates.map((update) => {
            const recent = isRecent(update.published_at);
            return (
              <article
                key={update.id}
                className="group rounded-xl border bg-card p-5 shadow-sm transition-colors hover:border-primary/40"
              >
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  {recent && (
                    <span className="rounded-full bg-primary px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-primary-foreground">
                      Nuevo
                    </span>
                  )}
                  <h2 className="text-lg font-semibold tracking-tight">
                    {update.title}
                  </h2>
                  {update.version && (
                    <span className="rounded-full border px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                      v{update.version}
                    </span>
                  )}
                  <span className="ml-auto text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    {formatPublishedAt(update.published_at)}
                  </span>
                </div>
                <p className="whitespace-pre-line leading-relaxed text-foreground/85">
                  {update.body}
                </p>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
