"use client";

// ============================================
// PAQUETE - Crear / editar (id = "new" para crear)
// ============================================

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { PackageForm } from "@/components/classGroups/PackageForm";
import { PackageGroups } from "@/components/classGroups/PackageGroups";
import { tuitionTablesApi } from "@/lib/api/tuitionTables";
import { formatFrom, tiersLabel } from "@/lib/tuition";
import type { TuitionTable } from "@/lib/types/models";

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
        <h1 className="text-2xl font-bold tracking-tight">{isNew ? "Nuevo paquete" : "Paquete"}</h1>
      </div>

      {error ? (
        <p className="text-sm text-muted-foreground">No se encontró el paquete.</p>
      ) : !isNew && !table ? (
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Cargando…
        </p>
      ) : (
        <>
          {table?.pending_tiers && table.pending_from && (
            <div className="rounded-md border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-blue-800 dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-200">
              <p>Hoy: {tiersLabel(table.tiers)}</p>
              <p className="font-medium">Desde el {formatFrom(table.pending_from)}: {tiersLabel(table.pending_tiers)}</p>
            </div>
          )}

          <div className="rounded-lg border bg-card p-4">
            <PackageForm
              key={table?.id ?? "new"}
              initial={table ?? undefined}
              onSaved={(saved) => (isNew ? router.replace(`/class-groups/packages/${saved.id}`) : setTable(saved))}
            />
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
                    Para eliminarlo, primero quita sus {groups.length} {groups.length === 1 ? "grupo" : "grupos"} del paquete.
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
