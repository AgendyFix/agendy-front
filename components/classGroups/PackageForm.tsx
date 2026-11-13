"use client";

// ============================================
// Formulario de paquete: nombre + escalones (precio por número de grupos)
// ============================================
// Lo usan la página /class-groups/packages/[id] y el diálogo "Crear paquete"
// del formulario de grupo. Filas: "1 grupo", escalones intermedios (2, 3…) y
// "Todos" (opcional: el alumno tiene todos los grupos del paquete). Sin
// "Todos", con más grupos que el último escalón paga el último.

import { useState, type ReactNode } from "react";
import { Info, Loader2, Plus, X } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { tuitionTablesApi } from "@/lib/api/tuitionTables";
import { TIER_ALL, formatFrom, nextMonthStartLabel, tiersChanged, tiersLabel } from "@/lib/tuition";
import type { TuitionTable, TuitionTier } from "@/lib/types/models";

/** "1 grupo" y "Todos" */
const DEFAULT_ROWS = ["", ""];

interface Props {
  /** Paquete a editar; sin él se crea uno nuevo */
  initial?: TuitionTable;
  onSaved: (table: TuitionTable) => void | Promise<void>;
  onCancel?: () => void;
  /** La página de edición muestra y edita el nombre en el título */
  hideName?: boolean;
  /** Contenido extra antes de los botones (p.ej. elegir grupos al crear) */
  children?: ReactNode;
}

export function PackageForm({ initial, onSaved, onCancel, hideName = false, children }: Props) {
  // Se edita lo último que se guardó: si hay un cambio programado, ese
  const base = initial?.pending_tiers ?? initial?.tiers;
  const [name, setName] = useState(initial?.name ?? "");
  // fees[0] = 1 grupo, fees[1..n-2] = intermedios, fees[n-1] = Todos ("" = sin Todos)
  const [fees, setFees] = useState<string[]>(() => {
    if (!base?.length) return DEFAULT_ROWS;
    const numeric = base.filter((t) => t.count !== TIER_ALL).map((t) => String(t.fee));
    const all = base.find((t) => t.count === TIER_ALL);
    return [...numeric, all ? String(all.fee) : ""];
  });
  const [saving, setSaving] = useState(false);

  const allFee = fees[fees.length - 1];
  const tiers: TuitionTier[] = [
    ...fees.slice(0, -1).map((f, i) => ({ count: i + 1, fee: Number(f) })),
    ...(allFee !== "" ? [{ count: TIER_ALL, fee: Number(allFee) }] : []),
  ];
  const valid = (hideName || name.trim().length > 0) && fees.slice(0, -1).every((f) => f !== "");
  const changed = !!initial && !!base && tiersChanged(base, tiers);
  const students = initial?.students_count ?? 0;
  // Volver a los precios de hoy con un cambio programado lo cancela (TuitionTable.schedule_tiers)
  const pendingFrom = initial?.pending_tiers ? initial.pending_from : null;
  const revertsPending = !!pendingFrom && !tiersChanged(initial!.tiers, tiers);
  const dirty = !initial || changed || (!hideName && name.trim() !== initial.name);
  // Aviso suave (no bloquea): un escalón más caro que el siguiente
  const priceDrop = (() => {
    const labels = fees.map((_, i) => (i === fees.length - 1 ? "Todos" : `${i + 1} ${i === 0 ? "grupo" : "grupos"}`));
    for (let i = 1; i < fees.length; i++) {
      if (fees[i] === "" || fees[i - 1] === "") continue;
      if (Number(fees[i]) < Number(fees[i - 1])) return `${labels[i]} cuesta menos que ${labels[i - 1]}`;
    }
    return null;
  })();

  const setFee = (i: number, v: string) =>
    setFees((cur) => cur.map((f, j) => (j === i ? v.replace(/\D/g, "") : f)));

  const save = async () => {
    if (!valid) {
      toast.error("Captura el nombre y el precio de cada escalón (Todos es opcional)");
      return;
    }
    try {
      setSaving(true);
      const saved = initial
        ? await tuitionTablesApi.update(initial.id, hideName ? { tiers } : { name: name.trim(), tiers })
        : await tuitionTablesApi.create({ name: name.trim(), tiers });
      toast.success(
        changed && saved.pending_from ? `Guardado. Precio nuevo desde el ${formatFrom(saved.pending_from)}` : "Paquete guardado"
      );
      await onSaved(saved);
    } catch (err: unknown) {
      const data = (err as { response?: { data?: Record<string, unknown> } })?.response?.data;
      const msg = data ? Object.values(data).flat().map(String)[0] : null;
      toast.error(msg ?? "No se pudo guardar el paquete");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5">
      {!hideName && <div className="space-y-1.5">
        <Label htmlFor="package-name">Nombre</Label>
        <Input
          id="package-name"
          placeholder="Ej: Paquete Danza"
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={saving}
        />
      </div>}

      <div className="space-y-2">
        <Label>Precio por número de grupos</Label>
        <p className="text-xs text-muted-foreground">
          Un solo cobro al mes según cuántos grupos del paquete toma.
        </p>
        {initial?.pending_tiers && initial.pending_from && (
          <p className="text-xs text-muted-foreground">
            Hoy se cobra: {tiersLabel(initial.tiers)}. Abajo, los precios desde el {formatFrom(initial.pending_from)}.
          </p>
        )}
        <ul className="space-y-2">
          {fees.map((fee, i) => {
            const isAll = i === fees.length - 1;
            const label = isAll ? "Todos" : `${i + 1} ${i === 0 ? "grupo" : "grupos"}`;
            return (
              <li key={i} className="flex items-center gap-3">
                <Label htmlFor={`tier-${i}`} className="w-20 shrink-0 flex-col items-start gap-0 font-normal leading-tight">
                  <span>{label}</span>
                  {isAll && <span className="text-xs text-muted-foreground">si toma todos</span>}
                </Label>
                <div className="relative flex-1">
                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">$</span>
                  <Input
                    id={`tier-${i}`}
                    inputMode="numeric"
                    className="pl-7"
                    placeholder={isAll ? "Opcional" : "Ej: 450"}
                    value={fee}
                    onChange={(e) => setFee(i, e.target.value)}
                    onFocus={(e) => e.target.select()}
                    disabled={saving}
                  />
                </div>
                {i > 0 && !isAll ? (
                  <Button
                    type="button" variant="ghost" size="icon" className="h-11 w-11 shrink-0"
                    aria-label={`Quitar precio de ${label}`}
                    onClick={() => setFees((cur) => cur.filter((_, j) => j !== i))}
                    disabled={saving}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                ) : (
                  <span className="w-11 shrink-0" />
                )}
              </li>
            );
          })}
        </ul>
        <Button
          type="button" variant="outline" className="h-11"
          onClick={() => setFees((cur) => [...cur.slice(0, -1), "", cur[cur.length - 1]])}
          disabled={saving || fees.length >= 10}
        >
          <Plus className="h-4 w-4 mr-1" />
          Precio para {fees.length} grupos
        </Button>
      </div>

      {priceDrop && (
        <p className="text-xs text-amber-700 dark:text-amber-300">Revisa: {priceDrop}.</p>
      )}

      {revertsPending ? (
        <p className="flex items-start gap-2 rounded-md border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-blue-800 dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-200">
          <Info className="mt-0.5 h-4 w-4 shrink-0" />
          <span>
            Se cancela el cambio del <strong>{formatFrom(pendingFrom!)}</strong>; se sigue cobrando el precio de hoy.
          </span>
        </p>
      ) : changed && students > 0 && (
        <p className="flex items-start gap-2 rounded-md border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-blue-800 dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-200">
          <Info className="mt-0.5 h-4 w-4 shrink-0" />
          <span>
            Precio nuevo desde el <strong>{nextMonthStartLabel()}</strong>. Afecta a {students}{" "}
            {students === 1 ? "alumno" : "alumnos"}; los cobros de este mes no cambian.
          </span>
        </p>
      )}

      {children}

      <div className="flex gap-3">
        {onCancel && (
          <Button type="button" variant="outline" className="flex-1" onClick={onCancel} disabled={saving}>
            Cancelar
          </Button>
        )}
        <Button type="button" className="flex-1" onClick={save} disabled={saving || !dirty}>
          {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          {!initial ? "Crear paquete" : dirty ? "Guardar cambios" : "Sin cambios"}
        </Button>
      </div>
    </div>
  );
}
