"use client";

// ============================================
// REGISTER PAYMENT FORM
// ============================================

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, ChevronsUpDown, Check } from "lucide-react";

import { Button } from "@/components/ui/button";
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
import { enrollmentsApi } from "@/lib/api/enrollments";
import type { Enrollment, Payment, UnpaidEnrollment } from "@/lib/types/models";

// ── Schema ────────────────────────────────────────────────────────────────────

const schema = z.object({
  enrollment: z.string().min(1, "Selecciona un alumno"),
  payment_method: z.enum(["cash", "card", "transfer", "other"]),
  payment_date: z.string().min(1, "Selecciona la fecha"),
});

type FormValues = z.infer<typeof schema>;

// ── Props ─────────────────────────────────────────────────────────────────────

interface RegisterPaymentFormProps {
  onSubmit: (data: {
    enrollment: string;
    payment_method: Payment["payment_method"];
    payment_date: string;
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

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      enrollment: preselectedEnrollment?.enrollment_id ?? "",
      payment_method: "cash",
      payment_date: new Date().toISOString().slice(0, 10),
    },
  });

  // Cargar inscripciones activas (solo si no hay preseleccionado)
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
        setEnrollments(response.results);
      } catch {
        // no bloqueante
      } finally {
        setLoadingEnrollments(false);
      }
    };
    load();
  }, [preselectedEnrollment, clientFilter]);

  const selectedId = form.watch("enrollment");
  const selectedEnrollment = enrollments.find((e) => e.id === selectedId) ?? null;

  const handleSubmit = async (values: FormValues) => {
    await onSubmit({
      enrollment: values.enrollment,
      payment_method: values.payment_method,
      payment_date: values.payment_date,
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">

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
            Registrar pago
          </Button>
        </div>

      </form>
    </Form>
  );
}
