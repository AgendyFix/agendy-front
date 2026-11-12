"use client";

// ============================================
// Inscribir a varios grupos: lista con casillas + resumen de mensualidad
// ============================================
// Lo usan "Nuevo alumno" y "Inscribir alumno" (desde la ficha). Con
// tabulador, los grupos del paquete suman un solo precio por escalón
// (lib/tuition.ts); los grupos de precio fijo cobran el suyo.

import { useState } from "react";
import { BellRing, Check, Clock } from "lucide-react";

import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { enrollmentSummary, type EnrollmentSummary } from "@/lib/tuition";
import type { ClassGroup, Enrollment, TuitionTable } from "@/lib/types/models";

const money = (n: number) => `$${n.toLocaleString("es-MX")}`;
const grupos = (n: number) => `${n} ${n === 1 ? "grupo" : "grupos"}`;

/** Con más grupos que esto se muestra un buscador arriba de la lista */
const SEARCH_THRESHOLD = 8;

interface Props {
  /** Grupos colectivos disponibles */
  groups: ClassGroup[];
  value: string[];
  onChange: (ids: string[]) => void;
  tables: TuitionTable[];
  /** Inscripciones actuales del alumno (ficha): marcan "ya inscrito" y el escalón previo */
  existing?: Enrollment[];
  /** Oculta el resumen (p. ej. con precio especial, que saca al grupo del paquete) */
  hideSummary?: boolean;
  disabled?: boolean;
}

export function GroupMultiPicker({
  groups, value, onChange, tables, existing = [], hideSummary, disabled,
}: Props) {
  const [query, setQuery] = useState("");
  const enrolledStatus = new Map(
    existing
      .filter((e) => e.status === "active" || e.status === "paused")
      .map((e) => [e.class_group, e.status] as const)
  );
  const tableName = new Map(tables.map((t) => [t.id, t.name]));
  const selected = groups.filter((g) => value.includes(g.id));
  const summary = enrollmentSummary(selected, groups, tables, existing);

  // Los seleccionados siempre visibles aunque no coincidan con la búsqueda
  const q = query.trim().toLowerCase();
  const visible = q
    ? groups.filter((g) => value.includes(g.id) || g.name.toLowerCase().includes(q))
    : groups;

  const toggle = (id: string) =>
    onChange(value.includes(id) ? value.filter((v) => v !== id) : [...value, id]);

  const sideLabel = (g: ClassGroup) => {
    const status = enrolledStatus.get(g.id);
    if (status === "paused") return "Pausado";
    if (status) return "Ya inscrito";
    if (g.tuition_table && tableName.has(g.tuition_table)) {
      return tables.length === 1 ? "Paquete" : `Paquete ${tableName.get(g.tuition_table)}`;
    }
    return g.monthly_fee != null ? `${money(g.monthly_fee)}/mes` : "";
  };

  return (
    <div className="min-w-0 space-y-3">
      {groups.length > SEARCH_THRESHOLD && (
        <Input
          type="search"
          placeholder="Buscar grupo…"
          aria-label="Buscar grupo"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          disabled={disabled}
        />
      )}

      <ul className="space-y-2" role="group" aria-label="Grupos">
        {visible.map((g) => {
          const status = enrolledStatus.get(g.id);
          const isEnrolled = !!status;
          const checked = isEnrolled || value.includes(g.id);
          const label = sideLabel(g);
          return (
            <li key={g.id}>
              <button
                type="button"
                role="checkbox"
                aria-checked={checked}
                aria-label={isEnrolled ? `${g.name}, ${label.toLowerCase()}` : undefined}
                disabled={disabled || isEnrolled}
                onClick={() => toggle(g.id)}
                className={cn(
                  "flex w-full items-center gap-3 rounded-lg border p-3 text-left transition-colors",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                  checked && !isEnrolled ? "border-primary bg-primary/5" : "bg-background",
                  isEnrolled && "opacity-60",
                )}
              >
                <span
                  className={cn(
                    "flex h-5 w-5 shrink-0 items-center justify-center rounded border",
                    checked ? "border-primary bg-primary text-primary-foreground" : "border-input",
                  )}
                >
                  {checked && <Check className="h-3.5 w-3.5" />}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block break-words text-sm font-medium">{g.name}</span>
                  {g.schedule_display && (
                    <span className="flex items-start gap-1 text-xs text-muted-foreground">
                      <Clock className="mt-0.5 h-3 w-3 shrink-0" />
                      <span className="min-w-0 break-words">{g.schedule_display}</span>
                    </span>
                  )}
                </span>
                {label && (
                  <span className="max-w-[30%] shrink-0 text-right text-xs leading-tight text-muted-foreground">
                    {label}
                  </span>
                )}
              </button>
            </li>
          );
        })}
        {visible.length === 0 && (
          <li className="py-4 text-center text-sm text-muted-foreground">Ningún grupo coincide</li>
        )}
      </ul>

      {/* Región viva siempre montada: así el lector de pantalla anuncia el primer total */}
      <div aria-live="polite" aria-atomic="true">
        {selected.length > 0 && !hideSummary && (
          <SummaryBox summary={summary} hasExisting={existing.length > 0} />
        )}
      </div>
    </div>
  );
}

function SummaryBox({ summary, hasExisting }: { summary: EnrollmentSummary; hasExisting: boolean }) {
  const raises = summary.lines.some((l) => l.kind === "package" && l.before > 0);
  // Lo que ya pagaba y no cambia (otros grupos), para que el total cuadre
  const shown = summary.lines.reduce((n, l) => n + (l.kind === "package" ? l.feeAfter : l.fee), 0);
  const alreadyPays = summary.monthlyTotal - shown;
  return (
    <div className="rounded-lg border bg-muted/30 p-3 text-sm space-y-1.5">
      {summary.lines.map((l) =>
        l.kind === "package" ? (
          <div key={l.tableId} className="flex items-baseline justify-between gap-3">
            <span>
              {l.name} · {grupos(l.after)}
              {l.before > 0 && (
                <span className="text-xs text-muted-foreground"> (antes {money(l.feeBefore)})</span>
              )}
            </span>
            <span className="font-medium">{money(l.feeAfter)}/mes</span>
          </div>
        ) : (
          <div key={l.groupId} className="flex items-baseline justify-between gap-3">
            <span>{l.name}</span>
            <span className="font-medium">{money(l.fee)}/mes</span>
          </div>
        )
      )}
      {alreadyPays > 0 && (
        <div className="flex items-baseline justify-between gap-3 text-muted-foreground">
          <span>Ya paga por sus otros grupos</span>
          <span>{money(alreadyPays)}/mes</span>
        </div>
      )}
      <div className="flex items-baseline justify-between gap-3 border-t pt-1.5 font-semibold">
        <span>{hasExisting ? "Mensualidad total del alumno" : "Total mensual"}</span>
        <span>{money(summary.monthlyTotal)}</span>
      </div>
      {raises && (
        <p className="flex items-start gap-1.5 rounded-md border border-amber-200 bg-amber-50 px-2 py-1.5 text-xs text-amber-800 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
          <BellRing className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <span>El cobro ya generado de este mes no cambia. El nuevo precio aplica desde el siguiente cobro.</span>
        </p>
      )}
    </div>
  );
}
