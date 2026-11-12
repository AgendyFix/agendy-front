"use client";

// ============================================
// PAQUETE - Crear / editar (id = "new" para crear)
// ============================================

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Check, Info, Loader2, Pencil, Trash2, X } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { PackageForm } from "@/components/classGroups/PackageForm";
import { GroupPicker, PackageGroups } from "@/components/classGroups/PackageGroups";
import { classGroupsApi } from "@/lib/api/classGroups";
import { tuitionTablesApi } from "@/lib/api/tuitionTables";
import type { ClassGroup, TuitionTable } from "@/lib/types/models";

export default function PackagePage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const isNew = id === "new";
  const [table, setTable] = useState<TuitionTable | null>(null);
  const [error, setError] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const [version, setVersion] = useState(0);
  const reload = () => setVersion((v) => v + 1);
  useEffect(() => {
    if (isNew) return;
    tuitionTablesApi.getById(id).then(setTable).catch(() => setError(true));
  }, [id, isNew, version]);

  const groups = table?.groups ?? [];

  // ── Nombre: se edita en el título (guarda solo el nombre) ──
  const [renaming, setRenaming] = useState(false);
  const [newName, setNewName] = useState("");
  const [savingName, setSavingName] = useState(false);
  const rename = async () => {
    const n = newName.trim();
    if (!table || !n) return;
    if (n === table.name) { setRenaming(false); return; }
    try {
      setSavingName(true);
      setTable(await tuitionTablesApi.update(table.id, { name: n }));
      setRenaming(false);
      toast.success("Nombre guardado");
    } catch {
      toast.error("No se pudo cambiar el nombre");
    } finally {
      setSavingName(false);
    }
  };

  // ── Nuevo: los grupos se eligen en la misma pantalla; nada se crea hasta "Crear paquete" ──
  const [allGroups, setAllGroups] = useState<ClassGroup[] | null>(null);
  const [picked, setPicked] = useState<string[]>([]);
  useEffect(() => {
    if (!isNew) return;
    classGroupsApi.getAll({ is_individual: false, limit: 200, ordering: "name" })
      .then((r) => setAllGroups(r.results))
      .catch(() => setAllGroups([]));
  }, [isNew]);
  const onCreated = async (saved: TuitionTable) => {
    let failed = false;
    for (const gid of picked) {
      try {
        await classGroupsApi.update(gid, { tuition_table: saved.id });
      } catch {
        failed = true;
      }
    }
    if (failed) toast.error("Paquete creado, pero no se pudieron agregar todos los grupos; revisa la lista");
    router.replace(`/class-groups/packages/${saved.id}`);
  };

  const remove = async () => {
    if (!table) return;
    try {
      await tuitionTablesApi.delete(table.id);
      toast.success("Paquete eliminado");
      router.push("/class-groups/packages");
    } catch {
      toast.error("No se pudo eliminar el paquete");
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" aria-label="Volver a paquetes" onClick={() => router.push("/class-groups/packages")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        {renaming && table ? (
          <>
            <Input
              value={newName} onChange={(e) => setNewName(e.target.value)} autoFocus disabled={savingName}
              aria-label="Nombre del paquete" className="h-11 flex-1 min-w-0 text-lg font-semibold"
              onKeyDown={(e) => { if (e.key === "Enter") rename(); if (e.key === "Escape") setRenaming(false); }}
            />
            <Button size="icon" className="h-11 w-11 shrink-0" aria-label="Guardar nombre" onClick={rename} disabled={savingName || !newName.trim()}>
              {savingName ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
            </Button>
            <Button variant="ghost" size="icon" className="h-11 w-11 shrink-0" aria-label="Cancelar" onClick={() => setRenaming(false)} disabled={savingName}>
              <X className="h-4 w-4" />
            </Button>
          </>
        ) : (
          <>
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-bold tracking-tight break-words">{isNew ? "Nuevo paquete" : table?.name ?? "Paquete"}</h1>
              {table && (
                <p className="text-sm text-muted-foreground">
                  {groups.length} {groups.length === 1 ? "grupo" : "grupos"} · {table.students_count ?? 0}{" "}
                  {table.students_count === 1 ? "alumno" : "alumnos"}
                </p>
              )}
            </div>
            {table && (
              <Button
                variant="ghost" size="icon" className="h-11 w-11 shrink-0" aria-label="Cambiar nombre" title="Cambiar nombre"
                onClick={() => { setNewName(table.name); setRenaming(true); }}
              >
                <Pencil className="h-4 w-4" />
              </Button>
            )}
          </>
        )}
      </div>

      {error ? (
        <p className="text-sm text-muted-foreground">No se encontró el paquete.</p>
      ) : !isNew && !table ? (
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Cargando…
        </p>
      ) : (
        <>
          <div className="rounded-lg border bg-card p-4">
            <PackageForm
              key={table?.id ?? "new"}
              initial={table ?? undefined}
              hideName={!isNew}
              onSaved={isNew ? onCreated : setTable}
            >
              {isNew && (
                <div className="space-y-2">
                  <Label>Grupos del paquete</Label>
                  <p className="text-xs text-muted-foreground">Marca los grupos que entran. Puedes agregar más después.</p>
                  {allGroups === null ? (
                    <p className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" /> Cargando grupos…
                    </p>
                  ) : allGroups.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Aún no tienes grupos; podrás agregarlos al paquete al crearlos.</p>
                  ) : (
                    <GroupPicker
                      groups={allGroups} picked={picked}
                      onToggle={(gid) => setPicked((c) => (c.includes(gid) ? c.filter((x) => x !== gid) : [...c, gid]))}
                    />
                  )}
                  {picked.length > 0 && (
                    <p className="flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
                      <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                      <span>Los alumnos de estos grupos pasan a pagar por paquete desde su siguiente cobro; el de este mes no sube.</span>
                    </p>
                  )}
                </div>
              )}
            </PackageForm>
          </div>

          {table && (
            <section className="space-y-2">
              <PackageGroups table={table} onChanged={reload} />

              <div className="pt-4">
                <Button
                  variant="ghost"
                  className="text-red-600 hover:text-red-700 hover:bg-red-50 px-2"
                  disabled={groups.length > 0}
                  onClick={() => setConfirmDelete(true)}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Eliminar paquete
                </Button>
                {groups.length > 0 && (
                  <p className="text-xs text-muted-foreground px-2">
                    Para eliminarlo, primero quita {groups.length === 1 ? "su grupo" : `sus ${groups.length} grupos`} del paquete.
                  </p>
                )}
              </div>
            </section>
          )}
        </>
      )}

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar el paquete {table?.name}?</AlertDialogTitle>
            <AlertDialogDescription>No tiene grupos, así que no cambia ningún cobro.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={remove}>Eliminar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
