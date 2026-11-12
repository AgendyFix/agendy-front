"use client";

// ============================================
// Grupos de un paquete: agregar varios de una vez y quitar uno
// ============================================
// Ligar/desligar usa PATCH /class-groups/{id}/ (el backend re-sincroniza los
// cobros abiertos: el del mes en curso no sube). Al quitar un grupo vuelve a
// su precio propio, que se pide aquí mismo.

import { useEffect, useState } from "react";
import Link from "next/link";
import { Check, ChevronRight, Info, Loader2, Plus, X } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { classGroupsApi } from "@/lib/api/classGroups";
import { cn } from "@/lib/utils";
import type { ClassGroup, TuitionTable } from "@/lib/types/models";

interface Props {
  table: TuitionTable;
  /** Se llama tras ligar/desligar para recargar el paquete */
  onChanged: () => void;
}

export function PackageGroups({ table, onChanged }: Props) {
  const groups = table.groups ?? [];
  const [addOpen, setAddOpen] = useState(false);
  const [all, setAll] = useState<ClassGroup[] | null>(null);
  const [picked, setPicked] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [removing, setRemoving] = useState<ClassGroup | null>(null);
  const [fee, setFee] = useState("");

  // Grupos colectivos de la academia (para agregar y para el precio al quitar)
  useEffect(() => {
    classGroupsApi.getAll({ is_individual: false, limit: 200, ordering: "name" })
      .then((r) => setAll(r.results))
      .catch(() => setAll([]));
  }, [table.id, groups.length]);

  const candidates = (all ?? []).filter((g) => g.tuition_table !== table.id);
  const toggle = (id: string) =>
    setPicked((cur) => (cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]));

  const add = async () => {
    try {
      setSaving(true);
      for (const id of picked) {
        await classGroupsApi.update(id, { tuition_table: table.id });
      }
      toast.success(picked.length === 1 ? "Grupo agregado al paquete" : `${picked.length} grupos agregados al paquete`);
      setPicked([]);
      setAddOpen(false);
    } catch {
      toast.error("No se pudieron agregar todos los grupos; revisa la lista");
    } finally {
      setSaving(false);
      onChanged();
    }
  };

  const openRemove = (id: string) => {
    const g = (all ?? []).find((x) => x.id === id);
    if (!g) return;
    setRemoving(g);
    setFee(g.monthly_fee != null ? String(g.monthly_fee) : "");
  };

  const remove = async () => {
    if (!removing || fee === "") return;
    try {
      setSaving(true);
      await classGroupsApi.update(removing.id, { tuition_table: null, monthly_fee: Number(fee) });
      toast.success(`${removing.name} vuelve a cobrar su precio propio`);
      setRemoving(null);
    } catch {
      toast.error("No se pudo quitar el grupo del paquete");
    } finally {
      setSaving(false);
      onChanged();
    }
  };

  return (
    <section className="space-y-2">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-sm font-semibold">Grupos en este paquete ({groups.length})</h2>
        <Button size="sm" variant="outline" onClick={() => setAddOpen(true)}>
          <Plus className="h-4 w-4 mr-1" />
          Agregar grupos
        </Button>
      </div>

      {groups.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Ninguno todavía. Usa &ldquo;Agregar grupos&rdquo; para elegir los grupos que entran al paquete.
        </p>
      ) : (
        <ul className="divide-y rounded-lg border">
          {groups.map((g) => (
            <li key={g.id} className="flex items-center gap-1 pr-1">
              <Link href={`/class-groups/${g.id}`} className="flex flex-1 min-w-0 items-center gap-2 px-4 py-3 text-sm hover:bg-muted/30">
                <span className="flex-1 break-words">{g.name}</span>
                <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
              </Link>
              <Button
                variant="ghost" size="icon" className="h-9 w-9 shrink-0"
                aria-label={`Quitar ${g.name} del paquete`}
                disabled={all === null}
                onClick={() => openRemove(g.id)}
              >
                <X className="h-4 w-4" />
              </Button>
            </li>
          ))}
        </ul>
      )}

      {/* ── Agregar grupos ── */}
      <Dialog open={addOpen} onOpenChange={(o) => { setAddOpen(o); if (!o) setPicked([]); }}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Agregar grupos a {table.name}</DialogTitle>
          </DialogHeader>
          {all === null ? (
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Cargando grupos…
            </p>
          ) : candidates.length === 0 ? (
            <p className="text-sm text-muted-foreground">Todos los grupos ya están en este paquete.</p>
          ) : (
            <ul className="space-y-2" role="group" aria-label="Grupos">
              {candidates.map((g) => {
                const checked = picked.includes(g.id);
                const side = g.tuition_table_name
                  ? `En ${g.tuition_table_name}`
                  : g.monthly_fee != null ? `$${g.monthly_fee.toLocaleString("es-MX")}/mes` : "";
                return (
                  <li key={g.id}>
                    <button
                      type="button" role="checkbox" aria-checked={checked}
                      onClick={() => toggle(g.id)} disabled={saving}
                      className={cn(
                        "flex w-full items-center gap-3 rounded-lg border p-3 text-left",
                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                        checked ? "border-primary bg-primary/5" : "bg-background",
                      )}
                    >
                      <span className={cn(
                        "flex h-5 w-5 shrink-0 items-center justify-center rounded border",
                        checked ? "border-primary bg-primary text-primary-foreground" : "border-input",
                      )}>
                        {checked && <Check className="h-3.5 w-3.5" />}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block break-words text-sm font-medium">{g.name}</span>
                        {g.schedule_display && (
                          <span className="block break-words text-xs text-muted-foreground">{g.schedule_display}</span>
                        )}
                      </span>
                      {side && <span className="max-w-[35%] shrink-0 text-right text-xs text-muted-foreground">{side}</span>}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
          {picked.length > 0 && (
            <p className="flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
              <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              <span>
                Las alumnas de estos grupos pasan a pagar por paquete. El cobro ya generado de este mes no sube; el
                precio del paquete aplica desde el siguiente cobro.
              </span>
            </p>
          )}
          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={() => setAddOpen(false)} disabled={saving}>Cancelar</Button>
            <Button className="flex-1" onClick={add} disabled={saving || picked.length === 0}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Agregar{picked.length > 0 ? ` ${picked.length}` : ""}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Quitar un grupo ── */}
      <Dialog open={!!removing} onOpenChange={(o) => !o && setRemoving(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>¿Quitar {removing?.name} del paquete?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            El grupo vuelve a cobrar su propia mensualidad. Las alumnas que lo tomen pagarán aparte, desde el
            siguiente cobro.
          </p>
          <div className="space-y-1.5">
            <Label htmlFor="remove-fee">Mensualidad del grupo</Label>
            <div className="relative">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">$</span>
              <Input
                id="remove-fee" inputMode="numeric" className="pl-7" placeholder="Ej: 450"
                value={fee} onChange={(e) => setFee(e.target.value.replace(/\D/g, ""))} disabled={saving}
              />
            </div>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={() => setRemoving(null)} disabled={saving}>Cancelar</Button>
            <Button className="flex-1" onClick={remove} disabled={saving || fee === ""}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Quitar del paquete
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </section>
  );
}
