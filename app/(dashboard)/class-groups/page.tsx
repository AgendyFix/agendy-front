"use client";

// ============================================
// CLASS GROUPS PAGE - Lista de grupos/clases
// ============================================

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Search, GraduationCap, Loader2, BookOpen } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { ClassGroupCard } from "@/components/classGroups/ClassGroupCard";
import { DisciplineManagerModal } from "@/components/disciplines/DisciplineManagerModal";
import { useClassGroups } from "@/lib/hooks/useClassGroups";
import type { ClassGroupLevel } from "@/lib/types/models";

const LEVELS = [
  { value: "all_levels", label: "Todos los niveles" },
  { value: "all",        label: "Sin nivel" },
  { value: "beginner",   label: "Principiante" },
  { value: "intermediate", label: "Intermedio" },
  { value: "advanced",   label: "Avanzado" },
];

export default function ClassGroupsPage() {
  const router = useRouter();
  const { classGroups, isLoading, totalCount, fetchClassGroups, deleteClassGroup } =
    useClassGroups();

  const [search, setSearch] = useState("");
  const [levelFilter, setLevelFilter] = useState("all_levels");
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [disciplinesOpen, setDisciplinesOpen] = useState(false);

  // Carga inicial
  useEffect(() => {
    fetchClassGroups({});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Buscar con debounce
  useEffect(() => {
    const timeout = setTimeout(() => {
      fetchClassGroups({
        search: search || undefined,
        level: levelFilter !== "all_levels" ? (levelFilter as ClassGroupLevel) : undefined,
        page: 1,
      });
    }, 400);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, levelFilter]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      setDeleting(true);
      await deleteClassGroup(deleteTarget.id);
      toast.success(`Grupo "${deleteTarget.name}" eliminado`);
    } catch {
      toast.error("No se pudo eliminar el grupo");
    } finally {
      setDeleting(false);
      setDeleteTarget(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Grupos / Clases</h1>
          <p className="text-muted-foreground">
            {totalCount > 0
              ? `${totalCount} grupo${totalCount !== 1 ? "s" : ""} activo${totalCount !== 1 ? "s" : ""}`
              : "Gestiona los grupos y horarios de tu academia"}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setDisciplinesOpen(true)}>
            <BookOpen className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Disciplinas</span>
          </Button>
          <Button onClick={() => router.push("/class-groups/new")}>
            <Plus className="h-4 w-4 mr-2" />
            Nuevo grupo
          </Button>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar grupos..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={levelFilter} onValueChange={setLevelFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Nivel" />
          </SelectTrigger>
          <SelectContent>
            {LEVELS.map((l) => (
              <SelectItem key={l.value} value={l.value}>
                {l.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Contenido */}
      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : classGroups.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center gap-3">
          <GraduationCap className="h-12 w-12 text-muted-foreground/40" />
          <p className="text-muted-foreground font-medium">
            {search || levelFilter !== "all_levels"
              ? "No se encontraron grupos con esos filtros"
              : "Aún no tienes grupos"}
          </p>
          {!search && levelFilter === "all_levels" && (
            <Button variant="outline" onClick={() => router.push("/class-groups/new")}>
              <Plus className="h-4 w-4 mr-2" />
              Crear primer grupo
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {classGroups.map((group) => (
            <ClassGroupCard
              key={group.id}
              group={group}
              onDelete={(id, name) => setDeleteTarget({ id, name })}
            />
          ))}
        </div>
      )}

      {/* Modal catálogo de disciplinas */}
      <DisciplineManagerModal
        open={disciplinesOpen}
        onOpenChange={setDisciplinesOpen}
      />

      {/* Confirm delete dialog */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar grupo?</AlertDialogTitle>
            <AlertDialogDescription>
              Se eliminará <strong>{deleteTarget?.name}</strong>. Esta acción no se puede
              deshacer. Los alumnos inscritos quedarán sin grupo activo.
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
    </div>
  );
}
