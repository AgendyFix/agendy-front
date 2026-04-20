"use client";

// ============================================
// CLASS GROUP DETAIL PAGE
// ============================================

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft, Loader2, Users, Clock, DollarSign,
  Phone, UserPlus, Pencil, Pause, UserX, Check, X as XIcon, Trash2,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { ClassGroupForm } from "@/components/classGroups/ClassGroupForm";
import { classGroupsApi } from "@/lib/api/classGroups";
import { enrollmentsApi } from "@/lib/api/enrollments";
import { useClassGroups } from "@/lib/hooks/useClassGroups";
import type { ClassGroup, Enrollment } from "@/lib/types/models";
import type { UpdateClassGroupRequest } from "@/lib/types/api";

// ── helpers ──────────────────────────────────────────────────────────────────

/** Convierte "HH:MM:SS" o "HH:MM" → "H:MM AM/PM" */
function to12h(time: string): string {
  const [hStr, mStr] = time.split(":");
  let h = parseInt(hStr, 10);
  const m = mStr;
  const period = h >= 12 ? "PM" : "AM";
  h = h % 12 || 12;
  return `${h}:${m} ${period}`;
}

const LEVEL_COLORS: Record<string, string> = {
  all:          "bg-gray-100 text-gray-700",
  beginner:     "bg-green-100 text-green-700",
  intermediate: "bg-yellow-100 text-yellow-700",
  advanced:     "bg-red-100 text-red-700",
};

const STATUS_STYLES: Record<string, string> = {
  active: "bg-green-100 text-green-700",
  paused: "bg-yellow-100 text-yellow-700",
  dropped: "bg-red-100 text-red-700",
};

const STATUS_LABELS: Record<string, string> = {
  active: "Activo",
  paused: "Pausado",
  dropped: "Baja",
};

// ── component ─────────────────────────────────────────────────────────────────

export default function ClassGroupDetailPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = params.id as string;

  const [group, setGroup] = useState<ClassGroup | null>(null);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loadingGroup, setLoadingGroup] = useState(true);
  const [loadingEnrollments, setLoadingEnrollments] = useState(true);
  const [editing, setEditing] = useState(searchParams.get("edit") === "true");

  // confirmación de baja de alumno
  const [dropTarget, setDropTarget] = useState<Enrollment | null>(null);
  const [dropping, setDropping] = useState(false);

  // confirmación de eliminar grupo
  const [showDeleteGroup, setShowDeleteGroup] = useState(false);
  const [deletingGroup, setDeletingGroup]     = useState(false);

  // Edición de día de pago inline
  const [editingBillingDay, setEditingBillingDay] = useState<string | null>(null);
  const [billingDayValue, setBillingDayValue] = useState<string>("");
  const [savingBillingDay, setSavingBillingDay] = useState(false);

  const handleSaveBillingDay = async (enrollment: Enrollment) => {
    const val = parseInt(billingDayValue, 10);
    if (isNaN(val) || val < 1 || val > 28) {
      toast.error("El día de pago debe estar entre 1 y 28");
      return;
    }
    try {
      setSavingBillingDay(true);
      await enrollmentsApi.update(enrollment.id, { custom_billing_day: val });
      toast.success("Día de pago actualizado");
      fetchEnrollments();
    } catch {
      toast.error("No se pudo actualizar el día de pago");
    } finally {
      setSavingBillingDay(false);
      setEditingBillingDay(null);
    }
  };

  const { updateClassGroup, isLoading } = useClassGroups();

  // carga del grupo
  useEffect(() => {
    const load = async () => {
      try {
        const data = await classGroupsApi.getById(id);
        setGroup(data);
      } catch {
        toast.error("No se pudo cargar el grupo");
        router.push("/class-groups"); // error al cargar, regresar al listado
      } finally {
        setLoadingGroup(false);
      }
    };
    load();
  }, [id, router]);

  // carga de inscripciones del grupo
  const fetchEnrollments = useCallback(async () => {
    try {
      setLoadingEnrollments(true);
      const data = await enrollmentsApi.getAll({ class_group: id, limit: 100 });
      setEnrollments(data.results);
    } catch {
      // no bloqueante
    } finally {
      setLoadingEnrollments(false);
    }
  }, [id]);

  useEffect(() => {
    fetchEnrollments();
  }, [fetchEnrollments]);

  const handleUpdate = async (data: UpdateClassGroupRequest) => {
    const updated = await updateClassGroup(id, data);
    setGroup(updated);
    setEditing(false);
    toast.success("Grupo actualizado");
  };

  const handleDropEnrollment = async () => {
    if (!dropTarget) return;
    try {
      setDropping(true);
      await enrollmentsApi.update(dropTarget.id, { status: "dropped" });
      toast.success(`${dropTarget.client_name} dado de baja`);
      fetchEnrollments();
      // actualizar conteo en el grupo
      setGroup((prev) =>
        prev ? { ...prev, active_enrollment_count: prev.active_enrollment_count - 1 } : prev
      );
    } catch {
      toast.error("No se pudo dar de baja al alumno");
    } finally {
      setDropping(false);
      setDropTarget(null);
    }
  };

  const handleTogglePause = async (enrollment: Enrollment) => {
    const newStatus = enrollment.status === "paused" ? "active" : "paused";
    try {
      await enrollmentsApi.update(enrollment.id, { status: newStatus });
      toast.success(
        newStatus === "paused"
          ? `${enrollment.client_name} pausado`
          : `${enrollment.client_name} reactivado`
      );
      fetchEnrollments();
    } catch {
      toast.error("No se pudo actualizar el estado");
    }
  };

  const handleDeleteGroup = async () => {
    try {
      setDeletingGroup(true);
      await classGroupsApi.delete(id);
      toast.success("Grupo eliminado");
      router.push("/class-groups");
    } catch {
      toast.error("Error al eliminar el grupo");
      setDeletingGroup(false);
      setShowDeleteGroup(false);
    }
  };

  if (loadingGroup) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!group) return null;

  const activeCount = enrollments.filter((e) => e.status === "active").length;
  // Para clases individuales, el precio viene de primary_enrollment_fee (backend)
  // o como fallback del enrollment activo cargado localmente
  const activeEnrollment = group.is_individual
    ? enrollments.find((e) => e.status === "active")
    : null;
  const displayFee = group.is_individual
    ? (group.primary_enrollment_fee ?? activeEnrollment?.monthly_fee ?? null)
    : group.monthly_fee;

  return (
    <div className="space-y-6">

      {/* ── Header ── */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => router.push("/class-groups")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl font-bold tracking-tight truncate">{group.name}</h1>
            <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${LEVEL_COLORS[group.level]}`}>
              {group.level_display}
            </span>
          </div>
          {group.instructor_name && (
            <p className="text-muted-foreground text-sm">Instructor: {group.instructor_name}</p>
          )}
        </div>
        {!editing && (
          <div className="flex items-center gap-2 shrink-0">
            <Button variant="outline" onClick={() => setEditing(true)}>
              <Pencil className="h-4 w-4 mr-2" />
              Editar
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="text-destructive border-destructive/40 hover:bg-destructive/10 hover:text-destructive"
              onClick={() => setShowDeleteGroup(true)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>

      {/* ── Modo edición ── */}
      {editing ? (
        <div className="max-w-2xl">
          <Card>
            <CardHeader>
              <CardTitle>Editar grupo</CardTitle>
            </CardHeader>
            <CardContent>
              <ClassGroupForm
                initialData={group}
                onSubmit={handleUpdate}
                onCancel={() => setEditing(false)}
                isLoading={isLoading}
              />
            </CardContent>
          </Card>
        </div>
      ) : (
        <>
          {/* ── 3 stat cards ── */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">

            <Card>
              <CardContent className="p-5 flex items-center gap-4">
                <div className="rounded-full bg-blue-100 p-3 shrink-0">
                  <Users className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{activeCount}</p>
                  <p className="text-xs text-muted-foreground">Alumnos activos</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-5 flex items-center gap-4">
                <div className="rounded-full bg-green-100 p-3 shrink-0">
                  <DollarSign className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {displayFee != null ? `$${displayFee.toLocaleString("es-MX")}` : "—"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {group.is_individual ? "Mensualidad del alumno" : "Mensualidad base"}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-5 flex items-center gap-4">
                <div className="rounded-full bg-purple-100 p-3 shrink-0">
                  <Clock className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{group.schedules.length}</p>
                  <p className="text-xs text-muted-foreground">
                    Día{group.schedules.length !== 1 ? "s" : ""} de clase
                  </p>
                </div>
              </CardContent>
            </Card>

          </div>

          {/* ── 2 columnas: alumnos (izquierda) + horarios (derecha) ── */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-start">

            {/* Alumnos inscritos — ocupa 3/5 del ancho */}
            <Card className="lg:col-span-3">
              <CardHeader className="flex flex-row items-center justify-between gap-3 pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  Alumnos inscritos
                  {!loadingEnrollments && (
                    <span className="text-muted-foreground font-normal text-sm">
                      ({enrollments.length})
                    </span>
                  )}
                </CardTitle>
                <Button
                  size="sm"
                  onClick={() => router.push(`/enrollments/new?class_group=${group.id}`)}
                >
                  <UserPlus className="h-4 w-4 mr-2" />
                  Inscribir alumno
                </Button>
              </CardHeader>

              <CardContent>
                {loadingEnrollments ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : enrollments.length === 0 ? (
                  <div className="flex flex-col items-center py-10 gap-2 text-center">
                    <Users className="h-10 w-10 text-muted-foreground/30" />
                    <p className="text-sm text-muted-foreground">
                      Aún no hay alumnos inscritos en este grupo
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => router.push(`/enrollments/new?class_group=${group.id}`)}
                    >
                      <UserPlus className="h-4 w-4 mr-2" />
                      Inscribir primer alumno
                    </Button>
                  </div>
                ) : (
                  <div className="divide-y">
                    {enrollments.map((enrollment) => (
                      <div
                        key={enrollment.id}
                        className="flex items-center gap-3 py-3 first:pt-0 last:pb-0"
                      >
                        {/* Avatar */}
                        <div className="h-9 w-9 rounded-full bg-muted flex items-center justify-center shrink-0 font-semibold text-sm text-muted-foreground">
                          {enrollment.client_name.charAt(0).toUpperCase()}
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <p
                            className="font-medium text-sm truncate cursor-pointer hover:underline"
                            onClick={() => router.push(`/clients/${enrollment.client}`)}
                          >
                            {enrollment.client_name}
                          </p>
                          <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                            {enrollment.client_phone && (
                              <span className="flex items-center gap-1">
                                <Phone className="h-3 w-3" />
                                {enrollment.client_phone}
                              </span>
                            )}
                            {/* Día de pago editable */}
                            {editingBillingDay === enrollment.id ? (
                              <span className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                                <span>Día:</span>
                                <input
                                  type="number"
                                  min={1}
                                  max={28}
                                  value={billingDayValue}
                                  onChange={(e) => setBillingDayValue(e.target.value)}
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter") handleSaveBillingDay(enrollment);
                                    if (e.key === "Escape") setEditingBillingDay(null);
                                  }}
                                  className="w-14 h-6 border rounded px-1.5 text-xs text-foreground bg-background focus:outline-none focus:ring-1 focus:ring-primary"
                                  autoFocus
                                  disabled={savingBillingDay}
                                />
                                <button
                                  onClick={() => handleSaveBillingDay(enrollment)}
                                  disabled={savingBillingDay}
                                  className="cursor-pointer p-1 rounded text-green-600 hover:text-green-700 hover:bg-green-50 disabled:opacity-50 transition-colors"
                                  title="Guardar"
                                >
                                  {savingBillingDay ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                                </button>
                                <button
                                  onClick={() => setEditingBillingDay(null)}
                                  disabled={savingBillingDay}
                                  className="cursor-pointer p-1 rounded text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
                                  title="Cancelar"
                                >
                                  <XIcon className="h-4 w-4" />
                                </button>
                              </span>
                            ) : (
                              <span className="flex items-center gap-1.5">
                                <span>
                                  Día de pago:{" "}
                                  <strong className="text-foreground font-semibold">{enrollment.billing_day}</strong>
                                </span>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setEditingBillingDay(enrollment.id);
                                    setBillingDayValue(String(enrollment.billing_day));
                                  }}
                                  title="Editar día de pago"
                                  className="cursor-pointer p-1 rounded text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
                                >
                                  <Pencil className="h-4 w-4" />
                                </button>
                              </span>
                            )}
                            <span>${enrollment.monthly_fee.toLocaleString("es-MX")}/mes</span>
                          </div>
                        </div>

                        {/* Estado */}
                        <span className={`hidden sm:inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium shrink-0 ${STATUS_STYLES[enrollment.status]}`}>
                          {STATUS_LABELS[enrollment.status]}
                        </span>

                        {/* Acciones */}
                        <div className="flex gap-1 shrink-0">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            title={enrollment.status === "paused" ? "Reactivar" : "Pausar"}
                            onClick={() => handleTogglePause(enrollment)}
                          >
                            <Pause className="h-4 w-4 text-yellow-600" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 hover:bg-red-50"
                            title="Dar de baja"
                            onClick={() => setDropTarget(enrollment)}
                            disabled={enrollment.status === "dropped"}
                          >
                            <UserX className="h-4 w-4 text-red-600" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Horarios — ocupa 2/5 del ancho */}
            <Card className="lg:col-span-2">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  Horarios
                </CardTitle>
              </CardHeader>
              <CardContent>
                {group.schedules.length === 0 ? (
                  <p className="text-sm text-muted-foreground italic">Sin horarios definidos</p>
                ) : (
                  <div className="divide-y">
                    {group.schedules.map((s) => (
                      <div
                        key={s.id}
                        className="flex items-center justify-between py-3 first:pt-0 last:pb-0"
                      >
                        <span className="font-medium text-sm">{s.day_of_week_display}</span>
                        <span className="text-muted-foreground text-sm tabular-nums">
                          {to12h(s.start_time)} — {to12h(s.end_time)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

          </div>
        </>
      )}

      {/* ── Confirm baja ── */}
      <AlertDialog open={!!dropTarget} onOpenChange={(open) => !open && setDropTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Dar de baja a {dropTarget?.client_name}?</AlertDialogTitle>
            <AlertDialogDescription>
              Se marcará la inscripción como <strong>Baja</strong>. El alumno dejará de
              contar como activo en este grupo.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={dropping}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDropEnrollment}
              disabled={dropping}
              className="bg-red-600 hover:bg-red-700"
            >
              {dropping && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Dar de baja
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ── Confirmar eliminar grupo ── */}
      <AlertDialog open={showDeleteGroup} onOpenChange={(v) => { if (!v) setShowDeleteGroup(false); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar grupo?</AlertDialogTitle>
            <AlertDialogDescription>
              El grupo <strong>{group?.name}</strong> será eliminado permanentemente junto con
              todos sus horarios. Los alumnos inscritos perderán su inscripción.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deletingGroup}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteGroup}
              disabled={deletingGroup}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deletingGroup && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </div>
  );
}
