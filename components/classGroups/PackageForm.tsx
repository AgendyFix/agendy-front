"use client";

// ============================================
// Formulario de paquete: nombre + escalones (precio por número de grupos)
// ============================================
// Lo usan la página /class-groups/packages/[id] y el diálogo "Crear paquete"
// del formulario de grupo. Escalones consecutivos 1..N; solo se quita el último.

import { useState } from "react";
import { Info, Loader2, Plus, X } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { tuitionTablesApi } from "@/lib/api/tuitionTables";
import { formatFrom, nextMonthStartLabel, tiersChanged } from "@/lib/tuition";
import type { TuitionTable, TuitionTier } from "@/lib/types/models";

const DEFAULT_ROWS = ["", ""];

interface Props {
  /** Paquete a editar; sin él se crea uno nuevo */
  initial?: TuitionTable;
  onSaved: (table: TuitionTable) => void;
  onCancel?: () => void;
}

export function PackageForm({ initial, onSaved, onCancel }: Props) {
  // Se edita lo último que se guardó: si hay un cambio programado, ese
  const base = initial?.pending_tiers ?? initial?.tiers;
  const [name, setName] = useState(initial?.name ?? "");
  const [fees, setFees] = useState<string[]>(base ? base.map((t) => String(t.fee)) : DEFAULT_ROWS);
  const [saving, setSaving] = useState(false);

  const tiers: TuitionTier[] = fees.map((f, i) => ({ count: i + 1, fee: Number(f) }));
  const valid = name.trim().length > 0 && fees.every((f) => f !== "" && Number(f) >= 0);
  const changed = !!initial && !!base && tiersChanged(base, tiers);
  const students = initial?.students_count ?? 0;

  const setFee = (i: number, v: string) =>
    setFees((cur) => cur.map((f, j) => (j === i ? v.replace(/\D/g, "") : f)));

  const save = async () => {
    if (!valid) {
      toast.error("Captura el nombre y el precio de cada escalón");
      return;
    }
    try {
      setSaving(true);
      const saved = initial
        ? await tuitionTablesApi.update(initial.id, { name: name.trim(), tiers })
        : await tuitionTablesApi.create({ name: name.trim(), tiers });
      toast.success(
        saved.pending_from ? `Guardado. Precio nuevo desde el ${formatFrom(saved.pending_from)}` : "Paquete guardado"
      );
      onSaved(saved);
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
      <div className="space-y-1.5">
        <Label htmlFor="package-name">Nombre</Label>
        <Input
          id="package-name"
          placeholder="Ej: Danza regular"
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={saving}
        />
      </div>

      <div className="space-y-2">
        <Label>Precio por número de grupos</Label>
        <p className="text-xs text-muted-foreground">
          El alumno paga un solo cobro al mes según cuántos grupos del paquete toma. Con más grupos que el último escalón, paga el último.
        </p>
        <ul className="space-y-2">
          {fees.map((fee, i) => (
            <li key={i} className="flex items-center gap-3">
              <Label htmlFor={`tier-${i}`} className="w-20 shrink-0 font-normal">
                {i + 1} {i === 0 ? "grupo" : "grupos"}
              </Label>
              <div className="relative flex-1">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">$</span>
                <Input
                  id={`tier-${i}`}
                  inputMode="numeric"
                  className="pl-7"
                  placeholder="0"
                  value={fee}
                  onChange={(e) => setFee(i, e.target.value)}
                  onFocus={(e) => e.target.select()}
                  disabled={saving}
                />
              </div>
              {i === fees.length - 1 && fees.length > 1 ? (
                <Button
                  type="button" variant="ghost" size="icon" className="h-9 w-9 shrink-0"
                  aria-label={`Quitar escalón de ${i + 1} grupos`}
                  onClick={() => setFees((cur) => cur.slice(0, -1))}
                  disabled={saving}
                >
                  <X className="h-4 w-4" />
                </Button>
              ) : (
                <span className="w-9 shrink-0" />
              )}
            </li>
          ))}
        </ul>
        <Button
          type="button" variant="outline" size="sm"
          onClick={() => setFees((cur) => [...cur, ""])}
          disabled={saving || fees.length >= 10}
        >
          <Plus className="h-4 w-4 mr-1" />
          Agregar escalón
        </Button>
      </div>

      {changed && students > 0 && (
        <p className="flex items-start gap-2 rounded-md border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-blue-800 dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-200">
          <Info className="mt-0.5 h-4 w-4 shrink-0" />
          <span>
            Precio nuevo desde el <strong>{nextMonthStartLabel()}</strong>. Afecta a {students}{" "}
            {students === 1 ? "alumno" : "alumnos"}; los cobros de este mes no cambian.
          </span>
        </p>
      )}

      <div className="flex gap-3">
        {onCancel && (
          <Button type="button" variant="outline" className="flex-1" onClick={onCancel} disabled={saving}>
            Cancelar
          </Button>
        )}
        <Button type="button" className="flex-1" onClick={save} disabled={saving}>
          {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          {initial ? "Guardar cambios" : "Crear paquete"}
        </Button>
      </div>
    </div>
  );
}
