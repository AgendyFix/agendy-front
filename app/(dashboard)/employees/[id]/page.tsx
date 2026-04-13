"use client";

// ============================================
// INSTRUCTOR DETAIL PAGE
// ============================================

import { useEffect, useState, useCallback } from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import {
  ArrowLeft, Shield, Loader2, GraduationCap,
  Mail, Phone, Pencil, Users, DollarSign, Calendar, X, UserMinus,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { employeesApi } from "@/lib/api/employees";
import { classGroupsApi } from "@/lib/api/classGroups";
import { useAuth } from "@/lib/hooks/useAuth";
import { WeeklyCalendar, GROUP_COLORS } from "@/components/schedule/WeeklyCalendar";
import type { Employee, ClassGroup } from "@/lib/types/models";

// ── Helpers ───────────────────────────────────────────────────────────────────

const ROLE_STYLES: Record<string, string> = {
  admin:      "bg-purple-50 text-purple-700",
  instructor: "bg-blue-50 text-blue-700",
};
const ROLE_LABELS: Record<string, string> = {
  admin:      "Administrador",
  instructor: "Instructor",
};

// ── Page ──────────────────────────────────────────────────────────────────────

export default function InstructorDetailPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const id = params.id as string;
  const { user, currentCompany } = useAuth();

  const initialTab = searchParams.get("tab") ?? "schedule";

  const isAdmin = user?.employee_profiles?.find(
    (p) => p.company === currentCompany?.id
  )?.role === "admin";

  const [employee, setEmployee]               = useState<Employee | null>(null);
  const [groups, setGroups]                   = useState<ClassGroup[]>([]);
  const [isFetching, setIsFetching]           = useState(true);
  const [loadingGroups, setLoadingGroups]     = useState(false);
  const [editing, setEditing]                 = useState(false);
  const [specialty, setSpecialty]             = useState("");
  const [phone, setPhone]                     = useState("");
  const [saving, setSaving]                   = useState(false);
  const [activeGroupIds, setActiveGroupIds]   = useState<Set<string>>(new Set());
  const [showDeactivate, setShowDeactivate]   = useState(false);
  const [deactivating, setDeactivating]       = useState(false);

  const toggleGroup = (gid: string) => {
    setActiveGroupIds((prev) => {
      const next = new Set(prev);
      if (next.has(gid)) next.delete(gid);
      else next.add(gid);
      return next;
    });
  };

  useEffect(() => {
    const load = async () => {
      try {
        setIsFetching(true);
        const data = await employeesApi.getById(id);
        setEmployee(data);
        setSpecialty(data.specialty ?? "");
        setPhone(data.phone ?? "");
      } catch {
        toast.error("Error al cargar el instructor");
        router.push("/employees");
      } finally {
        setIsFetching(false);
      }
    };
    load();
  }, [id, router]);

  const fetchGroups = useCallback(async () => {
    try {
      setLoadingGroups(true);
      const data = await classGroupsApi.getAll({ instructor: id, limit: 50 });
      setGroups(data.results);
    } catch {
      // no bloqueante
    } finally {
      setLoadingGroups(false);
    }
  }, [id]);

  useEffect(() => { fetchGroups(); }, [fetchGroups]);

  const handleSave = async () => {
    try {
      setSaving(true);
      const updated = await employeesApi.update(id, {
        specialty: specialty.trim() || undefined,
        phone:     phone.trim() || undefined,
      });
      setEmployee(updated);
      setEditing(false);
      toast.success("Datos actualizados");
    } catch {
      toast.error("Error al actualizar los datos");
    } finally {
      setSaving(false);
    }
  };

  const handleDeactivate = async () => {
    try {
      setDeactivating(true);
      await employeesApi.deactivate(id);
      toast.success(`${employee?.full_name} dado de baja`);
      router.push("/employees");
    } catch {
      toast.error("Error al dar de baja al instructor");
      setDeactivating(false);
      setShowDeactivate(false);
    }
  };

  if (isFetching) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }
  if (!employee) return null;

  // Mapa de color consistente por group.id
  const colorMap: Record<string, number> = {};
  groups.forEach((g, i) => { colorMap[g.id] = i % GROUP_COLORS.length; });

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl font-bold tracking-tight truncate">{employee.full_name}</h1>
            <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${ROLE_STYLES[employee.role] ?? "bg-gray-50 text-gray-700"}`}>
              {ROLE_LABELS[employee.role] ?? employee.role}
            </span>
          </div>
          {employee.specialty && (
            <p className="text-muted-foreground text-sm">{employee.specialty}</p>
          )}
        </div>
        {isAdmin && (
          <Button
            variant="outline"
            size="sm"
            className="text-destructive border-destructive/40 hover:bg-destructive/10 hover:text-destructive shrink-0 disabled:opacity-40 disabled:pointer-events-none"
            disabled={employee.role === "admin"}
            onClick={() => setShowDeactivate(true)}
          >
            <UserMinus className="h-4 w-4 mr-1.5" />
            Dar de baja
          </Button>
        )}
      </div>

      {/* 3 Tabs */}
      <Tabs defaultValue={initialTab}>
        <TabsList>
          <TabsTrigger value="schedule" className="gap-1.5">
            <Calendar className="h-4 w-4" />
            Horarios
          </TabsTrigger>
          <TabsTrigger value="groups" className="gap-1.5">
            <GraduationCap className="h-4 w-4" />
            Grupos asignados
            {!loadingGroups && groups.length > 0 && (
              <span className="text-xs text-muted-foreground ml-0.5">({groups.length})</span>
            )}
          </TabsTrigger>
          <TabsTrigger value="info" className="gap-1.5">
            <Shield className="h-4 w-4" />
            Información
          </TabsTrigger>
        </TabsList>

        {/* ── Tab Horarios ── */}
        <TabsContent value="schedule" className="mt-4">
          <Card>
            <CardContent className="pt-4 flex flex-col gap-3">
              {loadingGroups ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <>
                  {/* Grupos visibles según leyenda */}
                  <div style={{ height: "calc(100dvh - 320px)" }}>
                    {(() => {
                      const visibleGroups = activeGroupIds.size > 0
                        ? groups.filter((g) => activeGroupIds.has(g.id))
                        : groups;
                      return (
                        <WeeklyCalendar
                          groups={visibleGroups}
                          allGroups={groups}
                          colorMap={colorMap}
                          fillHeight
                          onNavigate={(gid) => router.push(`/class-groups/${gid}`)}
                        />
                      );
                    })()}
                  </div>

                  {/* Leyenda interactiva */}
                  {groups.length > 0 && (
                    <div className="flex flex-wrap gap-2 pt-1 border-t shrink-0">
                      {groups.map((g) => {
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
                          </button>
                        );
                      })}
                      {activeGroupIds.size > 0 && (
                        <button
                          onClick={() => setActiveGroupIds(new Set())}
                          className="flex items-center gap-1 px-2 py-1 rounded-full border border-dashed text-xs text-muted-foreground hover:text-foreground transition-colors"
                        >
                          <X className="h-3 w-3" />
                          Limpiar filtros
                        </button>
                      )}
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Tab Grupos asignados ── */}
        <TabsContent value="groups" className="mt-4">
          <Card>
            <CardContent className="pt-4">
              {loadingGroups ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : groups.length === 0 ? (
                <div className="flex flex-col items-center py-10 gap-2 text-center">
                  <GraduationCap className="h-10 w-10 text-muted-foreground/30" />
                  <p className="text-sm text-muted-foreground">Sin grupos asignados</p>
                  {isAdmin && (
                    <Button variant="outline" size="sm" onClick={() => router.push("/class-groups")}>
                      Ir a grupos
                    </Button>
                  )}
                </div>
              ) : (
                <div className="divide-y">
                  {groups.map((group) => (
                    <div
                      key={group.id}
                      className="flex items-center gap-3 py-3 first:pt-0 last:pb-0 cursor-pointer hover:bg-muted/30 rounded px-1 -mx-1 transition-colors"
                      onClick={() => router.push(`/class-groups/${group.id}`)}
                    >
                      <div className={`h-3 w-3 rounded-sm shrink-0 ${GROUP_COLORS[colorMap[group.id]].dot}`} />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate hover:underline">{group.name}</p>
                        <p className="text-xs text-muted-foreground">{group.schedule_display}</p>
                      </div>
                      <div className="flex items-center gap-3 shrink-0 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {group.active_enrollment_count}
                        </span>
                        <span className="flex items-center gap-1 text-green-700 font-medium">
                          <DollarSign className="h-3 w-3" />
                          ${group.monthly_fee.toLocaleString("es-MX")}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Tab Información ── */}
        <TabsContent value="info" className="mt-4">
          <Card className="max-w-md">
            <CardHeader className="pb-3 flex flex-row items-center justify-between gap-2">
              <CardTitle className="text-base">Datos del instructor</CardTitle>
              {isAdmin && !editing && (
                <Button variant="ghost" size="sm" onClick={() => setEditing(true)}>
                  <Pencil className="h-4 w-4 mr-1" />
                  Editar
                </Button>
              )}
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Email (read-only) */}
              <div className="flex items-center gap-2 text-sm">
                <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
                <span>{employee.email || <span className="text-muted-foreground italic">Sin email</span>}</span>
              </div>

              {/* Rol (read-only) */}
              <div className="flex items-center gap-2 text-sm">
                <Shield className="h-4 w-4 text-muted-foreground shrink-0" />
                <span>{ROLE_LABELS[employee.role] ?? employee.role}</span>
                <span className="text-xs text-muted-foreground">(solo desde Admin)</span>
              </div>

              {editing ? (
                <div className="space-y-3 pt-1">
                  <div className="space-y-1.5">
                    <Label htmlFor="edit-phone">Teléfono</Label>
                    <Input
                      id="edit-phone"
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="9991234567"
                      disabled={saving}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="edit-specialty">Especialidad</Label>
                    <Input
                      id="edit-specialty"
                      value={specialty}
                      onChange={(e) => setSpecialty(e.target.value)}
                      placeholder="Ej: Salsa y Bachata"
                      disabled={saving}
                    />
                  </div>
                  <div className="flex gap-2 pt-1">
                    <Button size="sm" onClick={handleSave} disabled={saving} className="flex-1">
                      {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                      Guardar
                    </Button>
                    <Button
                      size="sm" variant="outline"
                      onClick={() => {
                        setEditing(false);
                        setSpecialty(employee.specialty ?? "");
                        setPhone(employee.phone ?? "");
                      }}
                      disabled={saving}
                    >
                      Cancelar
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground shrink-0" />
                    {employee.phone
                      ? <span>{employee.phone}</span>
                      : <span className="italic text-muted-foreground">Sin teléfono</span>}
                  </div>
                  <div>
                    <span className="text-muted-foreground">Especialidad: </span>
                    {employee.specialty
                      ? <span className="font-medium">{employee.specialty}</span>
                      : <span className="italic text-muted-foreground">Sin especialidad</span>}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Confirmación de baja */}
      <AlertDialog open={showDeactivate} onOpenChange={(v) => { if (!v) setShowDeactivate(false); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Dar de baja a {employee.full_name}?</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3 text-sm text-muted-foreground">
                {groups.length > 0 ? (
                  <>
                    <p>
                      Este instructor tiene <strong className="text-foreground">{groups.length} grupo{groups.length !== 1 ? "s" : ""} asignado{groups.length !== 1 ? "s" : ""}</strong>.
                      Debes desasignarlo de todos los grupos antes de darlo de baja.
                    </p>
                    <ul className="space-y-1 border rounded-md p-3 bg-muted/40">
                      {groups.map((g) => (
                        <li key={g.id} className="flex items-center gap-2">
                          <GraduationCap className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                          <span className="font-medium text-foreground">{g.name}</span>
                          <span className="text-xs">— {g.schedule_display}</span>
                        </li>
                      ))}
                    </ul>
                  </>
                ) : (
                  <p>
                    <strong className="text-foreground">{employee.full_name}</strong> quedará inactivo
                    y no podrá ser asignado a grupos nuevos.
                  </p>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deactivating}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeactivate}
              disabled={deactivating || groups.length > 0}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 disabled:opacity-50"
            >
              {deactivating ? "Procesando..." : "Dar de baja"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </div>
  );
}
