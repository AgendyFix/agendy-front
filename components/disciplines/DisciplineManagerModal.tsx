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

import { useEffect, useState, useRef } from "react";
import { Plus, Pencil, Trash2, Check, X as XIcon, Loader2, BookOpen } from "lucide-react";
import { toast } from "sonner";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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
import { useDisciplines } from "@/lib/hooks/useDisciplines";
import type { Discipline } from "@/lib/types/models";

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

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      setDeleting(true);
      await deleteDiscipline(deleteTarget.id);
      toast.success(`"${deleteTarget.name}" eliminada`);
      setDeleteTarget(null);
    } catch {
      toast.error("No se pudo eliminar la disciplina");
    } finally {
      setDeleting(false);
    }
  };

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
                              onClick={() => setDeleteTarget(d)}
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
      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar disciplina?</AlertDialogTitle>
            <AlertDialogDescription>
              Se eliminará <strong>&quot;{deleteTarget?.name}&quot;</strong> del catálogo.
              Los grupos e instructores que la tenían asignada mantendrán el registro histórico.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
