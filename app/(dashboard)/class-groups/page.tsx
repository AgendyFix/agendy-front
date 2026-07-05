"use client";

// ============================================
// CLASS GROUPS PAGE - Lista de grupos/clases
// ============================================

import { useEffect, useRef, useState } from "react";
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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  { value: "all_levels",    label: "Todos los niveles" },
  { value: "all",           label: "Sin nivel" },
  { value: "beginner",      label: "Principiante" },
  { value: "intermediate",  label: "Intermedio" },
  { value: "advanced",      label: "Avanzado" },
];

// Segmentador Grupales / Individuales — casi todos los grupos son
// "Clase individual", así que sin esto es imposible encontrar los grupales.
type GroupSegment = "all" | "grupal" | "individual";

export default function ClassGroupsPage() {
  const router = useRouter();
  const {
    classGroups, isLoading, isLoadingMore, totalCount, hasNext,
    fetchClassGroups, loadMore, deleteClassGroup,
  } = useClassGroups();

  const [search, setSearch] = useState("");
  const [levelFilter, setLevelFilter] = useState("all_levels");
  const [groupSegment, setGroupSegment] = useState<GroupSegment>("all");
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [disciplinesOpen, setDisciplinesOpen] = useState(false);

  // Sentinel para IntersectionObserver (scroll infinito)
  const sentinelRef = useRef<HTMLDivElement>(null);

  // ── Carga inicial ──────────────────────────────────────────────────────
  useEffect(() => {
    fetchClassGroups({});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Búsqueda / filtro con debounce ────────────────────────────────────
  const isFirstRender = useRef(true);
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    const timeout = setTimeout(() => {
      fetchClassGroups({
        search: search || undefined,
        level: levelFilter !== "all_levels" ? (levelFilter as ClassGroupLevel) : undefined,
      });
    }, 400);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, levelFilter]);

  // ── IntersectionObserver — carga la siguiente página al llegar al final ─
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNext && !isLoadingMore) {
          loadMore();
        }
      },
      { rootMargin: "200px" } // empieza a cargar 200px antes del final
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasNext, isLoadingMore, loadMore]);

  // ── Handlers ───────────────────────────────────────────────────────────
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

  // Segmentador Grupales/Individuales: NOTA — es client-side, solo sobre los
  // grupos ya cargados en esta página (el backend no filtra por
  // is_individual y el scroll infinito sigue paginando sin este filtro). Si
  // el grupo buscado está en una página aún no cargada, hay que scrollear.
  const grupalCount     = classGroups.filter((g) => !g.is_individual).length;
  const individualCount = classGroups.filter((g) => g.is_individual).length;
  const visibleGroups = classGroups.filter((g) => {
    if (groupSegment === "grupal")     return !g.is_individual;
    if (groupSegment === "individual") return g.is_individual;
    return true;
  });
  const hasActiveFilters = !!search || levelFilter !== "all_levels" || groupSegment !== "all";

  // ── Render ─────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Grupos / Clases</h1>
          <p className="text-muted-foreground">
            {totalCount > 0
              ? `${classGroups.length} de ${totalCount} grupo${totalCount !== 1 ? "s" : ""}`
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

      {/* Segmentador Todos / Grupales / Individuales */}
      <Tabs value={groupSegment} onValueChange={(v) => setGroupSegment(v as GroupSegment)}>
        <TabsList>
          <TabsTrigger value="all">
            Todos
            {classGroups.length > 0 && (
              <span className="ml-1.5 text-xs text-muted-foreground">({classGroups.length})</span>
            )}
          </TabsTrigger>
          <TabsTrigger value="grupal">
            Grupales
            {grupalCount > 0 && (
              <span className="ml-1.5 text-xs text-muted-foreground">({grupalCount})</span>
            )}
          </TabsTrigger>
          <TabsTrigger value="individual">
            Individuales
            {individualCount > 0 && (
              <span className="ml-1.5 text-xs text-muted-foreground">({individualCount})</span>
            )}
          </TabsTrigger>
        </TabsList>
      </Tabs>

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
      ) : visibleGroups.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center gap-3">
          <GraduationCap className="h-12 w-12 text-muted-foreground/40" />
          <p className="text-muted-foreground font-medium">
            {hasActiveFilters
              ? "No se encontraron grupos con esos filtros"
              : "Aún no tienes grupos"}
          </p>
          {/* El segmentador filtra solo lo ya cargado: si hay más páginas,
              puede que haya coincidencias más adelante en el scroll. */}
          {hasActiveFilters && classGroups.length > 0 && hasNext && (
            <p className="text-xs text-muted-foreground/70">
              Sigue habiendo grupos por cargar — desplázate para ver más resultados.
            </p>
          )}
          {!hasActiveFilters && (
            <Button variant="outline" onClick={() => router.push("/class-groups/new")}>
              <Plus className="h-4 w-4 mr-2" />
              Crear primer grupo
            </Button>
          )}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {visibleGroups.map((group) => (
              <ClassGroupCard
                key={group.id}
                group={group}
                onDelete={(id, name) => setDeleteTarget({ id, name })}
              />
            ))}
          </div>

          {/* Sentinel — dispara loadMore al entrar en viewport */}
          <div ref={sentinelRef} className="py-2 flex justify-center">
            {isLoadingMore && (
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            )}
          </div>

          {/* Indicador de total cuando ya se cargó todo */}
          {!hasNext && !isLoadingMore && totalCount > 0 && (
            <p className="text-center text-xs text-muted-foreground pb-2">
              {totalCount} grupo{totalCount !== 1 ? "s" : ""} en total
            </p>
          )}
        </>
      )}

      {/* Modal catálogo de disciplinas */}
      <DisciplineManagerModal
        open={disciplinesOpen}
        onOpenChange={setDisciplinesOpen}
      />

      {/* Confirm delete */}
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
