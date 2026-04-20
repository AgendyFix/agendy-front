"use client";

// ============================================
// NEW ENROLLMENT PAGE - Inscribir alumno
// ============================================

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, Loader2, ChevronsUpDown, Check, Clock, DollarSign } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { DatePicker } from "@/components/ui/date-picker";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Popover, PopoverContent, PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList,
} from "@/components/ui/command";
import { cn } from "@/lib/utils";
import { useEnrollments } from "@/lib/hooks/useEnrollments";
import { clientsApi } from "@/lib/api/clients";
import { classGroupsApi } from "@/lib/api/classGroups";
import { enrollmentsApi } from "@/lib/api/enrollments";
import { DisciplineMultiSelect } from "@/components/disciplines/DisciplineMultiSelect";
import type { Client, ClassGroup } from "@/lib/types/models";

// ── Schema ────────────────────────────────────────────────────────────────────

const schema = z.object({
  mode:               z.enum(["group", "individual"]),
  client:             z.string().min(1, "Selecciona un alumno"),
  // group mode
  class_group:        z.string().optional(),
  // individual mode
  ind_monthly_fee:    z.string().optional(),
  // common
  start_date:         z.string().min(1, "Selecciona la fecha de inicio"),
  custom_billing_day: z.string().optional(),
  custom_monthly_fee: z.string().optional(), // precio especial en modo grupo
  signup_fee:         z.string().optional(),
  notes:              z.string().optional(),
}).superRefine((val, ctx) => {
  if (val.mode === "group" && !val.class_group) {
    ctx.addIssue({ code: "custom", path: ["class_group"], message: "Selecciona un grupo" });
  }
  if (val.mode === "individual" && (!val.ind_monthly_fee || isNaN(Number(val.ind_monthly_fee)))) {
    ctx.addIssue({ code: "custom", path: ["ind_monthly_fee"], message: "La mensualidad es requerida" });
  }
});

type FormValues = z.infer<typeof schema>;

// ── Component ─────────────────────────────────────────────────────────────────

export default function NewEnrollmentPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedGroupId   = searchParams.get("class_group") ?? "";
  const preselectedClientId  = searchParams.get("client") ?? "";

  const { createEnrollment, isLoading } = useEnrollments();

  const [clients, setClients]                     = useState<Client[]>([]);
  const [groups, setGroups]                       = useState<ClassGroup[]>([]);
  const [loadingClients, setLoadingClients]       = useState(false);
  const [loadingGroups, setLoadingGroups]         = useState(false);
  const [clientOpen, setClientOpen]               = useState(false);
  const [preselectedGroup, setPreselectedGroup]   = useState<ClassGroup | null>(null);
  const [preselectedClient, setPreselectedClient] = useState<Client | null>(null);
  const [disciplines, setDisciplines]             = useState<string[]>([]);

  // IDs de alumnos ya inscritos en el grupo seleccionado
  const [enrolledClientIds, setEnrolledClientIds] = useState<Set<string>>(new Set());
  // IDs de grupos donde ya está inscrito el cliente seleccionado
  const [enrolledGroupIds, setEnrolledGroupIds]   = useState<Set<string>>(new Set());

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      mode:               preselectedGroupId ? "group" : "group",
      client:             preselectedClientId,
      class_group:        preselectedGroupId,
      ind_monthly_fee:    "",
      start_date:         new Date().toISOString().slice(0, 10),
      custom_billing_day: "",
      custom_monthly_fee: "",
      signup_fee:         "",
      notes:              "",
    },
  });

  const mode             = form.watch("mode");
  const selectedClientId = form.watch("client");
  const selectedGroupId  = form.watch("class_group") ?? "";
  const selectedClient   = clients.find((c) => c.id === selectedClientId) ?? preselectedClient;
  const selectedGroup    = groups.find((g) => g.id === selectedGroupId) ?? preselectedGroup;

  // Cargar grupos
  useEffect(() => {
    const load = async () => {
      try {
        setLoadingGroups(true);
        const response = await classGroupsApi.getAll({ limit: 100 });
        setGroups(response.results);
        if (preselectedGroupId) {
          const found = response.results.find((g) => g.id === preselectedGroupId);
          if (found) setPreselectedGroup(found);
        }
      } catch {
        toast.error("No se pudieron cargar los grupos");
      } finally {
        setLoadingGroups(false);
      }
    };
    load();
  }, [preselectedGroupId]);

  // Cargar clientes
  useEffect(() => {
    const load = async () => {
      try {
        setLoadingClients(true);
        const response = await clientsApi.getAll({ limit: 100 });
        setClients(response.results);
        if (preselectedClientId) {
          const found = response.results.find((c) => c.id === preselectedClientId);
          if (found) setPreselectedClient(found);
        }
      } catch {
        // no bloqueante
      } finally {
        setLoadingClients(false);
      }
    };
    load();
  }, [preselectedClientId]);

  // Cuando cambia el grupo seleccionado, cargar inscripciones activas del grupo
  useEffect(() => {
    const groupId = selectedGroupId || preselectedGroupId;
    if (!groupId) { setEnrolledClientIds(new Set()); return; }
    enrollmentsApi.getAll({ class_group: groupId, limit: 200 }).then((res) => {
      const ids = new Set(
        res.results
          .filter((e) => e.status === "active" || e.status === "paused")
          .map((e) => e.client)
      );
      setEnrolledClientIds(ids);
    }).catch(() => {});
  }, [selectedGroupId, preselectedGroupId]);

  // Cuando cambia el cliente seleccionado, cargar sus inscripciones activas
  useEffect(() => {
    const clientId = selectedClientId || preselectedClientId;
    if (!clientId) { setEnrolledGroupIds(new Set()); return; }
    enrollmentsApi.getAll({ client: clientId, limit: 200 }).then((res) => {
      const ids = new Set(
        res.results
          .filter((e) => e.status === "active" || e.status === "paused")
          .map((e) => e.class_group)
      );
      setEnrolledGroupIds(ids);
    }).catch(() => {});
  }, [selectedClientId, preselectedClientId]);

  const handleSubmit = async (values: FormValues) => {
    try {
      let classGroupId = values.class_group ?? "";

      if (values.mode === "individual") {
        // ── Flujo individual: crear ClassGroup primero, luego Enrollment ──
        // Obtener el nombre del cliente seleccionado para el nombre del grupo
        const client = clients.find((c) => c.id === values.client) ?? preselectedClient;
        const clientName = client?.full_name ?? "Alumno";
        const group = await classGroupsApi.create({
          name:         `Clase individual - ${clientName}`,
          is_individual: true,
          monthly_fee:  null,
          disciplines:  disciplines.length > 0 ? disciplines : undefined,
        });
        classGroupId = group.id;
      } else {
        // ── Flujo grupal: validar duplicados ──
        if (enrolledClientIds.has(values.client)) {
          toast.error("Este alumno ya está inscrito en el grupo seleccionado");
          return;
        }
        if (enrolledGroupIds.has(classGroupId)) {
          toast.error("El alumno ya está inscrito en este grupo");
          return;
        }
      }

      await createEnrollment({
        client:             values.client,
        class_group:        classGroupId,
        start_date:         values.start_date,
        custom_billing_day: values.custom_billing_day ? Number(values.custom_billing_day) : undefined,
        custom_monthly_fee: values.mode === "individual"
          ? (values.ind_monthly_fee ? Number(values.ind_monthly_fee) : undefined)
          : (values.custom_monthly_fee ? Number(values.custom_monthly_fee) : undefined),
        signup_fee:         values.signup_fee ? Number(values.signup_fee) : null,
        disciplines:        disciplines.length > 0 ? disciplines : undefined,
        notes:              values.notes || undefined,
      });

      toast.success("Alumno inscrito exitosamente");
      if (preselectedClientId) {
        router.push(`/clients/${preselectedClientId}`);
      } else if (preselectedGroupId) {
        router.push(`/class-groups/${preselectedGroupId}`);
      } else {
        router.push("/clients");
      }
    } catch (err: unknown) {
      const apiErrors = (err as { response?: { data?: Record<string, unknown> } })?.response?.data;
      if (apiErrors && typeof apiErrors === "object") {
        const nonField = apiErrors.non_field_errors;
        if (nonField) {
          toast.error("Este alumno ya está inscrito en este grupo");
          return;
        }
        Object.entries(apiErrors).forEach(([field, messages]) => {
          const msg = Array.isArray(messages) ? messages[0] : String(messages);
          toast.error(`${field}: ${msg}`);
        });
      } else {
        toast.error("Error al inscribir al alumno");
      }
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">

      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Inscribir alumno</h1>
          <p className="text-muted-foreground text-sm">
            {preselectedGroup
              ? `Grupo: ${preselectedGroup.name}`
              : preselectedClient
              ? `Alumno: ${preselectedClient.full_name}`
              : "Selecciona el alumno y el grupo"}
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Datos de la inscripción</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-5">

              {/* ── Tipo de clase ── */}
              {!preselectedGroupId && (
                <FormField
                  control={form.control}
                  name="mode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipo de clase</FormLabel>
                      <div className="grid grid-cols-2 gap-2">
                        {([
                          { value: "group",      label: "Grupo colectivo", desc: "Se une a un grupo existente" },
                          { value: "individual", label: "Clase individual", desc: "Crea su propio grupo" },
                        ] as const).map((opt) => (
                          <button
                            key={opt.value}
                            type="button"
                            onClick={() => field.onChange(opt.value)}
                            className={`rounded-lg border p-3 text-left transition-colors ${
                              field.value === opt.value
                                ? "border-primary bg-primary/5 ring-1 ring-primary"
                                : "border-input hover:bg-muted/50"
                            }`}
                          >
                            <p className="text-sm font-medium">{opt.label}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">{opt.desc}</p>
                          </button>
                        ))}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {/* ── Selector de alumno (Combobox) ── */}
              <FormField
                control={form.control}
                name="client"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Alumno *</FormLabel>
                    <Popover open={clientOpen} onOpenChange={setClientOpen}>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            role="combobox"
                            disabled={loadingClients || !!preselectedClientId}
                            className={cn(
                              "w-full justify-between font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {loadingClients ? (
                              <span className="flex items-center gap-2">
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Cargando...
                              </span>
                            ) : selectedClient ? (
                              <span className="flex items-center gap-2">
                                <span className="font-medium">{selectedClient.full_name}</span>
                                {(selectedClient.primary_contact_phone ?? selectedClient.phone) && (
                                  <span className="text-muted-foreground text-xs">
                                    {selectedClient.primary_contact_phone ?? selectedClient.phone}
                                  </span>
                                )}
                              </span>
                            ) : (
                              "Buscar alumno..."
                            )}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-full p-0" align="start">
                        <Command>
                          <CommandInput placeholder="Buscar por nombre o teléfono..." />
                          <CommandList>
                            <CommandEmpty>Sin resultados</CommandEmpty>
                            <CommandGroup>
                              {clients.map((c) => {
                                const isEnrolled = enrolledClientIds.has(c.id);
                                return (
                                  <CommandItem
                                    key={c.id}
                                    value={`${c.full_name} ${c.primary_contact_phone ?? c.phone ?? ""}`}
                                    disabled={isEnrolled}
                                    onSelect={() => {
                                      if (isEnrolled) return;
                                      field.onChange(c.id);
                                      setClientOpen(false);
                                    }}
                                    className={cn(isEnrolled && "opacity-50 cursor-not-allowed")}
                                  >
                                    <Check
                                      className={cn(
                                        "mr-2 h-4 w-4",
                                        field.value === c.id ? "opacity-100" : "opacity-0"
                                      )}
                                    />
                                    <div className="flex flex-col flex-1">
                                      <span className="font-medium">{c.full_name}</span>
                                      {(c.primary_contact_phone ?? c.phone) && (
                                        <span className="text-xs text-muted-foreground">{c.primary_contact_phone ?? c.phone}</span>
                                      )}
                                    </div>
                                    {isEnrolled && (
                                      <span className="text-xs text-muted-foreground ml-2 shrink-0">
                                        Ya inscrito
                                      </span>
                                    )}
                                  </CommandItem>
                                );
                              })}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* ── Modo grupo: selector de grupo + info ── */}
              {mode === "group" && (
                <>
                  <FormField
                    control={form.control}
                    name="class_group"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Grupo *</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value ?? ""}
                          disabled={loadingGroups || !!preselectedGroupId}
                        >
                          <FormControl>
                            <SelectTrigger>
                              {loadingGroups ? (
                                <span className="flex items-center gap-2 text-muted-foreground">
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                  Cargando grupos...
                                </span>
                              ) : (
                                <SelectValue placeholder="Seleccionar grupo" />
                              )}
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {groups.filter((g) => !g.is_individual).map((g) => {
                              const isEnrolled = enrolledGroupIds.has(g.id);
                              return (
                                <SelectItem
                                  key={g.id}
                                  value={g.id}
                                  disabled={isEnrolled}
                                  className={cn(isEnrolled && "opacity-50")}
                                >
                                  <div className="flex flex-col">
                                    <span>
                                      {g.name}
                                      {isEnrolled && <span className="ml-2 text-xs text-muted-foreground">· Ya inscrito</span>}
                                    </span>
                                    <span className="text-xs text-muted-foreground">
                                      {g.level_display}{g.monthly_fee != null ? ` · $${g.monthly_fee.toLocaleString("es-MX")}/mes` : ""}
                                    </span>
                                  </div>
                                </SelectItem>
                              );
                            })}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {selectedGroup && (
                    <div className="rounded-lg border bg-muted/30 p-3 space-y-1.5 text-sm">
                      {selectedGroup.schedule_display && (
                        <div className="flex items-center gap-2 text-muted-foreground text-xs">
                          <Clock className="h-3.5 w-3.5 shrink-0" />
                          <span>{selectedGroup.schedule_display}</span>
                        </div>
                      )}
                      {selectedGroup.monthly_fee != null && (
                        <div className="flex items-center gap-1.5 text-xs font-semibold text-green-700">
                          <DollarSign className="h-3.5 w-3.5" />
                          <span>${selectedGroup.monthly_fee.toLocaleString("es-MX")}/mes</span>
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}

              {/* ── Modo individual: mensualidad requerida ── */}
              {mode === "individual" && (
                <FormField
                  control={form.control}
                  name="ind_monthly_fee"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Mensualidad *</FormLabel>
                      <FormControl>
                        <Input type="number" min={0} step={50} placeholder="1200" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {/* ── Disciplinas ── */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium leading-none">
                  Disciplinas <span className="text-muted-foreground font-normal">(opcional)</span>
                </label>
                <DisciplineMultiSelect
                  value={disciplines}
                  onChange={setDisciplines}
                  disabled={isLoading}
                />
              </div>

              {/* ── Fecha de inicio ── */}
              <FormField
                control={form.control}
                name="start_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fecha de inicio *</FormLabel>
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

              {/* ── Opciones: día de pago + precio especial (grupo) + inscripción ── */}
              <div className="grid gap-3 grid-cols-3">
                <FormField
                  control={form.control}
                  name="custom_billing_day"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Día de pago <span className="text-muted-foreground font-normal text-xs">(1-28)</span></FormLabel>
                      <FormControl>
                        <Input type="number" min={1} max={28} placeholder="Ej: 15" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {mode === "group" && (
                  <FormField
                    control={form.control}
                    name="custom_monthly_fee"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Precio especial <span className="text-muted-foreground font-normal text-xs">(opc.)</span></FormLabel>
                        <FormControl>
                          <Input
                            type="number" min={0}
                            placeholder={selectedGroup?.monthly_fee != null ? String(selectedGroup.monthly_fee) : "Del grupo"}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
                <FormField
                  control={form.control}
                  name="signup_fee"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Inscripción <span className="text-muted-foreground font-normal text-xs">(opc.)</span></FormLabel>
                      <FormControl>
                        <Input type="number" min={0} placeholder="0" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* ── Notas ── */}
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notas internas</FormLabel>
                    <FormControl>
                      <Input placeholder="Ej: Viene referida por otra alumna..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* ── Acciones ── */}
              <div className="flex gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                  disabled={isLoading}
                  className="flex-1"
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={isLoading} className="flex-1">
                  {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Inscribir alumno
                </Button>
              </div>

            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
