"use client";

// ============================================
// PAGINATION — Componente reutilizable
// ============================================
// Muestra: « Anterior  1 2 … 5 6 [7] 8 9 … 14 15  Siguiente »
// Con íconos de primera/última página y ellipsis inteligente.

import { ChevronsLeft, ChevronsRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// ── Props ──────────────────────────────────────────────────────────────────

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  hasPrevious: boolean;
  hasNext: boolean;
  isLoading?: boolean;
  /** Cuántos números mostrar a cada lado de la página actual. Default: 1 */
  siblings?: number;
  onPageChange: (page: number) => void;
  /** Información adicional (ej: "47 alumnos") */
  info?: string;
}

// ── Helpers ────────────────────────────────────────────────────────────────

/**
 * Genera el array de páginas a mostrar, con null para ellipsis.
 * Ej: [1, null, 5, 6, 7, null, 15]
 */
function buildPageRange(
  current: number,
  total: number,
  siblings: number
): (number | null)[] {
  // Siempre mostrar primera, última, y "siblings" a cada lado del actual
  const range = new Set<number>();
  range.add(1);
  range.add(total);
  for (let i = Math.max(2, current - siblings); i <= Math.min(total - 1, current + siblings); i++) {
    range.add(i);
  }

  const sorted = Array.from(range).sort((a, b) => a - b);

  // Insertar null (ellipsis) donde haya saltos de más de 1
  const result: (number | null)[] = [];
  for (let i = 0; i < sorted.length; i++) {
    if (i > 0 && sorted[i] - sorted[i - 1] > 1) {
      result.push(null); // ellipsis
    }
    result.push(sorted[i]);
  }
  return result;
}

// ── Component ──────────────────────────────────────────────────────────────

export function Pagination({
  currentPage,
  totalPages,
  hasPrevious,
  hasNext,
  isLoading = false,
  siblings = 1,
  onPageChange,
  info,
}: PaginationProps) {
  if (totalPages <= 1) return null;

  const pages = buildPageRange(currentPage, totalPages, siblings);
  const disabled = isLoading;

  return (
    <div className="flex items-center justify-between gap-4 px-1 py-3 flex-wrap">

      {/* Info de resultados */}
      <p className="text-sm text-muted-foreground order-2 sm:order-1">
        {info
          ? info
          : `Página ${currentPage} de ${totalPages}`
        }
      </p>

      {/* Controles */}
      <div className="flex items-center gap-1 order-1 sm:order-2">

        {/* Primera página */}
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          onClick={() => onPageChange(1)}
          disabled={!hasPrevious || disabled}
          title="Primera página"
        >
          <ChevronsLeft className="h-4 w-4" />
        </Button>

        {/* Números de página */}
        <div className="flex items-center gap-1">
          {pages.map((page, idx) =>
            page === null ? (
              // Ellipsis
              <span
                key={`ellipsis-${idx}`}
                className="h-8 w-8 flex items-center justify-center text-sm text-muted-foreground select-none"
              >
                …
              </span>
            ) : (
              <Button
                key={page}
                variant={page === currentPage ? "default" : "outline"}
                size="icon"
                className={cn(
                  "h-8 w-8 text-sm font-medium",
                  page === currentPage && "pointer-events-none"
                )}
                onClick={() => onPageChange(page)}
                disabled={disabled}
                aria-current={page === currentPage ? "page" : undefined}
              >
                {page}
              </Button>
            )
          )}
        </div>

        {/* Última página */}
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          onClick={() => onPageChange(totalPages)}
          disabled={!hasNext || disabled}
          title="Última página"
        >
          <ChevronsRight className="h-4 w-4" />
        </Button>

      </div>
    </div>
  );
}
