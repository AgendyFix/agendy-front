"use client";

// ============================================
// DISCIPLINE MANAGER MODAL
// ============================================
// CRUD completo del catálogo de disciplinas.
// Accesible desde:
//   1. Botón "Administrar disciplinas" en DisciplineMultiSelect
//   2. Botón en la página /class-groups
//
// No navega a otra ruta — es un Dialog, así el usuario
// no pierde el estado del formulario que lo invocó.

import { useEffect, useState, useRef, type MouseEvent } from "react";
import Link from "next/link";
import { Plus, Pencil, Trash2, Check, X as XIcon, Loader2, BookOpen, Merge, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useDisciplines } from "@/lib/hooks/useDisciplines";
import { disciplinesApi } from "@/lib/api/disciplines";
import type { Discipline } from "@/lib/types/models";

// ── Uso de una disciplina (viene en el 409 de delete, o de getUsage) ───────

interface DisciplineUsageDetail {
  detail?: string;
  counts: {
    employees: number;
    class_groups: number;
    enrollments: number;
    total: number;
  };
  employees: { id: string; name: string }[];
  class_groups: { id: string; name: string }[];
  enrollments: { id: string; client_id: string; client_name: string }[];
}

function usageSummary(counts: DisciplineUsageDetail["counts"]): string {
  const parts: string[] = [];
  if (counts.employees > 0) {
    parts.push(`${counts.employees} instructor${counts.employees !== 1 ? "es" : ""}`);
  }
  if (counts.class_groups > 0) {
    parts.push(`${counts.class_groups} grupo${counts.class_groups !== 1 ? "s" : ""}`);
  }
  if (counts.enrollments > 0) {
    parts.push(`${counts.enrollments} alumno${counts.enrollments !== 1 ? "s" : ""}`);
  }
  return parts.join(", ");
}

// Estilo de link consistente con la app: color primario + subrayado sutil al hover.
const USAGE_LINK_CLASS =
  "text-blue-600 hover:text-blue-700 hover:underline underline-offset-2 transition-colors";

// ── Misma paleta que DisciplineMultiSelect ────────────────────────────────

const TAG_DOT_COLORS = [
  "bg-blue-400",
  "bg-violet-400",
  "bg-emerald-400",
  "bg-amber-400",
  "bg-rose-400",
  "bg-cyan-400",
  "bg-orange-400",
  "bg-pink-400",
] as const;

// ── Props ──────────────────────────────────────────────────────────────────

interface DisciplineManagerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// ── Component ──────────────────────────────────────────────────────────────

export function DisciplineManagerModal({ open, onOpenChange }: DisciplineManagerModalProps) {
  const {
    disciplines,
    isLoading,
    fetchDisciplines,
    createDiscipline,
    updateDiscipline,
    deleteDiscipline,
  } = useDisciplines();

  // ── Crear ───────────────────────────────────────────────────────────────
  const [newName, setNewName]     = useState("");
  const [creating, setCreating]   = useState(false);
  const newInputRef               = useRef<HTMLInputElement>(null);

  // ── Editar inline ───────────────────────────────────────────────────────
  const [editingId, setEditingId]   = useState<string | null>(null);
  const [editName, setEditName]     = useState("");
  const [saving, setSaving]         = useState(false);

  // ── Eliminar ────────────────────────────────────────────────────────────
  const [deleteTarget, setDeleteTarget] = useState<Discipline | null>(null);
  const [deleting, setDeleting]         = useState(false);
  const [deleteUsage, setDeleteUsage]   = useState<DisciplineUsageDetail | null>(null);

  // ── Fusionar ────────────────────────────────────────────────────────────
  const [mergeSource, setMergeSource]     = useState<Discipline | null>(null);
  const [mergeTargetId, setMergeTargetId] = useState<string>("");
  const [merging, setMerging]             = useState(false);
  const [mergeUsage, setMergeUsage]           = useState<DisciplineUsageDetail["counts"] | null>(null);
  const [mergeUsageLoading, setMergeUsageLoading] = useState(false);

  // Cargar al abrir
  useEffect(() => {
    if (open) {
      fetchDisciplines(true); // force refresh
    }
  }, [open, fetchDisciplines]);

  // ── Handlers ────────────────────────────────────────────────────────────

  const handleCreate = async () => {
    if (!newName.trim()) return;
    try {
      setCreating(true);
      await createDiscipline(newName.trim());
      setNewName("");
      toast.success(`Disciplina "${newName.trim()}" creada`);
      newInputRef.current?.focus();
    } catch (err: unknown) {
      const anyErr = err as { response?: { data?: Record<string, string[]> } };
      const apiData = anyErr?.response?.data;
      toast.error(apiData?.name?.[0] ?? "Error al crear la disciplina");
    } finally {
      setCreating(false);
    }
  };

  const startEdit = (d: Discipline) => {
    setEditingId(d.id);
    setEditName(d.name);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditName("");
  };

  const handleSaveEdit = async (id: string) => {
    if (!editName.trim()) { cancelEdit(); return; }
    try {
      setSaving(true);
      await updateDiscipline(id, editName.trim());
      toast.success("Nombre actualizado");
      setEditingId(null);
    } catch {
      toast.error("Error al actualizar la disciplina");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (e: MouseEvent) => {
    // AlertDialogAction cierra el diálogo por defecto al hacer click; lo evitamos
    // porque en caso de 409 necesitamos mantenerlo abierto para mostrar el uso.
    e.preventDefault();
    if (!deleteTarget) return;
    try {
      setDeleting(true);
      await deleteDiscipline(deleteTarget.id);
      toast.success(`"${deleteTarget.name}" eliminada`);
      closeDeleteDialog();
    } catch (err: unknown) {
      const axiosErr = err as { response?: { status?: number; data?: DisciplineUsageDetail } };
      if (axiosErr.response?.status === 409 && axiosErr.response.data) {
        setDeleteUsage(axiosErr.response.data);
      } else {
        toast.error("No se pudo eliminar la disciplina");
      }
    } finally {
      setDeleting(false);
    }
  };

  const closeDeleteDialog = () => {
    setDeleteTarget(null);
    setDeleteUsage(null);
  };

  // ── Fusionar ────────────────────────────────────────────────────────────

  const openMerge = (d: Discipline) => {
    closeDeleteDialog();
    setMergeSource(d);
    setMergeTargetId("");
    setMergeUsage(null);
    setMergeUsageLoading(true);
    disciplinesApi
      .getUsage(d.id)
      .then((usage) => setMergeUsage(usage.counts))
      .catch(() => toast.error("No se pudo calcular las asignaciones a mover"))
      .finally(() => setMergeUsageLoading(false));
  };

  const closeMergeDialog = () => {
    setMergeSource(null);
    setMergeTargetId("");
    setMergeUsage(null);
    setMergeUsageLoading(false);
  };

  // Cierra ambos diálogos (modal principal y AlertDialog de borrado) antes de
  // navegar, para que el cambio de ruta se vea.
  const handleUsageLinkClick = () => {
    closeDeleteDialog();
    onOpenChange(false);
  };

  const handleMergeConfirm = async () => {
    if (!mergeSource || !mergeTargetId) return;
    const target = disciplines.find((d) => d.id === mergeTargetId);
    try {
      setMerging(true);
      await disciplinesApi.merge(mergeSource.id, mergeTargetId);
      toast.success(`"${mergeSource.name}" fusionada en "${target?.name ?? ""}"`);
      closeMergeDialog();
      await fetchDisciplines(true);
    } catch {
      toast.error("No se pudo fusionar la disciplina");
    } finally {
      setMerging(false);
    }
  };

  const mergeTargetOptions = disciplines.filter(
    (d) => d.is_active && d.id !== mergeSource?.id
  );

  // ── Render ──────────────────────────────────────────────────────────────

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-muted-foreground" />
              Catálogo de disciplinas
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 mt-1">

            {/* ── Crear nueva disciplina ── */}
            <div className="flex gap-2">
              <Input
                ref={newInputRef}
                placeholder="Nueva disciplina..."
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") { e.preventDefault(); handleCreate(); }
                  if (e.key === "Escape") setNewName("");
                }}
                disabled={creating}
              />
              <Button
                type="button"
                size="sm"
                onClick={handleCreate}
                disabled={creating || !newName.trim()}
                className="shrink-0"
              >
                {creating ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Plus className="h-4 w-4" />
                )}
                <span className="ml-1 hidden sm:inline">Agregar</span>
              </Button>
            </div>

            {/* ── Lista ── */}
            <div className="rounded-lg border overflow-hidden">
              {isLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : disciplines.length === 0 ? (
                <div className="flex flex-col items-center py-8 gap-2 text-center text-muted-foreground">
                  <BookOpen className="h-8 w-8 opacity-30" />
                  <p className="text-sm">Sin disciplinas. Crea la primera arriba.</p>
                </div>
              ) : (
                <ul className="divide-y max-h-72 overflow-y-auto">
                  {disciplines.map((d, i) => (
                    <li
                      key={d.id}
                      className="flex items-center gap-2 px-3 py-2.5 hover:bg-muted/40 transition-colors group"
                    >
                      {editingId === d.id ? (
                        /* ── Edición inline ── */
                        <>
                          <Input
                            className="h-8 text-sm flex-1"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") handleSaveEdit(d.id);
                              if (e.key === "Escape") cancelEdit();
                            }}
                            autoFocus
                            disabled={saving}
                          />
                          <button
                            onClick={() => handleSaveEdit(d.id)}
                            disabled={saving || !editName.trim()}
                            className="p-1.5 rounded text-green-600 hover:text-green-700 hover:bg-green-50 disabled:opacity-40 transition-colors"
                          >
                            {saving ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Check className="h-4 w-4" />
                            )}
                          </button>
                          <button
                            onClick={cancelEdit}
                            disabled={saving}
                            className="p-1.5 rounded text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
                          >
                            <XIcon className="h-4 w-4" />
                          </button>
                        </>
                      ) : (
                        /* ── Vista normal ── */
                        <>
                          <span className={cn("h-2.5 w-2.5 rounded-full shrink-0", TAG_DOT_COLORS[i % TAG_DOT_COLORS.length])} />
                          <span className="flex-1 text-sm font-medium">{d.name}</span>
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => startEdit(d)}
                              className="p-1.5 rounded text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
                              aria-label={`Editar ${d.name}`}
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => openMerge(d)}
                              className="p-1.5 rounded text-muted-foreground hover:text-blue-600 hover:bg-blue-50 transition-colors"
                              aria-label={`Fusionar ${d.name} con otra disciplina`}
                              title="Fusionar con otra disciplina"
                            >
                              <Merge className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => { setDeleteTarget(d); setDeleteUsage(null); }}
                              className="p-1.5 rounded text-muted-foreground hover:text-red-600 hover:bg-red-50 transition-colors"
                              aria-label={`Eliminar ${d.name}`}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <p className="text-xs text-muted-foreground">
              {disciplines.length} disciplina{disciplines.length !== 1 ? "s" : ""} en el catálogo
            </p>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Confirm delete ── */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && closeDeleteDialog()}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar disciplina?</AlertDialogTitle>
            {deleteUsage ? (
              <AlertDialogDescription asChild>
                <div className="space-y-3">
                  <p className="flex items-start gap-2 text-amber-700">
                    <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                    <span>
                      <strong>&quot;{deleteTarget?.name}&quot;</strong> está en uso y no se puede
                      eliminar. Quítala de esos registros primero, o fusiónala con otra disciplina.
                    </span>
                  </p>
                  <div className="rounded-md border bg-muted/40 p-3 space-y-2 text-sm text-foreground">
                    <p className="font-medium">En uso por: {usageSummary(deleteUsage.counts)}</p>
                    {deleteUsage.employees.length > 0 && (
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Instructores</p>
                        <p className="text-xs">
                          {deleteUsage.employees.map((e, i) => (
                            <span key={e.id}>
                              {i > 0 && ", "}
                              <Link
                                href={`/employees/${e.id}`}
                                onClick={handleUsageLinkClick}
                                className={USAGE_LINK_CLASS}
                              >
                                {e.name}
                              </Link>
                            </span>
                          ))}
                        </p>
                      </div>
                    )}
                    {deleteUsage.class_groups.length > 0 && (
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Grupos</p>
                        <p className="text-xs">
                          {deleteUsage.class_groups.map((g, i) => (
                            <span key={g.id}>
                              {i > 0 && ", "}
                              <Link
                                href={`/class-groups/${g.id}`}
                                onClick={handleUsageLinkClick}
                                className={USAGE_LINK_CLASS}
                              >
                                {g.name}
                              </Link>
                            </span>
                          ))}
                        </p>
                      </div>
                    )}
                    {deleteUsage.enrollments.length > 0 && (
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Alumnos inscritos</p>
                        <p className="text-xs">
                          {deleteUsage.enrollments.map((en, i) => (
                            <span key={en.id}>
                              {i > 0 && ", "}
                              <Link
                                href={`/clients/${en.client_id}`}
                                onClick={handleUsageLinkClick}
                                className={USAGE_LINK_CLASS}
                              >
                                {en.client_name}
                              </Link>
                            </span>
                          ))}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </AlertDialogDescription>
            ) : (
              <AlertDialogDescription>
                Se eliminará <strong>&quot;{deleteTarget?.name}&quot;</strong> del catálogo.
                Los grupos e instructores que la tenían asignada mantendrán el registro histórico.
              </AlertDialogDescription>
            )}
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>
              {deleteUsage ? "Cerrar" : "Cancelar"}
            </AlertDialogCancel>
            {deleteUsage ? (
              <Button
                type="button"
                onClick={() => deleteTarget && openMerge(deleteTarget)}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Merge className="h-4 w-4 mr-2" />
                Fusionar con otra
              </Button>
            ) : (
              <AlertDialogAction
                onClick={handleDelete}
                disabled={deleting}
                className="bg-red-600 hover:bg-red-700"
              >
                {deleting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Eliminar
              </AlertDialogAction>
            )}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ── Fusionar disciplinas ── */}
      <Dialog open={!!mergeSource} onOpenChange={(o) => !o && closeMergeDialog()}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Merge className="h-5 w-5 text-muted-foreground" />
              Fusionar disciplina
            </DialogTitle>
            <DialogDescription>
              Elige la disciplina destino para fusionar{" "}
              <strong>&quot;{mergeSource?.name}&quot;</strong>.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <Select value={mergeTargetId} onValueChange={setMergeTargetId} disabled={merging}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar disciplina destino..." />
              </SelectTrigger>
              <SelectContent>
                {mergeTargetOptions.length === 0 ? (
                  <div className="px-3 py-2 text-sm text-muted-foreground">
                    No hay otra disciplina disponible.
                  </div>
                ) : (
                  mergeTargetOptions.map((d) => (
                    <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>

            {mergeUsageLoading ? (
              <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                <Loader2 className="h-3 w-3 animate-spin" />
                Calculando asignaciones...
              </p>
            ) : mergeUsage && mergeUsage.total === 0 ? (
              <p className="text-xs text-muted-foreground">
                Esta disciplina no tiene asignaciones; solo se archivará.
              </p>
            ) : mergeUsage && mergeTargetId ? (
              <p className="text-xs text-muted-foreground">
                Se moverán <strong>{mergeUsage.total}</strong> asignación
                {mergeUsage.total !== 1 ? "es" : ""} ({mergeUsage.employees} instructor
                {mergeUsage.employees !== 1 ? "es" : ""}, {mergeUsage.class_groups} grupo
                {mergeUsage.class_groups !== 1 ? "s" : ""}, {mergeUsage.enrollments} alumno
                {mergeUsage.enrollments !== 1 ? "s" : ""}) a{" "}
                <strong>
                  &quot;{disciplines.find((d) => d.id === mergeTargetId)?.name}&quot;
                </strong>{" "}
                y <strong>&quot;{mergeSource?.name}&quot;</strong> se archivará.
              </p>
            ) : null}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={closeMergeDialog} disabled={merging}>
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={handleMergeConfirm}
              disabled={merging || !mergeTargetId}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {merging && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Fusionar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
