"use client";

// ============================================
// REGISTER PAYMENT FORM
// ============================================

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, ChevronsUpDown, Check } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { DatePicker } from "@/components/ui/date-picker";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover, PopoverContent, PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command, CommandEmpty, CommandGroup,
  CommandInput, CommandItem, CommandList,
} from "@/components/ui/command";
import { cn } from "@/lib/utils";
import { todayLocalISO } from "@/lib/dates";
import { enrollmentsApi, type BillingStatus } from "@/lib/api/enrollments";
import type { Enrollment, Payment, UnpaidEnrollment } from "@/lib/types/models";

// ── Schema ────────────────────────────────────────────────────────────────────

const schema = z.object({
  enrollment:     z.string().min(1, "Selecciona un alumno"),
  payment_method: z.enum(["cash", "card", "transfer", "other"]),
  payment_date:   z.string().min(1, "Selecciona la fecha"),
  amount_paid:    z.string().min(1, "Ingresa el monto").refine((v) => {
    const n = parseFloat(v);
    return Number.isFinite(n) && n > 0;
  }, "El monto debe ser mayor a 0"),
});

type FormValues = z.infer<typeof schema>;

// ── Props ─────────────────────────────────────────────────────────────────────

interface RegisterPaymentFormProps {
  onSubmit: (data: {
    enrollment: string;
    payment_method: Payment["payment_method"];
    payment_date: string;
    amount_paid: number;
  }) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
  /** Si viene de "Cobrar", el objeto completo ya está disponible — sin fetch extra */
  preselectedEnrollment?: UnpaidEnrollment;
  /** Filtra inscripciones activas de un cliente específico */
  clientFilter?: string;
}

// ── Component ─────────────────────────────────────────────────────────────────

export function RegisterPaymentForm({
  onSubmit,
  onCancel,
  isLoading = false,
  preselectedEnrollment,
  clientFilter,
}: RegisterPaymentFormProps) {
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loadingEnrollments, setLoadingEnrollments] = useState(false);
  const [comboOpen, setComboOpen] = useState(false);
  const [billing, setBilling] = useState<BillingStatus | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      enrollment:     preselectedEnrollment?.enrollment_id ?? "",
      payment_method: "cash",
      payment_date:   todayLocalISO(),
      // El monto se prellena con el saldo del periodo (billing-status)
      amount_paid:    "",
    },
  });

  // Cargar inscripciones activas (solo si no hay preseleccionado).
  // Se ocultan las de mensualidad $0 (becados / incluidos en el pago de un
  // familiar): no son cobrables.
  useEffect(() => {
    if (preselectedEnrollment) return;
    const load = async () => {
      try {
        setLoadingEnrollments(true);
        const response = await enrollmentsApi.getAll({
          status: "active",
          limit: 100,
          ...(clientFilter ? { client: clientFilter } : {}),
        });
        setEnrollments(response.results.filter((e) => (e.monthly_fee ?? 0) > 0));
      } catch {
        // no bloqueante
      } finally {
        setLoadingEnrollments(false);
      }
    };
    load();
  }, [preselectedEnrollment, clientFilter]);

  const selectedId         = form.watch("enrollment");
  const amountPaidRaw      = form.watch("amount_paid");
  const selectedEnrollment = enrollments.find((e) => e.id === selectedId) ?? null;

  // Monto total de la mensualidad
  const monthlyFee =
    billing?.monthly_fee ??
    preselectedEnrollment?.monthly_fee ??
    selectedEnrollment?.monthly_fee ??
    null;

  // Al elegir inscripción: consultar a qué periodo se aplicará el cobro
  // y prellenar el monto con el saldo real de ese periodo.
  useEffect(() => {
    // Limpiar de inmediato (billing + monto) al cambiar de inscripción: si el
    // fetch de abajo falla o devuelve balance<=0, nunca debe quedar visible
    // el monto/saldo de la inscripción ANTERIOR (riesgo: cobrar de más o al
    // alumno equivocado). resetField también limpia el estado "dirty".
    setBilling(null);
    if (!selectedId) return;
    form.resetField("amount_paid", { defaultValue: "" });

    let cancelled = false;
    enrollmentsApi
      .getBillingStatus(selectedId)
      .then((status) => {
        if (cancelled) return;
        setBilling(status);
        // No pisar lo que el usuario ya tecleó mientras el fetch estaba en
        // curso (p.ej. si el fetch llega tarde tras que el usuario escribió).
        if (status.balance > 0 && !form.getFieldState("amount_paid").isDirty) {
          form.setValue("amount_paid", String(status.balance));
        }
      })
      .catch(() => {
        if (!cancelled) setBilling(null); // sin status: sin tope automático (ver handleSubmit)
      });
    return () => {
      cancelled = true;
    };
  }, [selectedId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Tope de cobro del periodo: el saldo (o la mensualidad si no hay status)
  const periodCap = billing?.balance ?? monthlyFee ?? null;

  const amountPaidNum = amountPaidRaw ? parseFloat(amountPaidRaw) : null;
  // Solo mostrar feedback con un monto válido (> 0); con un valor inválido
  // el único mensaje visible es el error del campo.
  const validAmount = amountPaidNum !== null && Number.isFinite(amountPaidNum) && amountPaidNum > 0;
  const isParcial = validAmount && periodCap !== null && amountPaidNum < periodCap;
  const isComplete = validAmount && periodCap !== null && amountPaidNum >= periodCap;
  const excedeSaldo = validAmount && periodCap !== null && amountPaidNum > periodCap;
  const balance   = isParcial && periodCap !== null && amountPaidNum !== null
    ? periodCap - amountPaidNum
    : null;

  const handleSubmit = async (values: FormValues) => {
    const amount = parseFloat(values.amount_paid);
    // Sin billing-status no hay tope confiable del lado del cliente: mejor
    // avisar y no enviar a ciegas (el backend igual rechaza sobrepagos, pero
    // esto da mejor feedback en vez de fallar en silencio).
    if (!billing) {
      toast.error("No se pudo verificar el saldo del periodo. Intenta de nuevo.");
      return;
    }
    // El cobro nunca excede el saldo del periodo; el excedente se registra
    // como un cobro aparte (caerá como adelanto del siguiente mes).
    if (amount > billing.balance) {
      form.setError("amount_paid", {
        message: `El saldo de ${billing.period_label} es $${billing.balance.toLocaleString("es-MX")}. Registra el excedente como un cobro aparte.`,
      });
      return;
    }
    await onSubmit({
      enrollment:     values.enrollment,
      payment_method: values.payment_method,
      payment_date:   values.payment_date,
      amount_paid:    amount,
    });
  };

  return (
    <Form {...form}>
      <form noValidate onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">

        {/* ── Alumno ── */}
        {preselectedEnrollment ? (
          /* Tarjeta fija cuando viene de "Cobrar" */
          <>
            <input type="hidden" {...form.register("enrollment")} />
            <div className="rounded-lg border bg-muted/30 p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0 font-semibold text-primary text-sm">
                {preselectedEnrollment.client_name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm">{preselectedEnrollment.client_name}</p>
                <p className="text-xs text-muted-foreground truncate">{preselectedEnrollment.class_group_name}</p>
              </div>
              <p className="font-bold text-green-700 shrink-0">
                ${preselectedEnrollment.monthly_fee.toLocaleString("es-MX")}
              </p>
            </div>
          </>
        ) : (
          /* Combobox de búsqueda */
          <FormField
            control={form.control}
            name="enrollment"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>{clientFilter ? "Grupo / Clase *" : "Alumno *"}</FormLabel>
                <Popover open={comboOpen} onOpenChange={setComboOpen} modal={true}>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        role="combobox"
                        disabled={loadingEnrollments}
                        className={cn(
                          "w-full justify-between font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        {loadingEnrollments ? (
                          <span className="flex items-center gap-2">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Cargando...
                          </span>
                        ) : selectedEnrollment ? (
                          <span className="flex items-center gap-2 min-w-0">
                            <span className="font-medium truncate">
                              {clientFilter
                                ? selectedEnrollment.class_group_name
                                : selectedEnrollment.client_name}
                            </span>
                            <span className="text-muted-foreground text-xs truncate">
                              {clientFilter
                                ? `$${selectedEnrollment.monthly_fee.toLocaleString("es-MX")}/mes`
                                : selectedEnrollment.class_group_name}
                            </span>
                          </span>
                        ) : (
                          clientFilter ? "Seleccionar grupo..." : "Buscar alumno..."
                        )}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent
                    className="p-0"
                    style={{ width: "var(--radix-popover-trigger-width)" }}
                    align="start"
                  >
                    <Command>
                      <CommandInput placeholder={clientFilter ? "Buscar grupo..." : "Buscar por nombre o grupo..."} />
                      <CommandList style={{ maxHeight: "200px", overflowY: "auto" }}>
                        <CommandEmpty>Sin resultados</CommandEmpty>
                        <CommandGroup>
                          {enrollments.map((e) => (
                            <CommandItem
                              key={e.id}
                              value={clientFilter
                                ? e.class_group_name
                                : `${e.client_name} ${e.class_group_name}`}
                              onSelect={() => {
                                field.onChange(e.id);
                                setComboOpen(false);
                              }}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4 shrink-0",
                                  field.value === e.id ? "opacity-100" : "opacity-0"
                                )}
                              />
                              <div className="flex flex-col min-w-0">
                                {clientFilter ? (
                                  <>
                                    <span className="font-medium">{e.class_group_name}</span>
                                    <span className="text-xs text-muted-foreground">
                                      ${e.monthly_fee.toLocaleString("es-MX")}/mes
                                    </span>
                                  </>
                                ) : (
                                  <>
                                    <span className="font-medium">{e.client_name}</span>
                                    <span className="text-xs text-muted-foreground">
                                      {e.class_group_name} · ${e.monthly_fee.toLocaleString("es-MX")}/mes
                                    </span>
                                  </>
                                )}
                              </div>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        {/* ── Periodo al que se aplicará el cobro ── */}
        {billing && billing.balance > 0 && (
          <div
            className={cn(
              "rounded-md border px-3 py-2 text-xs font-medium",
              billing.mode === "liquidar" && "border-orange-200 bg-orange-50 text-orange-700",
              billing.mode === "nuevo" && "border-border bg-muted/40 text-muted-foreground",
              billing.mode === "adelanto" && "border-blue-200 bg-blue-50 text-blue-700",
            )}
          >
            {billing.mode === "liquidar" && (
              <>Liquidando <span className="capitalize">{billing.period_label}</span> — saldo pendiente: ${billing.balance.toLocaleString("es-MX")}</>
            )}
            {billing.mode === "nuevo" && (
              <>Mensualidad de <span className="capitalize">{billing.period_label}</span></>
            )}
            {billing.mode === "adelanto" && (
              <>Adelanto — mensualidad de <span className="capitalize">{billing.period_label}</span> (el mes actual ya está cubierto)</>
            )}
          </div>
        )}

        {/* ── Monto pagado (opcional — vacío = pago completo) ── */}
        <FormField
          control={form.control}
          name="amount_paid"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Monto recibido{" "}
                {monthlyFee && (
                  <span className="text-muted-foreground font-normal text-xs">
                    (mensualidad: ${monthlyFee.toLocaleString("es-MX")})
                  </span>
                )}
              </FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min={1}
                  step={1}
                  placeholder="Ej: 1200"
                  {...field}
                />
              </FormControl>
              {/* Feedback reactivo */}
              {isComplete && !excedeSaldo && (
                <p className="text-xs text-green-600 font-medium mt-1">
                  {billing?.mode === "liquidar"
                    ? <>✓ Liquida <span className="capitalize">{billing.period_label}</span></>
                    : "✓ Pago completo"}
                </p>
              )}
              {isParcial && balance !== null && (
                <p className="text-xs text-orange-600 font-medium mt-1">
                  Abono parcial — quedará saldo: ${balance.toLocaleString("es-MX")}
                </p>
              )}
              {excedeSaldo && periodCap !== null && (
                <p className="text-xs text-red-600 font-medium mt-1">
                  El monto excede el saldo del periodo (${periodCap.toLocaleString("es-MX")}). El excedente se registra aparte.
                </p>
              )}
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          {/* Método de pago */}
          <FormField
            control={form.control}
            name="payment_method"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Método *</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="cash">Efectivo</SelectItem>
                    <SelectItem value="card">Tarjeta</SelectItem>
                    <SelectItem value="transfer">Transferencia</SelectItem>
                    <SelectItem value="other">Otro</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Fecha de pago */}
          <FormField
            control={form.control}
            name="payment_date"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Fecha *</FormLabel>
                <FormControl>
                  <DatePicker
                    value={field.value}
                    onChange={field.onChange}
                    placeholder="dd/mm/yyyy"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Acciones */}
        <div className="flex gap-3 pt-1">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isLoading}
            className="flex-1"
          >
            Cancelar
          </Button>
          <Button type="submit" disabled={isLoading} className="flex-1">
            {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {isParcial ? "Registrar abono" : "Registrar pago"}
          </Button>
        </div>

      </form>
    </Form>
  );
}
