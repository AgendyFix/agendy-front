"use client";

// ============================================
// CLASS GROUP FORM - Crear / Editar grupo
// ============================================

import { useEffect, useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Trash2, Loader2, UserX, Check, ChevronsUpDown } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import type { ClassGroup, Client, Employee } from "@/lib/types/models";
import type { CreateClassGroupRequest } from "@/lib/types/api";
import { employeesApi } from "@/lib/api/employees";
import { clientsApi } from "@/lib/api/clients";
import { enrollmentsApi } from "@/lib/api/enrollments";
import { DisciplineMultiSelect } from "@/components/disciplines/DisciplineMultiSelect";
import { DatePicker } from "@/components/ui/date-picker";

// ── Schemas ────────────────────────────────────────────────────────────────

const scheduleSchema = z.object({
  day_of_week: z.number().min(0).max(6),
  start_time:  z.string().min(1, "Requerido"),
  end_time:    z.string().min(1, "Requerido"),
});

// Schema para grupo colectivo
const collectiveSchema = z.object({
  is_individual: z.literal(false),
  name:          z.string().min(2, "Mínimo 2 caracteres").max(120, "Máximo 120 caracteres"),
  level:         z.enum(["all", "beginner", "intermediate", "advanced"]),
  monthly_fee:   z.number().min(0, "Debe ser mayor o igual a 0"),
  instructor:    z.string().optional(),
  disciplines:   z.array(z.string()),
  schedules:     z.array(scheduleSchema),
});

// Schema para clase individual
const individualSchema = z.object({
  is_individual:  z.literal(true),
  client:         z.string().min(1, "Selecciona un alumno"),
  monthly_fee:    z.number().min(1, "Ingresa la mensualidad"),
  billing_day:    z.string().optional(),
  start_date:     z.string().min(1, "Selecciona la fecha de inicio"),
  instructor:     z.string().optional(),
  disciplines:    z.array(z.string()),
});

const classGroupSchema = z.discriminatedUnion("is_individual", [
  collectiveSchema,
  individualSchema,
]);

type CollectiveValues  = z.infer<typeof collectiveSchema>;
type IndividualValues  = z.infer<typeof individualSchema>;
type ClassGroupFormValues = CollectiveValues | IndividualValues;

// ── Constants ──────────────────────────────────────────────────────────────

const LEVELS = [
  { value: "all",          label: "Todos los niveles" },
  { value: "beginner",     label: "Principiante" },
  { value: "intermediate", label: "Intermedio" },
  { value: "advanced",     label: "Avanzado" },
];

const DAYS = [
  { value: 0, label: "Lunes" },
  { value: 1, label: "Martes" },
  { value: 2, label: "Miércoles" },
  { value: 3, label: "Jueves" },
  { value: 4, label: "Viernes" },
  { value: 5, label: "Sábado" },
  { value: 6, label: "Domingo" },
];

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

// ── Props ──────────────────────────────────────────────────────────────────

interface ClassGroupFormProps {
  /** Grupo existente cuando se edita */
  initialData?: ClassGroup;
  /** UUID del alumno cuando se llega desde la ficha del alumno */
  preselectedClientId?: string;
  onSubmit: (data: CreateClassGroupRequest) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

// ── Component ──────────────────────────────────────────────────────────────

export function ClassGroupForm({
  initialData,
  preselectedClientId,
  onSubmit,
  onCancel,
  isLoading = false,
}: ClassGroupFormProps) {
  const router = useRouter();

  const [submitting, setSubmitting]             = useState(false);
  const [employees, setEmployees]               = useState<Employee[]>([]);
  const [loadingEmployees, setLoadingEmployees] = useState(false);
  const [clients, setClients]                   = useState<Client[]>([]);
  const [loadingClients, setLoadingClients]     = useState(false);
  const [clientComboOpen, setClientComboOpen]   = useState(false);

  const isEditing    = !!initialData;
  const defaultIsInd = initialData?.is_individual ?? (!!preselectedClientId);

  // El tipo activo — controlado por el toggle (solo cuando se crea)
  const [isIndividual, setIsIndividual] = useState(defaultIsInd);

  // ── Cargar empleados ──────────────────────────────────────────────────────
  useEffect(() => {
    setLoadingEmployees(true);
    employeesApi.getAll({ limit: 100 })
      .then((r) => setEmployees(r.results))
      .catch(() => {})
      .finally(() => setLoadingEmployees(false));
  }, []);

  // ── Cargar alumnos cuando el usuario activa el tab individual ────────────
  useEffect(() => {
    if (isEditing || !isIndividual || clients.length > 0) return;
    setLoadingClients(true);
    clientsApi.getAll({ limit: 200, ordering: "name" })
      .then((r) => setClients(r.results))
      .catch(() => {})
      .finally(() => setLoadingClients(false));
  }, [isIndividual, isEditing]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Forms ─────────────────────────────────────────────────────────────────
  // Usamos dos forms separados para evitar conflictos de tipos entre los schemas
  const collectiveForm = useForm<CollectiveValues>({
    resolver: zodResolver(collectiveSchema),
    defaultValues: {
      is_individual: false,
      name:          initialData?.name ?? "",
      level:         (initialData?.level as CollectiveValues["level"]) ?? "all",
      monthly_fee:   initialData?.monthly_fee ?? undefined,
      instructor:    initialData?.instructor_id ?? "",
      disciplines:   initialData?.disciplines?.map((d) => d.id) ?? [],
      schedules:     initialData?.schedules?.map((s) => ({
        day_of_week: s.day_of_week,
        start_time:  s.start_time.slice(0, 5),
        end_time:    s.end_time.slice(0, 5),
      })) ?? [],
    },
  });

  const individualForm = useForm<IndividualValues>({
    resolver: zodResolver(individualSchema),
    defaultValues: {
      is_individual: true,
      client:        preselectedClientId ?? "",
      monthly_fee:   undefined,
      billing_day:   "",
      start_date:    todayISO(),
      instructor:    "",
      disciplines:   [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: collectiveForm.control,
    name: "schedules",
  });

  // ── Submit colectivo ──────────────────────────────────────────────────────
  const handleCollectiveSubmit = async (values: CollectiveValues) => {
    try {
      setSubmitting(true);
      const payload: CreateClassGroupRequest = {
        name:          values.name,
        is_individual: false,
        level:         values.level,
        monthly_fee:   values.monthly_fee ?? null,
        instructor:    values.instructor || undefined,
        disciplines:   values.disciplines.length > 0 ? values.disciplines : undefined,
        schedules:     values.schedules.map((s) => ({
          day_of_week: s.day_of_week as 0|1|2|3|4|5|6,
          start_time:  s.start_time,
          end_time:    s.end_time,
        })),
      };
      await onSubmit(payload);
    } catch (err: any) {
      const apiErrors = err?.response?.data;
      if (apiErrors && typeof apiErrors === "object") {
        Object.entries(apiErrors).forEach(([field, messages]) => {
          const msg = Array.isArray(messages) ? messages[0] : String(messages);
          toast.error(`${field}: ${msg}`);
        });
      } else {
        toast.error("Error al guardar el grupo");
      }
    } finally {
      setSubmitting(false);
    }
  };

  // ── Submit individual ─────────────────────────────────────────────────────
  const handleIndividualSubmit = async (values: IndividualValues) => {
    try {
      setSubmitting(true);
      // POST /enrollments/ con is_individual: true — el backend crea el grupo
      await enrollmentsApi.create({
        client:             values.client,
        is_individual:      true,
        start_date:         values.start_date,
        custom_billing_day: values.billing_day ? Number(values.billing_day) : undefined,
        custom_monthly_fee: values.monthly_fee,
        disciplines:        values.disciplines,
        ...(values.instructor ? { instructor: values.instructor } : {}),
      } as any);
      toast.success("Clase individual creada e inscripción registrada");
      // Redirigir a la ficha del alumno si viene de ahí, si no a la lista
      if (preselectedClientId) {
        router.push(`/clients/${preselectedClientId}`);
      } else {
        router.push(`/clients/${values.client}`);
      }
    } catch (err: any) {
      const apiErrors = err?.response?.data;
      if (apiErrors && typeof apiErrors === "object") {
        Object.entries(apiErrors).forEach(([field, messages]) => {
          const msg = Array.isArray(messages) ? messages[0] : String(messages);
          toast.error(`${field}: ${msg}`);
        });
      } else {
        toast.error("Error al crear la clase individual");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const busy = isLoading || submitting;

  // Estado para edición de clase individual (solo instructor + disciplinas)
  const [indInstructor, setIndInstructor] = useState<string>(initialData?.instructor_id ?? "");
  const [indDisciplines, setIndDisciplines] = useState<string[]>(
    initialData?.disciplines?.map((d) => d.id) ?? []
  );

  const handleIndividualEditSubmit = async () => {
    try {
      setSubmitting(true);
      await onSubmit({
        instructor:  indInstructor || undefined,
        disciplines: indDisciplines,
      } as CreateClassGroupRequest);
    } catch (err: any) {
      const apiErrors = err?.response?.data;
      if (apiErrors && typeof apiErrors === "object") {
        Object.entries(apiErrors).forEach(([field, messages]) => {
          const msg = Array.isArray(messages) ? messages[0] : String(messages);
          toast.error(`${field}: ${msg}`);
        });
      } else {
        toast.error("Error al guardar");
      }
    } finally {
      setSubmitting(false);
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">

      {/* ── Selector de tipo (solo al crear) ── */}
      {!isEditing && (
        <div className="grid grid-cols-2 gap-2">
          {([
            { value: false, label: "Clase grupal",     desc: "Varios alumnos, horario compartido" },
            { value: true,  label: "Clase individual",  desc: "Un alumno, mensualidad propia" },
          ] as const).map((opt) => (
            <button
              key={String(opt.value)}
              type="button"
              onClick={() => setIsIndividual(opt.value)}
              className={`rounded-lg border p-3 text-left transition-colors ${
                isIndividual === opt.value
                  ? "border-primary bg-primary/5 ring-1 ring-primary"
                  : "border-input hover:bg-muted/50"
              }`}
            >
              <p className="text-sm font-medium leading-tight">{opt.label}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{opt.desc}</p>
            </button>
          ))}
        </div>
      )}

      {/* ════════════════════════════════════════
          FORM — EDITAR CLASE INDIVIDUAL
          Solo instructor y disciplinas — los demás campos no aplican
      ════════════════════════════════════════ */}
      {isEditing && isIndividual && (
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>Instructor <span className="text-muted-foreground text-xs font-normal">(opcional)</span></Label>
            <Select
              value={indInstructor || "none"}
              onValueChange={(v) => setIndInstructor(v === "none" ? "" : v)}
              disabled={loadingEmployees}
            >
              <SelectTrigger>
                {loadingEmployees
                  ? <span className="flex items-center gap-2 text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" />Cargando...</span>
                  : <SelectValue placeholder="Sin instructor asignado" />}
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">
                  <span className="flex items-center gap-2 text-muted-foreground"><UserX className="h-4 w-4" />Sin instructor</span>
                </SelectItem>
                {employees.map((emp) => (
                  <SelectItem key={emp.id} value={emp.id}>{emp.full_name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>Disciplinas <span className="text-muted-foreground text-xs font-normal">(opcional)</span></Label>
            <DisciplineMultiSelect
              value={indDisciplines}
              onChange={setIndDisciplines}
              disabled={busy}
              placeholder="Ej: Guitarra, Piano..."
            />
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" onClick={onCancel} disabled={busy} className="flex-1">Cancelar</Button>
            <Button type="button" onClick={handleIndividualEditSubmit} disabled={busy} className="flex-1">
              {busy && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Guardar cambios
            </Button>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════
          FORM — CLASE GRUPAL
      ════════════════════════════════════════ */}
      {!isIndividual && (
        <Form {...collectiveForm}>
          <form onSubmit={collectiveForm.handleSubmit(handleCollectiveSubmit)} className="space-y-6">

            {/* Nombre */}
            <FormField
              control={collectiveForm.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre del grupo *</FormLabel>
                  <FormControl>
                    <Input placeholder="Ej: Grupo principiantes — Lunes y Miércoles" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Nivel + Mensualidad */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={collectiveForm.control}
                name="level"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nivel *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger><SelectValue placeholder="Seleccionar nivel" /></SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {LEVELS.map((l) => (
                          <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={collectiveForm.control}
                name="monthly_fee"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Mensualidad (MXN) *</FormLabel>
                    <FormControl>
                      <Input
                        type="number" min={0} placeholder="350"
                        value={field.value ?? ""}
                        onChange={(e) => field.onChange(e.target.value === "" ? undefined : parseFloat(e.target.value))}
                        onFocus={(e) => e.target.select()}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Disciplinas */}
            <FormField
              control={collectiveForm.control}
              name="disciplines"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Disciplinas <span className="text-muted-foreground text-xs">(opcional)</span></FormLabel>
                  <FormControl>
                    <DisciplineMultiSelect value={field.value} onChange={field.onChange} disabled={busy} placeholder="Ej: Salsa, Guitarra..." />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Instructor */}
            <FormField
              control={collectiveForm.control}
              name="instructor"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Instructor</FormLabel>
                  <Select
                    onValueChange={(v) => field.onChange(v === "none" ? "" : v)}
                    value={field.value || "none"}
                    disabled={loadingEmployees}
                  >
                    <FormControl>
                      <SelectTrigger>
                        {loadingEmployees
                          ? <span className="flex items-center gap-2 text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" />Cargando...</span>
                          : <SelectValue placeholder="Sin instructor asignado" />}
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="none">
                        <span className="flex items-center gap-2 text-muted-foreground"><UserX className="h-4 w-4" />Sin instructor</span>
                      </SelectItem>
                      {employees.map((emp) => (
                        <SelectItem key={emp.id} value={emp.id}>{emp.full_name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Horarios */}
            <div className="space-y-3">
              <FormLabel className="text-base">Horarios</FormLabel>
              {fields.length === 0 && (
                <p className="text-sm text-muted-foreground italic">Sin horarios. Puedes agregarlos después.</p>
              )}
              {fields.map((field, index) => (
                <div key={field.id} className="grid grid-cols-[1fr_1fr_1fr_auto] gap-2 items-end p-3 border rounded-lg bg-muted/30">
                  <FormField
                    control={collectiveForm.control}
                    name={`schedules.${index}.day_of_week`}
                    render={({ field: f }) => (
                      <FormItem>
                        <FormLabel className="text-xs">Día</FormLabel>
                        <Select onValueChange={(v) => f.onChange(parseInt(v, 10))} value={String(f.value)}>
                          <FormControl><SelectTrigger className="h-9"><SelectValue /></SelectTrigger></FormControl>
                          <SelectContent>
                            {DAYS.map((d) => <SelectItem key={d.value} value={String(d.value)}>{d.label}</SelectItem>)}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={collectiveForm.control}
                    name={`schedules.${index}.start_time`}
                    render={({ field: f }) => (
                      <FormItem>
                        <FormLabel className="text-xs">Inicio</FormLabel>
                        <FormControl><Input type="time" className="h-9" {...f} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={collectiveForm.control}
                    name={`schedules.${index}.end_time`}
                    render={({ field: f }) => (
                      <FormItem>
                        <FormLabel className="text-xs">Fin</FormLabel>
                        <FormControl><Input type="time" className="h-9" {...f} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="button" variant="ghost" size="icon" className="h-9 w-9 hover:bg-red-50" onClick={() => remove(index)}>
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
              ))}
              <div className="flex justify-end">
                <Button type="button" variant="outline" size="sm" onClick={() => append({ day_of_week: 0, start_time: "09:00", end_time: "10:00" })}>
                  <Plus className="h-4 w-4 mr-1" />Agregar día
                </Button>
              </div>
            </div>

            {/* Acciones */}
            <div className="flex gap-3 pt-2">
              <Button type="button" variant="outline" onClick={onCancel} disabled={busy} className="flex-1">Cancelar</Button>
              <Button type="submit" disabled={busy} className="flex-1">
                {busy && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {initialData ? "Guardar cambios" : "Crear grupo"}
              </Button>
            </div>
          </form>
        </Form>
      )}

      {/* ════════════════════════════════════════
          FORM — CLASE INDIVIDUAL
      ════════════════════════════════════════ */}
      {isIndividual && !isEditing && (
        <Form {...individualForm}>
          <form onSubmit={individualForm.handleSubmit(handleIndividualSubmit)} className="space-y-5">

            {/* Alumno */}
            {!preselectedClientId ? (
              <FormField
                control={individualForm.control}
                name="client"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Alumno *</FormLabel>
                    <Popover open={clientComboOpen} onOpenChange={setClientComboOpen} modal>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            role="combobox"
                            disabled={loadingClients}
                            className={cn("w-full justify-between font-normal", !field.value && "text-muted-foreground")}
                          >
                            {loadingClients
                              ? <span className="flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" />Cargando alumnos...</span>
                              : field.value
                                ? clients.find((c) => c.id === field.value)?.full_name ?? "Seleccionar alumno..."
                                : "Seleccionar alumno..."}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="p-0" style={{ width: "var(--radix-popover-trigger-width)" }} align="start">
                        <Command>
                          <CommandInput placeholder="Buscar por nombre..." />
                          <CommandList style={{ maxHeight: "200px", overflowY: "auto" }}>
                            <CommandEmpty>Sin resultados</CommandEmpty>
                            <CommandGroup>
                              {clients.map((c) => (
                                <CommandItem
                                  key={c.id}
                                  value={c.full_name}
                                  onSelect={() => { field.onChange(c.id); setClientComboOpen(false); }}
                                >
                                  <Check className={cn("mr-2 h-4 w-4 shrink-0", field.value === c.id ? "opacity-100" : "opacity-0")} />
                                  <span>{c.full_name}</span>
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
            ) : (
              // Alumno prellenado desde la ficha — solo mostrar nombre
              <div className="rounded-lg border bg-muted/30 px-4 py-3 text-sm">
                <p className="text-muted-foreground text-xs mb-0.5">Alumno</p>
                <p className="font-semibold">
                  {clients.find((c) => c.id === preselectedClientId)?.full_name ?? "Cargando..."}
                </p>
              </div>
            )}

            {/* Disciplinas — obligatorio */}
            <FormField
              control={individualForm.control}
              name="disciplines"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Disciplinas <span className="text-muted-foreground text-xs">(opcional)</span></FormLabel>
                  <FormControl>
                    <DisciplineMultiSelect value={field.value} onChange={field.onChange} disabled={busy} placeholder="Ej: Guitarra, Piano..." />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Mensualidad + Día de pago */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={individualForm.control}
                name="monthly_fee"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Mensualidad (MXN) *</FormLabel>
                    <FormControl>
                      <Input
                        type="number" min={1} placeholder="1200"
                        value={field.value ?? ""}
                        onChange={(e) => field.onChange(e.target.value === "" ? undefined : parseFloat(e.target.value))}
                        onFocus={(e) => e.target.select()}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={individualForm.control}
                name="billing_day"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Día de pago <span className="text-muted-foreground text-xs">(1-28, opcional)</span></FormLabel>
                    <FormControl>
                      <Input type="number" min={1} max={28} placeholder="Ej: 15" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Fecha de inicio */}
            <FormField
              control={individualForm.control}
              name="start_date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Fecha de inicio *</FormLabel>
                  <FormControl>
                    <DatePicker value={field.value} onChange={field.onChange} placeholder="dd/mm/yyyy" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Instructor */}
            <FormField
              control={individualForm.control}
              name="instructor"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Instructor <span className="text-muted-foreground text-xs">(opcional)</span></FormLabel>
                  <Select
                    onValueChange={(v) => field.onChange(v === "none" ? "" : v)}
                    value={field.value || "none"}
                    disabled={loadingEmployees}
                  >
                    <FormControl>
                      <SelectTrigger>
                        {loadingEmployees
                          ? <span className="flex items-center gap-2 text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" />Cargando...</span>
                          : <SelectValue placeholder="Sin instructor asignado" />}
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="none">
                        <span className="flex items-center gap-2 text-muted-foreground"><UserX className="h-4 w-4" />Sin instructor</span>
                      </SelectItem>
                      {employees.map((emp) => (
                        <SelectItem key={emp.id} value={emp.id}>{emp.full_name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Acciones */}
            <div className="flex gap-3 pt-2">
              <Button type="button" variant="outline" onClick={onCancel} disabled={busy} className="flex-1">Cancelar</Button>
              <Button type="submit" disabled={busy} className="flex-1">
                {busy && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Crear clase individual
              </Button>
            </div>
          </form>
        </Form>
      )}

    </div>
  );
}
