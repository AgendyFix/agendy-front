"use client";

// ============================================
// SCHEDULE PAGE - Calendario global de clases
// ============================================

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Users } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { classGroupsApi } from "@/lib/api/classGroups";
import { employeesApi } from "@/lib/api/employees";
import { WeeklyCalendar, GROUP_COLORS } from "@/components/schedule/WeeklyCalendar";
import type { ClassGroup, Employee } from "@/lib/types/models";

export default function SchedulePage() {
  const router = useRouter();

  const [allGroups, setAllGroups]   = useState<ClassGroup[]>([]);
  const [filteredGroups, setFilteredGroups] = useState<ClassGroup[]>([]);
  const [employees, setEmployees]   = useState<Employee[]>([]);
  const [loading, setLoading]       = useState(true);
  const [loadingFilter, setLoadingFilter] = useState(false);
  const [filterInstructor, setFilterInstructor] = useState("all");
  const [activeGroupIds, setActiveGroupIds]     = useState<Set<string>>(new Set());

  // Carga inicial: todos los grupos + todos los employees
  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const [groupsRes, empRes] = await Promise.all([
          classGroupsApi.getAll({ limit: 100 }),
          employeesApi.getAll({ limit: 100 }),
        ]);
        setAllGroups(groupsRes.results);
        setFilteredGroups(groupsRes.results);
        setEmployees(empRes.results);
      } catch {
        // no bloqueante
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  // Cuando cambia el filtro de instructor, consulta el backend directamente
  const handleFilterChange = async (instructorId: string) => {
    setFilterInstructor(instructorId);
    setActiveGroupIds(new Set());
    try {
      setLoadingFilter(true);
      const params = instructorId === "all" ? { limit: 100 } : { limit: 100, instructor: instructorId };
      const res = await classGroupsApi.getAll(params);
      setFilteredGroups(res.results);
    } catch {
      // no bloqueante
    } finally {
      setLoadingFilter(false);
    }
  };

  // Grupos visibles: si hay activos en leyenda, solo esos; si no, todos los filtrados
  const visibleGroups = activeGroupIds.size > 0
    ? filteredGroups.filter((g) => activeGroupIds.has(g.id))
    : filteredGroups;

  // Mapa de color consistente (basado en índice global, no filtrado)
  const colorMap: Record<string, number> = {};
  allGroups.forEach((g, i) => { colorMap[g.id] = i % GROUP_COLORS.length; });

  // Para el resumen de cards abajo: solo instructores que tienen grupos
  const instructorsWithGroups = employees.filter((e) =>
    allGroups.some((g) => g.instructor_id === e.id)
  );
  const selectableInstructors = employees;

  const toggleGroup = (id: string) => {
    setActiveGroupIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    // header h-16 (64px) + padding top p-6 (24px) + padding bottom p-6 (24px) = 112px
    <div className="flex flex-col overflow-hidden" style={{ height: "calc(100dvh - 112px)" }}>

      {/* Header compacto */}
      <div className="flex items-center justify-between gap-4 flex-wrap pb-3 shrink-0">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Horarios</h1>
          <p className="text-xs text-muted-foreground">Vista general de clases de la semana</p>
        </div>
        <Select value={filterInstructor} onValueChange={handleFilterChange}>
          <SelectTrigger className="w-52 h-8 text-sm">
            <SelectValue placeholder="Todos los instructores" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los instructores</SelectItem>
            {selectableInstructors.map((e) => (
              <SelectItem key={e.id} value={e.id}>{e.full_name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Calendario — flex-1 ocupa todo el espacio restante */}
      {loading ? (
        <div className="flex-1 flex justify-center items-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="flex flex-col flex-1 min-h-0 gap-2">
          {/* El calendario se estira para llenar el espacio */}
          <div className="flex-1 min-h-0 relative">
            {loadingFilter && (
              <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/60 rounded-lg">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            )}
            <WeeklyCalendar
              groups={visibleGroups}
              allGroups={allGroups}
              colorMap={colorMap}
              showInstructor
              showCurrentTime
              fillHeight
              onNavigate={(gid) => router.push(`/class-groups/${gid}`)}
            />
          </div>

          {/* Leyenda interactiva */}
          {filteredGroups.length > 0 && (
            <div className="flex flex-wrap gap-2 shrink-0 pb-1">
              {filteredGroups.map((g) => {
                const isActive = activeGroupIds.has(g.id);
                const color    = GROUP_COLORS[colorMap[g.id]];
                return (
                  <button
                    key={g.id}
                    onClick={() => toggleGroup(g.id)}
                    className={`flex items-center gap-1.5 px-2 py-1 rounded-full border text-xs transition-all
                      ${isActive
                        ? `${color.bg} ${color.border} ${color.text} font-medium`
                        : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/50"
                      }`}
                  >
                    <div className={`h-2 w-2 rounded-full shrink-0 ${color.dot}`} />
                    {g.name}
                    {g.instructor_name && (
                      <span className="opacity-60">· {g.instructor_name}</span>
                    )}
                  </button>
                );
              })}
              {activeGroupIds.size > 0 && (
                <button
                  onClick={() => setActiveGroupIds(new Set())}
                  className="px-2 py-1 rounded-full border border-dashed text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  Limpiar filtros
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Resumen instructores — solo si hay espacio (oculto cuando hay filtro activo) */}
      {!loading && instructorsWithGroups.length > 0
        && filterInstructor === "all"
        && activeGroupIds.size === 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 shrink-0 pt-2 border-t">
          {instructorsWithGroups.map((emp) => {
            const instrGroups   = allGroups.filter((g) => g.instructor_id === emp.id);
            const totalStudents = instrGroups.reduce((s, g) => s + g.active_enrollment_count, 0);
            return (
              <Card
                key={emp.id}
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => router.push(`/employees/${emp.id}`)}
              >
                <CardContent className="p-3 flex items-center gap-3">
                  <div className="h-9 w-9 rounded-full bg-muted flex items-center justify-center font-semibold text-sm text-muted-foreground shrink-0">
                    {emp.full_name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{emp.full_name}</p>
                    {emp.specialty && (
                      <p className="text-xs text-muted-foreground truncate">{emp.specialty}</p>
                    )}
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span>{instrGroups.length} grupo{instrGroups.length !== 1 ? "s" : ""}</span>
                      <span className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {totalStudents}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

    </div>
  );
}
