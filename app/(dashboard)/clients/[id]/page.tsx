"use client";

// ============================================
// CLIENT DETAIL PAGE - Info + edición + inscripciones
// ============================================

import { useEffect, useState, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import {
  ArrowLeft, Phone, Mail, Pencil, UserPlus, Plus,
  Loader2, Pause, UserX, CreditCard, GraduationCap, CheckCircle, AlertTriangle,
  Check, X as XIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { clientsApi } from "@/lib/api/clients";
import { enrollmentsApi } from "@/lib/api/enrollments";
import { paymentsApi } from "@/lib/api/payments";
import { useFeatures } from "@/lib/hooks/useFeatures";
import { useAuth } from "@/lib/hooks/useAuth";
import { RegisterPaymentForm } from "@/components/payments/RegisterPaymentForm";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import type { Client, Enrollment, Payment, UnpaidEnrollment } from "@/lib/types/models";
import type { CreateClientRequest } from "@/lib/types/api";

// ── Schema ────────────────────────────────────────────────────────────────────

const clientSchema = z.object({
  name: z.string().min(1, "El nombre es requerido"),
  last_name: z.string().min(1, "El apellido es requerido"),
  email: z.string().email("Email inválido").optional().or(z.literal("")),
  phone: z.string().min(1, "El teléfono es requerido"),
});

type ClientFormData = z.infer<typeof clientSchema>;

// ── helpers ───────────────────────────────────────────────────────────────────

const STATUS_STYLES: Record<string, string> = {
  active:  "bg-green-100 text-green-700",
  paused:  "bg-yellow-100 text-yellow-700",
  dropped: "bg-red-100 text-red-700",
};

const STATUS_LABELS: Record<string, string> = {
  active:  "Activo",
  paused:  "Pausado",
  dropped: "Baja",
};

const PAYMENT_STATUS_STYLES: Record<string, string> = {
  paid:    "bg-green-100 text-green-700",
  overdue: "bg-red-100 text-red-700",
  waived:  "bg-gray-100 text-gray-600",
};

const PAYMENT_STATUS_LABELS: Record<string, string> = {
  paid:    "Pagado",
  overdue: "Vencido",
  waived:  "Condonado",
};

const METHOD_LABELS: Record<string, string> = {
  cash:     "Efectivo",
  card:     "Tarjeta",
  transfer: "Transferencia",
  other:    "Otro",
};

function formatDate(date: string) {
  const [y, m, d] = date.split("-");
  return `${d}/${m}/${y}`;
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function ClientDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const { getFeatureName } = useFeatures();
  const { currentCompany } = useAuth();

  const entityName = getFeatureName("client_groups") ?? "Clientes";
  const entitySingular = entityName.endsWith("s") ? entityName.slice(0, -1) : entityName;

  const [client, setClient] = useState<Client | null>(null);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loadingPayments, setLoadingPayments] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [dropTarget, setDropTarget] = useState<Enrollment | null>(null);
  const [dropping, setDropping] = useState(false);
  const [registerPaymentOpen, setRegisterPaymentOpen] = useState(false);
  const [registeringPayment, setRegisteringPayment] = useState(false);
  const [preselectedPaymentEnrollment, setPreselectedPaymentEnrollment] = useState<UnpaidEnrollment | undefined>();

  // Construye un UnpaidEnrollment desde una Enrollment para preseleccionar en el modal
  const buildUnpaid = (e: Enrollment): UnpaidEnrollment => ({
    enrollment_id: e.id,
    client_id: e.client,
    client_name: client?.full_name ?? "",
    client_phone: client?.phone ?? "",
    class_group_name: e.class_group_name,
    monthly_fee: e.monthly_fee,
  });

  const openRegisterPayment = (enrollment?: Enrollment) => {
    if (enrollment) {
      setPreselectedPaymentEnrollment(buildUnpaid(enrollment));
    } else {
      // Si solo hay una inscripción activa, preseleccionarla
      const active = enrollments.filter((e) => e.status === "active");
      setPreselectedPaymentEnrollment(active.length === 1 ? buildUnpaid(active[0]) : undefined);
    }
    setRegisterPaymentOpen(true);
  };

  // Edición de día de pago inline
  const [editingBillingDay, setEditingBillingDay] = useState<string | null>(null); // enrollment.id
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

  const { register, handleSubmit, reset, formState: { errors } } = useForm<ClientFormData>({
    resolver: zodResolver(clientSchema),
  });

  // Carga del cliente
  useEffect(() => {
    const load = async () => {
      try {
        setIsFetching(true);
        const data = await clientsApi.getById(id);
        setClient(data);
        reset({
          name: data.name,
          last_name: data.last_name,
          email: data.email || "",
          phone: data.phone || "",
        });
      } catch {
        toast.error(`Error al cargar el ${entitySingular.toLowerCase()}`);
        router.push("/clients");
      } finally {
        setIsFetching(false);
      }
    };
    load();
  }, [id, reset, router]);

  // Carga de inscripciones del cliente
  const fetchEnrollments = useCallback(async () => {
    try {
      const data = await enrollmentsApi.getAll({ client: id, limit: 50 });
      setEnrollments(data.results);
    } catch {
      // no bloqueante
    }
  }, [id]);

  // Carga de pagos — una sola llamada con enrollment__client
  const fetchPayments = useCallback(async () => {
    try {
      setLoadingPayments(true);
      const data = await paymentsApi.getAll({
        enrollment__client: id,
        ordering: "-payment_date",
        limit: 100,
      });
      setPayments(data.results);
    } catch {
      // no bloqueante
    } finally {
      setLoadingPayments(false);
    }
  }, [id]);

  useEffect(() => {
    fetchEnrollments();
    fetchPayments();
  }, [fetchEnrollments, fetchPayments]);

  const onSubmit = async (data: ClientFormData) => {
    try {
      setIsSaving(true);
      const cleanData: Partial<CreateClientRequest> = {
        name: data.name.trim(),
        last_name: data.last_name.trim(),
        phone: data.phone.trim(),
      };
      if (data.email?.trim()) cleanData.email = data.email.trim();
      const updated = await clientsApi.update(id, cleanData);
      setClient(updated);
      setEditing(false);
      toast.success(`${entitySingular} actualizado`);
    } catch {
      toast.error(`Error al actualizar el ${entitySingular.toLowerCase()}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleTogglePause = async (enrollment: Enrollment) => {
    const newStatus = enrollment.status === "paused" ? "active" : "paused";
    try {
      await enrollmentsApi.update(enrollment.id, { status: newStatus });
      toast.success(newStatus === "paused" ? "Inscripción pausada" : "Inscripción reactivada");
      fetchEnrollments();
    } catch {
      toast.error("No se pudo actualizar el estado");
    }
  };

  const handleRegisterPayment = async (data: {
    enrollment: string;
    payment_method: Payment["payment_method"];
    payment_date: string;
  }) => {
    try {
      setRegisteringPayment(true);
      await paymentsApi.create(data);
      toast.success("Pago registrado");
      setRegisterPaymentOpen(false);
      fetchPayments();
    } catch (err: any) {
      const apiErrors = err?.response?.data;
      if (apiErrors && typeof apiErrors === "object") {
        Object.entries(apiErrors).forEach(([field, messages]) => {
          const msg = Array.isArray(messages) ? messages[0] : String(messages);
          toast.error(`${field}: ${msg}`);
        });
      } else {
        toast.error("Error al registrar el pago");
      }
    } finally {
      setRegisteringPayment(false);
    }
  };

  const handleDrop = async () => {
    if (!dropTarget) return;
    try {
      setDropping(true);
      await enrollmentsApi.update(dropTarget.id, { status: "dropped" });
      toast.success(`Dado de baja de ${dropTarget.class_group_name}`);
      fetchEnrollments();
    } catch {
      toast.error("No se pudo dar de baja");
    } finally {
      setDropping(false);
      setDropTarget(null);
    }
  };

  if (isFetching) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4" />
          <p className="text-muted-foreground">Cargando {entitySingular.toLowerCase()}...</p>
        </div>
      </div>
    );
  }

  if (!client) return null;

  const activeEnrollments = enrollments.filter((e) => e.status === "active");

  return (
    <div className="space-y-6">

      {/* ── Header ── */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-bold tracking-tight truncate">{client.full_name}</h1>
          <div className="flex items-center gap-4 text-sm text-muted-foreground mt-0.5">
            {client.phone && (
              <span className="flex items-center gap-1">
                <Phone className="h-3 w-3" />{client.phone}
              </span>
            )}
            {client.email && (
              <span className="flex items-center gap-1">
                <Mail className="h-3 w-3" />{client.email}
              </span>
            )}
          </div>
        </div>
        {!editing && (
          <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
            <Pencil className="h-4 w-4 mr-2" />
            Editar
          </Button>
        )}
      </div>

      {/* ── Layout 2 columnas en desktop ── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-start">

        {/* ── Inscripciones (3/5) ── */}
        <Card className="lg:col-span-3">
          <CardHeader className="flex flex-row items-center justify-between gap-3 pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <GraduationCap className="h-4 w-4 text-muted-foreground" />
              Grupos inscritos
              <span className="text-muted-foreground font-normal text-sm">
                ({activeEnrollments.length} activo{activeEnrollments.length !== 1 ? "s" : ""})
              </span>
            </CardTitle>
            <Button
              size="sm"
              onClick={() => router.push(`/enrollments/new?client=${id}`)}
            >
              <UserPlus className="h-4 w-4 mr-2" />
              Inscribir
            </Button>
          </CardHeader>
          <CardContent>
            {enrollments.length === 0 ? (
              <div className="flex flex-col items-center py-8 gap-2 text-center">
                <GraduationCap className="h-10 w-10 text-muted-foreground/30" />
                <p className="text-sm text-muted-foreground">
                  Sin inscripciones en ningún grupo
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.push(`/enrollments/new?client=${id}`)}
                >
                  <UserPlus className="h-4 w-4 mr-2" />
                  Inscribir en un grupo
                </Button>
              </div>
            ) : (
              <div className="divide-y">
                {enrollments.map((enrollment) => (
                  <div key={enrollment.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p
                        className="font-medium text-sm truncate hover:underline cursor-pointer"
                        onClick={() => router.push(`/class-groups/${enrollment.class_group}`)}
                      >
                        {enrollment.class_group_name}
                      </p>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5 flex-wrap">
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
                        variant="ghost" size="icon" className="h-8 w-8"
                        title={enrollment.status === "paused" ? "Reactivar" : "Pausar"}
                        onClick={() => handleTogglePause(enrollment)}
                        disabled={enrollment.status === "dropped"}
                      >
                        <Pause className="h-4 w-4 text-yellow-600" />
                      </Button>
                      <Button
                        variant="ghost" size="icon" className="h-8 w-8 hover:bg-red-50"
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

        {/* ── Columna derecha (2/5) ── */}
        <div className="lg:col-span-2 space-y-6">

          {/* Edición o info de contacto */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">
                {editing ? `Editar ${entitySingular}` : "Contacto"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {editing ? (
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                  <div className="grid gap-3 grid-cols-2">
                    <div className="space-y-1.5">
                      <Label htmlFor="name">Nombre *</Label>
                      <Input id="name" disabled={isSaving} {...register("name")} />
                      {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="last_name">Apellido *</Label>
                      <Input id="last_name" disabled={isSaving} {...register("last_name")} />
                      {errors.last_name && <p className="text-xs text-red-500">{errors.last_name.message}</p>}
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="phone">Teléfono *</Label>
                    <Input id="phone" type="tel" disabled={isSaving} {...register("phone")} />
                    {errors.phone && <p className="text-xs text-red-500">{errors.phone.message}</p>}
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="email">Email (opcional)</Label>
                    <Input id="email" type="email" disabled={isSaving} {...register("email")} />
                    {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
                  </div>
                  <div className="flex gap-2 pt-1">
                    <Button type="submit" disabled={isSaving} className="flex-1" size="sm">
                      {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                      Guardar
                    </Button>
                    <Button type="button" variant="outline" size="sm" onClick={() => setEditing(false)} disabled={isSaving}>
                      Cancelar
                    </Button>
                  </div>
                </form>
              ) : (
                <div className="space-y-3 text-sm">
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground shrink-0" />
                    <span>{client.phone ?? <span className="italic text-muted-foreground">Sin teléfono</span>}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
                    <span>{client.email ?? <span className="italic text-muted-foreground">Sin correo</span>}</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

        </div>
      </div>

      {/* ── Historial de pagos — ancho completo ── */}
      <Card>
        <CardHeader className="pb-3 flex flex-row items-center justify-between gap-3">
          <CardTitle className="text-base flex items-center gap-2">
            <CreditCard className="h-4 w-4 text-muted-foreground" />
            Historial de pagos
            {!loadingPayments && payments.length > 0 && (
              <span className="text-muted-foreground font-normal text-sm">
                ({payments.length})
              </span>
            )}
          </CardTitle>
          <Button size="sm" onClick={() => openRegisterPayment()}>
            <Plus className="h-4 w-4 mr-2" />
            Registrar pago
          </Button>
        </CardHeader>
        <CardContent>
          {loadingPayments ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : payments.length === 0 ? (
            <div className="flex flex-col items-center py-8 gap-2 text-center">
              <CreditCard className="h-10 w-10 text-muted-foreground/30" />
              <p className="text-sm text-muted-foreground">Sin pagos registrados</p>
              <Button variant="outline" size="sm" onClick={() => openRegisterPayment()}>
                <Plus className="h-4 w-4 mr-2" />
                Registrar primer pago
              </Button>
            </div>
          ) : (
            <div className="divide-y">
              {payments.map((payment) => (
                <div
                  key={payment.id}
                  className={`flex items-center gap-3 py-3 first:pt-0 last:pb-0 ${
                    payment.status === "overdue" ? "bg-red-50/50 -mx-6 px-6 rounded" : ""
                  }`}
                >
                  {/* Ícono de estado */}
                  <div className="shrink-0">
                    {payment.status === "paid" ? (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    ) : payment.status === "overdue" ? (
                      <AlertTriangle className="h-5 w-5 text-red-500" />
                    ) : (
                      <CheckCircle className="h-5 w-5 text-gray-400" />
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{payment.class_group_name}</p>
                    <div className="flex items-center flex-wrap gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
                      {payment.payment_date && (
                        <span>{formatDate(payment.payment_date)}</span>
                      )}
                      <span>{METHOD_LABELS[payment.payment_method] ?? payment.payment_method}</span>
                      {payment.due_date && payment.status === "overdue" && (
                        <span className="text-red-600 font-medium">Venció: {formatDate(payment.due_date)}</span>
                      )}
                    </div>
                  </div>

                  {/* Monto */}
                  <p className={`font-semibold text-sm shrink-0 ${payment.status === "overdue" ? "text-red-600" : ""}`}>
                    ${payment.amount.toLocaleString("es-MX")}
                  </p>

                  {/* Badge o botón Cobrar */}
                  {payment.status === "overdue" ? (
                    <Button
                      size="sm"
                      variant="outline"
                      className="shrink-0 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                      onClick={() => {
                        // Buscar la inscripción activa que corresponde a este pago
                        const enrollment = enrollments.find((e) => e.id === payment.enrollment);
                        if (enrollment) {
                          openRegisterPayment(enrollment);
                        } else {
                          openRegisterPayment();
                        }
                      }}
                    >
                      Cobrar
                    </Button>
                  ) : (
                    <span className={`hidden sm:inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium shrink-0 ${PAYMENT_STATUS_STYLES[payment.status]}`}>
                      {PAYMENT_STATUS_LABELS[payment.status]}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Modal registrar pago ── */}
      <Dialog open={registerPaymentOpen} onOpenChange={(o) => { setRegisterPaymentOpen(o); if (!o) setPreselectedPaymentEnrollment(undefined); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Registrar pago</DialogTitle>
          </DialogHeader>
          <RegisterPaymentForm
            onSubmit={handleRegisterPayment}
            onCancel={() => { setRegisterPaymentOpen(false); setPreselectedPaymentEnrollment(undefined); }}
            isLoading={registeringPayment}
            preselectedEnrollment={preselectedPaymentEnrollment}
            clientFilter={preselectedPaymentEnrollment ? undefined : id}
          />
        </DialogContent>
      </Dialog>

      {/* ── Confirm baja ── */}
      <AlertDialog open={!!dropTarget} onOpenChange={(open) => !open && setDropTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Dar de baja de {dropTarget?.class_group_name}?</AlertDialogTitle>
            <AlertDialogDescription>
              La inscripción se marcará como <strong>Baja</strong>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={dropping}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDrop}
              disabled={dropping}
              className="bg-red-600 hover:bg-red-700"
            >
              {dropping && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Dar de baja
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </div>
  );
}
