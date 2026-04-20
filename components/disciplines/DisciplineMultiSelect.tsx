"use client";

// ============================================
// DISCIPLINE TAG INPUT — Creatable inline
// ============================================

import { useEffect, useRef, useState, useCallback } from "react";
import { Loader2, Plus, X, Settings2 } from "lucide-react";
import { toast } from "sonner";

import { cn } from "@/lib/utils";
import { useDisciplines } from "@/lib/hooks/useDisciplines";
import { DisciplineManagerModal } from "@/components/disciplines/DisciplineManagerModal";
import type { DisciplineBasic } from "@/lib/types/models";

// ── Paleta de colores ──────────────────────────────────────────────────────

const TAG_COLORS = [
  { bg: "bg-blue-100",    text: "text-blue-800",    dot: "bg-blue-400"    },
  { bg: "bg-violet-100",  text: "text-violet-800",  dot: "bg-violet-400"  },
  { bg: "bg-emerald-100", text: "text-emerald-800", dot: "bg-emerald-400" },
  { bg: "bg-amber-100",   text: "text-amber-800",   dot: "bg-amber-400"   },
  { bg: "bg-rose-100",    text: "text-rose-800",    dot: "bg-rose-400"    },
  { bg: "bg-cyan-100",    text: "text-cyan-800",    dot: "bg-cyan-400"    },
  { bg: "bg-orange-100",  text: "text-orange-800",  dot: "bg-orange-400"  },
  { bg: "bg-pink-100",    text: "text-pink-800",    dot: "bg-pink-400"    },
];

// ── Props ──────────────────────────────────────────────────────────────────

interface DisciplineMultiSelectProps {
  value: string[];
  onChange: (ids: string[]) => void;
  disabled?: boolean;
  placeholder?: string;
}

function normalizeName(s: string) {
  return s.trim().toLowerCase();
}

// ── Component ──────────────────────────────────────────────────────────────

export function DisciplineMultiSelect({
  value,
  onChange,
  disabled = false,
  placeholder = "Agregar disciplina...",
}: DisciplineMultiSelectProps) {
  const [query, setQuery]               = useState("");
  const [open, setOpen]                 = useState(false);
  const [creating, setCreating]         = useState(false);
  const [managerOpen, setManagerOpen]   = useState(false);
  const [highlightIdx, setHighlightIdx] = useState(0);

  const inputRef        = useRef<HTMLInputElement>(null);
  const wrapperRef      = useRef<HTMLDivElement>(null);
  // Flag para evitar que onBlur cierre el dropdown cuando el click fue dentro del componente
  const mouseDownInside = useRef(false);

  const { disciplines, isLoading, fetchDisciplines, createDiscipline } = useDisciplines();

  useEffect(() => { fetchDisciplines(); }, [fetchDisciplines]);

  // ── Color map ────────────────────────────────────────────────────────────

  const colorMap: Record<string, typeof TAG_COLORS[number]> = {};
  disciplines.forEach((d, i) => { colorMap[d.id] = TAG_COLORS[i % TAG_COLORS.length]; });

  // ── Derived state ────────────────────────────────────────────────────────

  const selected: DisciplineBasic[] = value
    .map((id) => disciplines.find((d) => d.id === id))
    .filter((d): d is NonNullable<typeof d> => d !== undefined)
    .map((d) => ({ id: d.id, name: d.name }));

  const filtered = disciplines.filter(
    (d) => !value.includes(d.id) && d.name.toLowerCase().includes(query.toLowerCase())
  );

  const exactMatch = disciplines.some((d) => normalizeName(d.name) === normalizeName(query));
  const showCreate = query.trim().length >= 2 && !exactMatch;

  type Item = { type: "create" } | { type: "option"; id: string } | { type: "manage" };
  const items: Item[] = [
    ...(showCreate ? [{ type: "create" } as Item] : []),
    ...filtered.map((d) => ({ type: "option", id: d.id } as Item)),
    { type: "manage" },
  ];

  useEffect(() => { setHighlightIdx(0); }, [query]);

  // ── Close on outside click ───────────────────────────────────────────────
  // Usamos el blur del input como señal de cierre, pero lo bloqueamos cuando
  // el mousedown ocurrió dentro del propio componente.

  const handleBlur = useCallback(() => {
    // Si el mousedown fue dentro del wrapper, no cerramos
    if (mouseDownInside.current) return;
    setOpen(false);
    setQuery("");
  }, []);

  // Marcar mousedown dentro/fuera antes de que blur se dispare
  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      mouseDownInside.current =
        wrapperRef.current?.contains(e.target as Node) ?? false;
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  // ── Handlers ────────────────────────────────────────────────────────────

  const openDropdown = () => {
    if (!disabled) {
      setOpen(true);
      inputRef.current?.focus();
    }
  };

  const remove = (id: string) => {
    onChange(value.filter((v) => v !== id));
  };

  const select = useCallback((id: string) => {
    onChange([...value, id]);
    setQuery("");
    setOpen(true); // mantener abierto explícitamente
    // Programamos el foco para después del re-render
    setTimeout(() => inputRef.current?.focus(), 0);
  }, [value, onChange]);

  const handleCreate = async () => {
    if (!query.trim()) return;
    const name = query.trim();
    try {
      setCreating(true);
      const created = await createDiscipline(name);
      onChange([...value, created.id]);
      setQuery("");
      setOpen(true);
      toast.success(`"${created.name}" creada`);
    } catch {
      toast.error("Error al crear la disciplina");
    } finally {
      setCreating(false);
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && query === "" && selected.length > 0) {
      onChange(value.slice(0, -1));
      return;
    }
    if (e.key === "Escape") { setOpen(false); setQuery(""); return; }
    if (!open) {
      if (e.key === "ArrowDown" || e.key === "Enter") setOpen(true);
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightIdx((i) => Math.min(i + 1, items.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightIdx((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const item = items[highlightIdx];
      if (!item) return;
      if (item.type === "create") handleCreate();
      else if (item.type === "option") select(item.id);
      else if (item.type === "manage") { setOpen(false); setManagerOpen(true); }
    }
  };

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <>
      <div ref={wrapperRef} className="relative w-full">

        {/* ── Campo con tags + input ── */}
        <div
          className={cn(
            "flex flex-wrap items-center gap-1.5 min-h-9 w-full rounded-md border border-input bg-background px-3 py-2 text-sm cursor-text",
            "focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 focus-within:ring-offset-background",
            disabled && "cursor-not-allowed opacity-50"
          )}
          onMouseDown={(e) => {
            // Clic en el contenedor (fondo), no en un tag ni en el input
            if (e.target === e.currentTarget) {
              e.preventDefault();
              openDropdown();
            }
          }}
        >
          {/* Tags seleccionados */}
          {selected.map((d) => {
            const color = colorMap[d.id] ?? TAG_COLORS[0];
            return (
              <span
                key={d.id}
                className={cn(
                  "inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium leading-none select-none",
                  color.bg, color.text
                )}
              >
                {d.name}
                {!disabled && (
                  <button
                    type="button"
                    aria-label={`Quitar ${d.name}`}
                    className="opacity-60 hover:opacity-100 transition-opacity"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      remove(d.id);
                    }}
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </span>
            );
          })}

          {/* Input inline */}
          <input
            ref={inputRef}
            type="text"
            autoComplete="off"
            spellCheck={false}
            disabled={disabled || isLoading}
            placeholder={selected.length === 0 ? (isLoading ? "Cargando..." : placeholder) : ""}
            value={query}
            className="flex-1 min-w-[100px] bg-transparent outline-none placeholder:text-muted-foreground text-sm disabled:cursor-not-allowed"
            onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
            onFocus={() => setOpen(true)}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
          />

          {creating && (
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground shrink-0" />
          )}
        </div>

        {/* ── Dropdown ── */}
        {open && !disabled && (
          <div className="absolute z-50 top-full left-0 mt-1 w-full rounded-md border bg-popover text-popover-foreground shadow-md">
            <ul className="max-h-60 overflow-y-auto py-1">

              {/* Crear nueva */}
              {showCreate && (() => {
                const idx = items.findIndex((i) => i.type === "create");
                return (
                  <li
                    key="create"
                    className={cn(
                      "flex items-center gap-2 px-3 py-2 text-sm cursor-pointer text-primary font-medium",
                      highlightIdx === idx ? "bg-accent" : "hover:bg-accent/50"
                    )}
                    onMouseDown={(e) => { e.preventDefault(); handleCreate(); }}
                    onMouseEnter={() => setHighlightIdx(idx)}
                  >
                    {creating
                      ? <Loader2 className="h-4 w-4 animate-spin shrink-0" />
                      : <Plus className="h-4 w-4 shrink-0" />
                    }
                    Crear &quot;{query.trim()}&quot;
                  </li>
                );
              })()}

              {/* Mensaje vacío */}
              {filtered.length === 0 && !showCreate && (
                <li className="px-3 py-2 text-sm text-muted-foreground select-none">
                  {query.trim().length === 0
                    ? (value.length > 0 && value.length === disciplines.length
                        ? "Todas las disciplinas seleccionadas"
                        : "Escribe para buscar o crear...")
                    : "Sin resultados — escribe mín. 2 caracteres para crear"}
                </li>
              )}

              {/* Opciones */}
              {filtered.map((d) => {
                const idx  = items.findIndex((i) => i.type === "option" && i.id === d.id);
                const color = colorMap[d.id] ?? TAG_COLORS[0];
                return (
                  <li
                    key={d.id}
                    className={cn(
                      "flex items-center gap-2.5 px-3 py-2 text-sm cursor-pointer",
                      highlightIdx === idx ? "bg-accent" : "hover:bg-accent/50"
                    )}
                    onMouseDown={(e) => { e.preventDefault(); select(d.id); }}
                    onMouseEnter={() => setHighlightIdx(idx)}
                  >
                    <span className={cn("h-2 w-2 rounded-full shrink-0", color.dot)} />
                    {d.name}
                  </li>
                );
              })}

              {/* Separador + Administrar */}
              {(filtered.length > 0 || showCreate) && (
                <li className="border-t my-1 pointer-events-none" />
              )}
              {(() => {
                const idx = items.findIndex((i) => i.type === "manage");
                return (
                  <li
                    key="manage"
                    className={cn(
                      "flex items-center gap-2 px-3 py-2 text-xs text-muted-foreground cursor-pointer",
                      highlightIdx === idx ? "bg-accent" : "hover:bg-accent/50"
                    )}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      setOpen(false);
                      setManagerOpen(true);
                    }}
                    onMouseEnter={() => setHighlightIdx(idx)}
                  >
                    <Settings2 className="h-3.5 w-3.5 shrink-0" />
                    Administrar disciplinas
                  </li>
                );
              })()}

            </ul>
          </div>
        )}

      </div>

      <DisciplineManagerModal
        open={managerOpen}
        onOpenChange={(o) => {
          setManagerOpen(o);
          if (!o) {
            fetchDisciplines(true);
            // Restaurar foco al cerrar el manager
            setTimeout(() => inputRef.current?.focus(), 0);
          }
        }}
      />
    </>
  );
}
