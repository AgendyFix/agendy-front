"use client";

// ============================================
// PAYMENTS PAGE - Control de pagos
// ============================================

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  CreditCard, Search, Loader2, AlertTriangle,
  TrendingUp, CheckCircle, Plus, Phone,
  MoreHorizontal, Pencil, Trash2, CalendarIcon,
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
  const [y, m, d] = date.split("-");
  return `${d}/${m}/${y}`;
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function PaymentsPage() {
  const router = useRouter();
  const now = new Date();
  const {
    payments, summary, isLoading, totalCount,
    fetchPayments, fetchSummary, createPayment, updatePayment, deletePayment,
  } = usePayments();

  const [search, setSearch] = useState("");
  const [methodFilter, setMethodFilter] = useState("all");
  const [summaryMonth, setSummaryMonth] = useState(now.getMonth() + 1);
  const [summaryYear] = useState(now.getFullYear());
  const [registerOpen, setRegisterOpen] = useState(false);
  const [registering, setRegistering] = useState(false);
  const [preselectedEnrollment, setPreselectedEnrollment] = useState<UnpaidEnrollment | undefined>();

  // Acciones de corrección
  const [editMethodTarget, setEditMethodTarget] = useState<Payment | null>(null);
  const [editDateTarget, setEditDateTarget] = useState<Payment | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Payment | null>(null);
  const [editValue, setEditValue] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const isFirstRender = useRef(true);

  useEffect(() => {
    fetchPayments({ page: 1 });
    fetchSummary({ year: summaryYear, month: summaryMonth });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    fetchSummary({ year: summaryYear, month: summaryMonth });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [summaryMonth]);

  // Solo corre cuando el usuario cambia filtros, no en el montaje inicial
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    const t = setTimeout(() => {
      fetchPayments({
        search: search || undefined,
        payment_method: methodFilter !== "all" ? (methodFilter as Payment["payment_method"]) : undefined,
        page: 1,
      });
    }, 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, methodFilter]);

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
      fetchPayments({ page: 1 });
      fetchSummary({ year: summaryYear, month: summaryMonth });
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
      fetchSummary({ year: summaryYear, month: summaryMonth });
    } catch {
      toast.error("Error al revertir el pago");
    } finally {
      setActionLoading(false);
    }
  };

  const unpaidList = summary?.unpaid_enrollments ?? [];
  const unpaidCount = summary?.counts.unpaid ?? 0;

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

      {/* ── Resumen del mes ── */}
      <Card>
        <CardHeader className="pb-3 flex flex-row items-center justify-between gap-3">
          <CardTitle className="text-base flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
            Resumen mensual
          </CardTitle>
          <Select value={String(summaryMonth)} onValueChange={(v) => setSummaryMonth(Number(v))}>
            <SelectTrigger className="w-36 h-8 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {MONTHS.map((m, i) => (
                <SelectItem key={i + 1} value={String(i + 1)}>
                  {m} {summaryYear}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
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
                <p className="text-2xl font-bold text-red-600">{summary.counts.unpaid}</p>
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
                  ${summary.amounts.pending.toLocaleString("es-MX")}
                </p>
                <p className="text-xs text-red-500 font-medium">Monto pendiente</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Tabs ── */}
      <Tabs defaultValue="all">
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

        {/* Tab: todos los pagos */}
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
            <PaidPaymentsTable
              payments={payments}
              onEditMethod={(p) => { setEditMethodTarget(p); setEditValue(p.payment_method); }}
              onEditDate={(p) => { setEditDateTarget(p); setEditValue(p.payment_date ?? ""); }}
              onDelete={(p) => setDeleteTarget(p)}
            />
          )}
        </TabsContent>

        {/* Tab: sin pagar */}
        <TabsContent value="unpaid" className="mt-4">
          {!summary ? (
            <div className="flex justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : unpaidList.length === 0 ? (
            <div className="flex flex-col items-center py-16 gap-3 text-center">
              <CheckCircle className="h-12 w-12 text-green-400" />
              <p className="text-muted-foreground font-medium">
                Todo al corriente — sin pagos pendientes
              </p>
            </div>
          ) : (
            <UnpaidTable
              enrollments={unpaidList}
              onRegister={(unpaidEnrollment) => {
                setPreselectedEnrollment(unpaidEnrollment);
                setRegisterOpen(true);
              }}
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

// ── Tabla de pagos realizados ─────────────────────────────────────────────────

function PaidPaymentsTable({
  payments,
  onEditMethod,
  onEditDate,
  onDelete,
}: {
  payments: Payment[];
  onEditMethod: (p: Payment) => void;
  onEditDate: (p: Payment) => void;
  onDelete: (p: Payment) => void;
}) {
  return (
    <Card>
      <CardContent className="p-0">
        <Table>
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
            {payments.map((p) => (
              <TableRow key={p.id}>
                <TableCell className="font-medium">{p.client_name}</TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {p.client_phone || "—"}
                </TableCell>
                <TableCell className="text-sm">{p.class_group_name}</TableCell>
                <TableCell className="text-sm tabular-nums">
                  {p.payment_date ? formatDate(p.payment_date) : "—"}
                </TableCell>
                <TableCell className="text-sm tabular-nums">
                  {p.due_date ? formatDate(p.due_date) : "—"}
                </TableCell>
                <TableCell className="text-sm">
                  {METHOD_LABELS[p.payment_method] ?? p.payment_method}
                </TableCell>
                <TableCell className="text-right font-semibold tabular-nums">
                  ${p.amount.toLocaleString("es-MX")}
                </TableCell>
                <TableCell>
                  <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[p.status]}`}>
                    {STATUS_LABELS[p.status]}
                  </span>
                </TableCell>
                {/* Menú de acciones */}
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => onEditMethod(p)}>
                        <Pencil className="h-4 w-4 mr-2" />
                        Corregir método
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onEditDate(p)}>
                        <CalendarIcon className="h-4 w-4 mr-2" />
                        Corregir fecha
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => onDelete(p)}
                        className="text-red-600 focus:text-red-600"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Revertir pago
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

// ── Tabla de alumnos sin pagar ────────────────────────────────────────────────

function UnpaidTable({
  enrollments,
  onRegister,
}: {
  enrollments: UnpaidEnrollment[];
  onRegister: (enrollment: UnpaidEnrollment) => void;
}) {
  return (
    <Card>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Alumno</TableHead>
              <TableHead>Teléfono</TableHead>
              <TableHead>Grupo</TableHead>
              <TableHead className="text-right">Mensualidad</TableHead>
              <TableHead className="text-right">Acción</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {enrollments.map((e) => (
              <TableRow key={e.enrollment_id}>
                <TableCell className="font-medium">{e.client_name}</TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Phone className="h-3 w-3" />
                    {e.client_phone || "—"}
                  </span>
                </TableCell>
                <TableCell className="text-sm">{e.class_group_name}</TableCell>
                <TableCell className="text-right font-semibold tabular-nums text-red-600">
                  ${e.monthly_fee.toLocaleString("es-MX")}
                </TableCell>
                <TableCell className="text-right">
                  <Button size="sm" variant="outline" onClick={() => onRegister(e)}>
                    Cobrar
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
