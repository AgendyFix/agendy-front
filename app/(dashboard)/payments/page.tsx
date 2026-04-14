"use client";

// ============================================
// PAYMENTS PAGE - Control de pagos
// ============================================

import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  CreditCard, Search, Loader2, AlertTriangle,
  TrendingUp, CheckCircle, Plus,
  MoreHorizontal, Pencil, Trash2, CalendarIcon,
  Pause, UserX, UserPlus,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table, TableBody, TableCell,
  TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { usePayments } from "@/lib/hooks/usePayments";
import { RegisterPaymentForm } from "@/components/payments/RegisterPaymentForm";
import { DatePicker } from "@/components/ui/date-picker";
import { paymentsApi } from "@/lib/api/payments";
import { enrollmentsApi } from "@/lib/api/enrollments";
import type { Payment, UnpaidEnrollment } from "@/lib/types/models";

// ── helpers ───────────────────────────────────────────────────────────────────

const STATUS_STYLES: Record<string, string> = {
  paid:    "bg-green-100 text-green-700",
  overdue: "bg-red-100 text-red-700",
  waived:  "bg-gray-100 text-gray-600",
};

const STATUS_LABELS: Record<string, string> = {
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

const MONTHS = [
  "Enero","Febrero","Marzo","Abril","Mayo","Junio",
  "Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre",
];

function formatDate(date: string) {
  if (!date) return "—";
  const [, m, d] = date.split("-");
  const [y] = date.split("-");
  return `${d}/${m}/${y}`;
}

function overdueDays(dueDate?: string | null): number {
  if (!dueDate) return 0;
  const due = new Date(dueDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  due.setHours(0, 0, 0, 0);
  return Math.max(0, Math.floor((today.getTime() - due.getTime()) / 86_400_000));
}

// Construye un UnpaidEnrollment desde un Payment overdue para el modal de cobrar
function paymentToUnpaid(p: Payment): UnpaidEnrollment {
  return {
    enrollment_id: p.enrollment,
    client_id:     "",
    client_name:   p.client_name,
    client_phone:  p.client_phone,
    class_group_name: p.class_group_name,
    monthly_fee:   p.amount,
    due_date:      p.due_date,
  };
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function PaymentsPage() {
  const router = useRouter();
  const now = new Date();
  const {
    payments, summary, isLoading, totalCount,
    fetchPayments, fetchSummary, createPayment, updatePayment, deletePayment,
  } = usePayments();

  // Estado de tab activa para controlar qué fetch lanzar
  const [activeTab, setActiveTab] = useState<"all" | "unpaid">("all");

  const [search, setSearch]           = useState("");
  const [methodFilter, setMethodFilter] = useState("all");
  const [summaryMonth, setSummaryMonth] = useState(now.getMonth() + 1);
  const [summaryYear, setSummaryYear]   = useState(now.getFullYear());
  const [registerOpen, setRegisterOpen] = useState(false);
  const [registering, setRegistering]   = useState(false);
  const [preselectedEnrollment, setPreselectedEnrollment] = useState<UnpaidEnrollment | undefined>();

  // Pagos overdue para la tab "Sin pagar"
  const [overduePayments, setOverduePayments]     = useState<Payment[]>([]);
  const [overdueLoading, setOverdueLoading]       = useState(false);
  const [overdueCount, setOverdueCount]           = useState(0);

  // Acciones de corrección
  const [editMethodTarget, setEditMethodTarget] = useState<Payment | null>(null);
  const [editDateTarget, setEditDateTarget]     = useState<Payment | null>(null);
  const [deleteTarget, setDeleteTarget]         = useState<Payment | null>(null);
  const [editValue, setEditValue]               = useState("");
  const [actionLoading, setActionLoading]       = useState(false);
  const isFirstRender = useRef(true);

  // ── Fetches ────────────────────────────────────────────────────────────────

  const fetchOverdue = useCallback(async (params?: { search?: string; month?: number; year?: number }) => {
    try {
      setOverdueLoading(true);
      const res = await paymentsApi.getAll({
        status: "overdue",
        due_date__month: params?.month,
        due_date__year:  params?.year,
        search: params?.search || undefined,
        limit: 100,
      });
      setOverduePayments(res.results);
      setOverdueCount(res.count);
    } catch {
      // no bloqueante
    } finally {
      setOverdueLoading(false);
    }
  }, []);

  // Carga inicial
  useEffect(() => {
    fetchPayments({ page: 1, due_date__month: summaryMonth, due_date__year: summaryYear });
    fetchSummary({ year: summaryYear, month: summaryMonth });
    fetchOverdue({ month: summaryMonth, year: summaryYear });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Al cambiar mes o año: refrescar resumen + ambas tabs
  useEffect(() => {
    fetchSummary({ year: summaryYear, month: summaryMonth });
    fetchPayments({
      page: 1,
      due_date__month: summaryMonth,
      due_date__year:  summaryYear,
      search: search || undefined,
      payment_method: methodFilter !== "all" ? (methodFilter as Payment["payment_method"]) : undefined,
    });
    fetchOverdue({ month: summaryMonth, year: summaryYear, search: search || undefined });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [summaryMonth, summaryYear]);

  // Filtros con debounce — aplica al fetch según tab activa, siempre con el mes activo
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    const t = setTimeout(() => {
      if (activeTab === "all") {
        fetchPayments({
          due_date__month: summaryMonth,
          due_date__year:  summaryYear,
          search: search || undefined,
          payment_method: methodFilter !== "all" ? (methodFilter as Payment["payment_method"]) : undefined,
          page: 1,
        });
      } else {
        fetchOverdue({ month: summaryMonth, year: summaryYear, search: search || undefined });
      }
    }, 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, methodFilter, activeTab]);

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleRegister = async (data: {
    enrollment: string;
    payment_method: Payment["payment_method"];
    payment_date: string;
  }) => {
    try {
      setRegistering(true);
      await createPayment(data);
      toast.success("Pago registrado");
      setRegisterOpen(false);
      setPreselectedEnrollment(undefined);
      fetchPayments({ page: 1 });
      fetchOverdue();
      fetchSummary({ year: summaryYear, month: summaryMonth });
    } catch (err: unknown) {
      const apiErrors = (err as { response?: { data?: Record<string, string[]> } })?.response?.data;
      if (apiErrors && typeof apiErrors === "object") {
        Object.entries(apiErrors).forEach(([field, messages]) => {
          const msg = Array.isArray(messages) ? messages[0] : String(messages);
          toast.error(`${field}: ${msg}`);
        });
      } else {
        toast.error("Error al registrar el pago");
      }
    } finally {
      setRegistering(false);
    }
  };

  const handleCorrectMethod = async () => {
    if (!editMethodTarget || !editValue) return;
    try {
      setActionLoading(true);
      await updatePayment(editMethodTarget.id, { payment_method: editValue as Payment["payment_method"] });
      toast.success("Método de pago corregido");
      setEditMethodTarget(null);
      fetchSummary({ year: summaryYear, month: summaryMonth });
    } catch {
      toast.error("Error al corregir el método");
    } finally {
      setActionLoading(false);
    }
  };

  const handleCorrectDate = async () => {
    if (!editDateTarget || !editValue) return;
    try {
      setActionLoading(true);
      await updatePayment(editDateTarget.id, { payment_date: editValue });
      toast.success("Fecha de pago corregida");
      setEditDateTarget(null);
      fetchSummary({ year: summaryYear, month: summaryMonth });
    } catch {
      toast.error("Error al corregir la fecha");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeletePayment = async () => {
    if (!deleteTarget) return;
    try {
      setActionLoading(true);
      await deletePayment(deleteTarget.id);
      toast.success("Pago revertido — el alumno vuelve a Sin pagar");
      setDeleteTarget(null);
      fetchPayments({ page: 1 });
      fetchOverdue();
      fetchSummary({ year: summaryYear, month: summaryMonth });
    } catch {
      toast.error("Error al revertir el pago");
    } finally {
      setActionLoading(false);
    }
  };

  // ── Acciones sobre inscripciones ─────────────────────────────────────────
  const [enrollmentActionLoading, setEnrollmentActionLoading] = useState(false);
  const [pauseTarget, setPauseTarget] = useState<Payment | null>(null);
  const [dropTarget, setDropTarget]   = useState<Payment | null>(null);

  const refreshAfterEnrollmentAction = async () => {
    await Promise.all([
      fetchOverdue({ month: summaryMonth, year: summaryYear }),
      fetchPayments({ page: 1, due_date__month: summaryMonth, due_date__year: summaryYear }),
      fetchSummary({ year: summaryYear, month: summaryMonth }),
    ]);
  };

  const handlePauseEnrollment = async () => {
    if (!pauseTarget) return;
    try {
      setEnrollmentActionLoading(true);
      await enrollmentsApi.update(pauseTarget.enrollment, { status: "paused" });
      toast.success(`${pauseTarget.client_name} pausado en ${pauseTarget.class_group_name}`);
      setPauseTarget(null);
      await refreshAfterEnrollmentAction();
    } catch {
      toast.error("Error al pausar la inscripción");
    } finally {
      setEnrollmentActionLoading(false);
    }
  };

  const handleDropEnrollment = async () => {
    if (!dropTarget) return;
    try {
      setEnrollmentActionLoading(true);
      await enrollmentsApi.update(dropTarget.enrollment, { status: "dropped" });
      toast.success(`${dropTarget.client_name} dado de baja de ${dropTarget.class_group_name}`);
      setDropTarget(null);
      await refreshAfterEnrollmentAction();
    } catch {
      toast.error("Error al dar de baja la inscripción");
    } finally {
      setEnrollmentActionLoading(false);
    }
  };

  const handleReactivateEnrollment = async (p: Payment) => {
    try {
      setEnrollmentActionLoading(true);
      await enrollmentsApi.update(p.enrollment, { status: "active" });
      toast.success(`${p.client_name} reactivado en ${p.class_group_name}`);
      await refreshAfterEnrollmentAction();
    } catch {
      toast.error("Error al reactivar la inscripción");
    } finally {
      setEnrollmentActionLoading(false);
    }
  };

  // Usar siempre overdueCount (viene del fetch filtrado por mes/año),
  // no summary.counts.unpaid que puede reflejar datos de períodos distintos.
  const unpaidCount = overdueCount;

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">

      {/* ── Header ── */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Pagos</h1>
          <p className="text-muted-foreground">Control de mensualidades</p>
        </div>
        <Button onClick={() => setRegisterOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Registrar pago
        </Button>
      </div>

      {/* ── Resumen del período ── */}
      <Card>
        <CardHeader className="pb-3 flex flex-row items-center justify-between gap-3">
          <CardTitle className="text-base flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
            Resumen mensual
          </CardTitle>
          <div className="flex items-center gap-2">
            <Select value={String(summaryMonth)} onValueChange={(v) => setSummaryMonth(Number(v))}>
              <SelectTrigger className="w-32 h-8 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MONTHS.map((m, i) => (
                  <SelectItem key={i + 1} value={String(i + 1)}>{m}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={String(summaryYear)} onValueChange={(v) => setSummaryYear(Number(v))}>
              <SelectTrigger className="w-24 h-8 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: now.getFullYear() - 2023 }, (_, i) => 2024 + i).map((y) => (
                  <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {!summary ? (
            <div className="flex justify-center py-4">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
              <div className="text-center p-3 rounded-lg bg-green-50">
                <p className="text-2xl font-bold text-green-700">{summary.counts.paid}</p>
                <p className="text-xs text-green-600 font-medium">Cobrados</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-red-50">
                <p className="text-2xl font-bold text-red-600">{overdueCount}</p>
                <p className="text-xs text-red-500 font-medium">Sin pagar</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-gray-50">
                <p className="text-2xl font-bold text-gray-600">{summary.counts.waived}</p>
                <p className="text-xs text-muted-foreground font-medium">Condonados</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-green-50">
                <p className="text-2xl font-bold text-green-700">
                  ${summary.amounts.collected.toLocaleString("es-MX")}
                </p>
                <p className="text-xs text-green-600 font-medium">Monto cobrado</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-red-50">
                <p className="text-2xl font-bold text-red-600">
                  ${overduePayments.reduce((sum, p) => sum + p.amount, 0).toLocaleString("es-MX")}
                </p>
                <p className="text-xs text-red-500 font-medium">Monto pendiente</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Tabs ── */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "all" | "unpaid")}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <TabsList>
            <TabsTrigger value="all">
              Todos
              {totalCount > 0 && (
                <span className="ml-1.5 text-xs text-muted-foreground">({totalCount})</span>
              )}
            </TabsTrigger>
            <TabsTrigger value="unpaid" className="gap-1.5">
              <AlertTriangle className="h-3.5 w-3.5 text-red-500" />
              Sin pagar
              {unpaidCount > 0 && (
                <span className="ml-0.5 text-xs text-red-600 font-semibold">
                  ({unpaidCount})
                </span>
              )}
            </TabsTrigger>
          </TabsList>

          {/* Filtros — siempre visibles, aplican a la tab activa */}
          <div className="flex gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar alumno..."
                className="pl-9 h-9 w-52"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Select value={methodFilter} onValueChange={setMethodFilter}>
              <SelectTrigger className="h-9 w-48">
                <SelectValue placeholder="Método" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los métodos</SelectItem>
                <SelectItem value="cash">Efectivo</SelectItem>
                <SelectItem value="card">Tarjeta</SelectItem>
                <SelectItem value="transfer">Transferencia</SelectItem>
                <SelectItem value="other">Otro</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* ── Tab: Todos ── */}
        <TabsContent value="all" className="mt-4">
          {isLoading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : payments.length === 0 ? (
            <div className="flex flex-col items-center py-16 gap-3 text-center">
              <CreditCard className="h-12 w-12 text-muted-foreground/30" />
              <p className="text-muted-foreground font-medium">
                {search || methodFilter !== "all"
                  ? "Sin resultados con esos filtros"
                  : "Aún no hay pagos registrados"}
              </p>
              {!search && methodFilter === "all" && (
                <Button variant="outline" onClick={() => setRegisterOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Registrar primer pago
                </Button>
              )}
            </div>
          ) : (
            <PaymentsTable
              payments={payments}
              onEditMethod={(p) => { setEditMethodTarget(p); setEditValue(p.payment_method); }}
              onEditDate={(p) => { setEditDateTarget(p); setEditValue(p.payment_date ?? ""); }}
              onDelete={(p) => setDeleteTarget(p)}
              onRegister={(p) => { setPreselectedEnrollment(paymentToUnpaid(p)); setRegisterOpen(true); }}
              onPause={(p) => setPauseTarget(p)}
              onDrop={(p) => setDropTarget(p)}
              onReactivate={handleReactivateEnrollment}
              enrollmentActionLoading={enrollmentActionLoading}
            />
          )}
        </TabsContent>

        {/* ── Tab: Sin pagar ── */}
        <TabsContent value="unpaid" className="mt-4">
          {overdueLoading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : overduePayments.length === 0 ? (
            <div className="flex flex-col items-center py-16 gap-3 text-center">
              <CheckCircle className="h-12 w-12 text-green-400" />
              <p className="text-muted-foreground font-medium">
                {search ? "Sin resultados con esos filtros" : "Todo al corriente — sin pagos pendientes"}
              </p>
            </div>
          ) : (
            <PaymentsTable
              payments={overduePayments}
              onRegister={(p) => { setPreselectedEnrollment(paymentToUnpaid(p)); setRegisterOpen(true); }}
              onPause={(p) => setPauseTarget(p)}
              onDrop={(p) => setDropTarget(p)}
              onReactivate={handleReactivateEnrollment}
              enrollmentActionLoading={enrollmentActionLoading}
            />
          )}
        </TabsContent>
      </Tabs>

      {/* ── Dialog: corregir método ── */}
      <Dialog open={!!editMethodTarget} onOpenChange={(o) => !o && setEditMethodTarget(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Corregir método de pago</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <p className="text-sm text-muted-foreground">
              Pago de <strong>{editMethodTarget?.client_name}</strong>
            </p>
            <div className="space-y-1.5">
              <Label>Método correcto</Label>
              <Select value={editValue} onValueChange={setEditValue}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Efectivo</SelectItem>
                  <SelectItem value="card">Tarjeta</SelectItem>
                  <SelectItem value="transfer">Transferencia</SelectItem>
                  <SelectItem value="other">Otro</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2 pt-1">
              <Button onClick={handleCorrectMethod} disabled={actionLoading} className="flex-1">
                {actionLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Guardar
              </Button>
              <Button variant="outline" onClick={() => setEditMethodTarget(null)} disabled={actionLoading}>
                Cancelar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Dialog: corregir fecha ── */}
      <Dialog open={!!editDateTarget} onOpenChange={(o) => !o && setEditDateTarget(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Corregir fecha de pago</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <p className="text-sm text-muted-foreground">
              Pago de <strong>{editDateTarget?.client_name}</strong>
            </p>
            <div className="space-y-1.5">
              <Label>Fecha correcta</Label>
              <DatePicker
                value={editValue}
                onChange={setEditValue}
                placeholder="dd/mm/yyyy"
              />
            </div>
            <div className="flex gap-2 pt-1">
              <Button onClick={handleCorrectDate} disabled={actionLoading || !editValue} className="flex-1">
                {actionLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Guardar
              </Button>
              <Button variant="outline" onClick={() => setEditDateTarget(null)} disabled={actionLoading}>
                Cancelar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Confirm: revertir pago ── */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Revertir este pago?</AlertDialogTitle>
            <AlertDialogDescription>
              Se eliminará el pago de <strong>{deleteTarget?.client_name}</strong> por{" "}
              <strong>${deleteTarget?.amount.toLocaleString("es-MX")}</strong>.
              El alumno volverá a aparecer en la lista de sin pagar.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={actionLoading}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeletePayment}
              disabled={actionLoading}
              className="bg-red-600 hover:bg-red-700"
            >
              {actionLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Revertir pago
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ── Confirm: dar de baja inscripción ── */}
      <AlertDialog open={!!dropTarget} onOpenChange={(o) => !o && setDropTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Dar de baja a {dropTarget?.client_name}?</AlertDialogTitle>
            <AlertDialogDescription>
              Se dará de baja la inscripción de <strong>{dropTarget?.client_name}</strong> en{" "}
              <strong>{dropTarget?.class_group_name}</strong>. El alumno dejará de aparecer como activo en ese grupo.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={enrollmentActionLoading}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDropEnrollment}
              disabled={enrollmentActionLoading}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {enrollmentActionLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Dar de baja
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ── Confirm: pausar inscripción ── */}
      <AlertDialog open={!!pauseTarget} onOpenChange={(o) => !o && setPauseTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Pausar a {pauseTarget?.client_name}?</AlertDialogTitle>
            <AlertDialogDescription>
              La inscripción de <strong>{pauseTarget?.client_name}</strong> en{" "}
              <strong>{pauseTarget?.class_group_name}</strong> quedará pausada.
              El alumno no generará cobros mientras esté pausado y podrá reactivarse cuando regrese.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={enrollmentActionLoading}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handlePauseEnrollment}
              disabled={enrollmentActionLoading}
              className="bg-yellow-500 text-white hover:bg-yellow-600"
            >
              {enrollmentActionLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Pausar alumno
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ── Modal registrar pago ── */}
      <Dialog open={registerOpen} onOpenChange={(o) => { setRegisterOpen(o); if (!o) setPreselectedEnrollment(undefined); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Registrar pago</DialogTitle>
          </DialogHeader>
          <RegisterPaymentForm
            onSubmit={handleRegister}
            onCancel={() => { setRegisterOpen(false); setPreselectedEnrollment(undefined); }}
            isLoading={registering}
            preselectedEnrollment={preselectedEnrollment}
          />
        </DialogContent>
      </Dialog>

    </div>
  );
}

// ── Tabla unificada ───────────────────────────────────────────────────────────

function PaymentsTable({
  payments,
  onEditMethod,
  onEditDate,
  onDelete,
  onRegister,
  onPause,
  onDrop,
  onReactivate,
  enrollmentActionLoading,
}: {
  payments: Payment[];
  onEditMethod?: (p: Payment) => void;
  onEditDate?: (p: Payment) => void;
  onDelete?: (p: Payment) => void;
  onRegister?: (p: Payment) => void;
  onPause?: (p: Payment) => void;
  onDrop?: (p: Payment) => void;
  onReactivate?: (p: Payment) => void;
  enrollmentActionLoading?: boolean;
}) {
  return (
    <Card>
      <CardContent className="p-0">
        <Table style={{ tableLayout: "fixed", width: "100%" }}>
          <colgroup>
            <col style={{ width: "16%" }} />
            <col style={{ width: "12%" }} />
            <col style={{ width: "18%" }} />
            <col style={{ width: "10%" }} />
            <col style={{ width: "12%" }} />
            <col style={{ width: "11%" }} />
            <col style={{ width: "8%" }} />
            <col style={{ width: "7%" }} />
            <col style={{ width: "6%" }} />
          </colgroup>
          <TableHeader>
            <TableRow>
              <TableHead>Alumno</TableHead>
              <TableHead>Teléfono</TableHead>
              <TableHead>Grupo</TableHead>
              <TableHead>Fecha pago</TableHead>
              <TableHead>Fecha vence</TableHead>
              <TableHead>Método</TableHead>
              <TableHead className="text-right">Monto</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {payments.map((p) => {
              const isOverdue = p.status === "overdue";
              const days = isOverdue ? overdueDays(p.due_date) : 0;
              return (
                <TableRow key={p.id} className={isOverdue ? "bg-red-50/40" : undefined}>
                  <TableCell className="font-medium truncate max-w-0">{p.client_name}</TableCell>
                  <TableCell className="text-sm text-muted-foreground tabular-nums">
                    {p.client_phone || "—"}
                  </TableCell>
                  <TableCell className="text-sm truncate max-w-0">{p.class_group_name}</TableCell>
                  <TableCell className="text-sm tabular-nums">
                    {p.payment_date ? formatDate(p.payment_date) : "—"}
                  </TableCell>
                  <TableCell className="text-sm tabular-nums">
                    {p.due_date ? (
                      isOverdue ? (
                        <span className="flex flex-col leading-tight">
                          <span className="font-medium text-red-600">{formatDate(p.due_date)}</span>
                          {days > 0 && (
                            <span className="text-xs text-red-400">hace {days} día{days !== 1 ? "s" : ""}</span>
                          )}
                        </span>
                      ) : formatDate(p.due_date)
                    ) : "—"}
                  </TableCell>
                  <TableCell className="text-sm">
                    {p.payment_method ? (METHOD_LABELS[p.payment_method] ?? p.payment_method) : "—"}
                  </TableCell>
                  <TableCell className="text-right font-semibold tabular-nums">
                    ${p.amount.toLocaleString("es-MX")}
                  </TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[p.status]}`}>
                      {STATUS_LABELS[p.status]}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    {isOverdue ? (
                      <div className="flex items-center justify-end gap-1">
                        {/* Botón cobrar solo si la inscripción sigue activa */}
                        {onRegister && p.enrollment_status === "active" && (
                          <Button size="sm" variant="outline" onClick={() => onRegister(p)}>
                            Cobrar
                          </Button>
                        )}
                        {/* Menú siempre visible para overdue — opciones según estado de inscripción */}
                        {(onPause || onDrop || onReactivate) && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8" disabled={enrollmentActionLoading}>
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              {p.enrollment_status === "active" && (
                                <>
                                  {onPause && (
                                    <DropdownMenuItem onClick={() => onPause(p)}>
                                      <Pause className="h-4 w-4 mr-2" />
                                      Pausar alumno
                                    </DropdownMenuItem>
                                  )}
                                  {onDrop && (
                                    <>
                                      <DropdownMenuSeparator />
                                      <DropdownMenuItem
                                        onClick={() => onDrop(p)}
                                        className="text-red-600 focus:text-red-600"
                                      >
                                        <UserX className="h-4 w-4 mr-2" />
                                        Dar de baja del grupo
                                      </DropdownMenuItem>
                                    </>
                                  )}
                                </>
                              )}
                              {p.enrollment_status === "paused" && onReactivate && (
                                <DropdownMenuItem onClick={() => onReactivate(p)}>
                                  <UserPlus className="h-4 w-4 mr-2" />
                                  Activar de nuevo
                                </DropdownMenuItem>
                              )}
                              {p.enrollment_status === "dropped" && onReactivate && (
                                <DropdownMenuItem onClick={() => onReactivate(p)}>
                                  <UserPlus className="h-4 w-4 mr-2" />
                                  Dar de alta
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </div>
                    ) : (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {onEditMethod && (
                            <DropdownMenuItem onClick={() => onEditMethod(p)}>
                              <Pencil className="h-4 w-4 mr-2" />
                              Corregir método
                            </DropdownMenuItem>
                          )}
                          {onEditDate && (
                            <DropdownMenuItem onClick={() => onEditDate(p)}>
                              <CalendarIcon className="h-4 w-4 mr-2" />
                              Corregir fecha
                            </DropdownMenuItem>
                          )}
                          {onDelete && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => onDelete(p)}
                                className="text-red-600 focus:text-red-600"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Revertir pago
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
