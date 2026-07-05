// ============================================
// NOVEDADES BUTTON - AgendyFix
// Changelog de producto: ícono de megáfono con badge
// de "no vistas" + panel con la lista de novedades.
// ============================================

"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, Megaphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { novedadesApi, type ProductUpdate } from "@/lib/api/novedades";
import { format } from "date-fns";
import { es } from "date-fns/locale";

const formatPublishedAt = (isoDate: string): string => {
  try {
    return format(new Date(isoDate), "d MMM yyyy", { locale: es });
  } catch {
    return isoDate;
  }
};

export const NovedadesButton = () => {
  const [open, setOpen] = useState(false);
  const [updates, setUpdates] = useState<ProductUpdate[]>([]);
  const [unseen, setUnseen] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [hasLoaded, setHasLoaded] = useState(false);

  const fetchNovedades = useCallback(async () => {
    try {
      const data = await novedadesApi.list();
      setUpdates(data.results);
      setUnseen(data.unseen);
      setHasLoaded(true);
    } catch (error) {
      // Silencioso: si falla, simplemente no mostramos badge/lista. No debe
      // romper el header ni el resto de la app.
      console.debug("[Novedades] No se pudo obtener la lista:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNovedades();
  }, [fetchNovedades]);

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);
    if (!nextOpen) return;

    // Optimista: limpiamos el badge en cuanto se abre el panel.
    setUnseen(0);
    novedadesApi.markSeen().catch((error) => {
      console.debug("[Novedades] No se pudo marcar como vistas:", error);
    });

    // Si el fetch inicial falló (o nunca cargó), reintentamos al abrir.
    if (!hasLoaded) {
      setIsLoading(true);
      fetchNovedades();
    }
  };

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Megaphone className="h-5 w-5" />
          {unseen > 0 && (
            <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
              {unseen > 99 ? "99+" : unseen}
            </span>
          )}
          <span className="sr-only">Novedades</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96 p-0" align="end">
        <div className="flex flex-col">
          {/* Header */}
          <div className="border-b px-4 py-3">
            <h3 className="font-semibold">Novedades</h3>
          </div>

          {/* Content */}
          <ScrollArea className="h-[400px]">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : updates.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <p className="text-sm text-muted-foreground">
                  No hay novedades por ahora.
                </p>
              </div>
            ) : (
              <div className="divide-y">
                {updates.map((update) => (
                  <div key={update.id} className="px-4 py-3 space-y-1">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-semibold">{update.title}</p>
                      {update.version && (
                        <span className="flex-shrink-0 rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                          {update.version}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {formatPublishedAt(update.published_at)}
                    </p>
                    <p className="text-sm whitespace-pre-line text-foreground/90">
                      {update.body}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>
      </PopoverContent>
    </Popover>
  );
};
