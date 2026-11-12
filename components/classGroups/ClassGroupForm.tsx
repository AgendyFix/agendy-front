"use client";

// ============================================
// CLASS GROUP FORM - Crear / Editar grupo
// ============================================

import { useEffect, useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Trash2, Loader2, UserX, Check, ChevronsUpDown, Globe } from "lucide-react";
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
import { useFeatures } from "@/lib/hooks/useFeatures";
import { PUBLIC_SITE_FEATURE } from "@/components/publicPage/constants";
import { DisciplineMultiSelect } from "@/components/disciplines/DisciplineMultiSelect";
import { DatePicker } from "@/components/ui/date-picker";
import { todayLocalISO } from "@/lib/dates";
import { tuitionTablesApi } from "@/lib/api/tuitionTables";
import { TUITION_TABLES_FEATURE, tiersLabel } from "@/lib/tuition";
import { useIsAdmin } from "@/lib/hooks/useIsAdmin";
import { PackageForm } from "@/components/classGroups/PackageForm";
import Link from "next/link";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import type { TuitionTable } from "@/lib/types/models";

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
  monthly_fee:   z.number().min(0, "Debe ser mayor o igual a 0").optional(),
  signup_fee:    z.number().min(0, "Debe ser mayor o igual a 0").optional(),
  /** Tabulador: el grupo entra al paquete por número de grupos ("" = precio fijo) */
  tuition_table: z.string().optional(),
  instructor:    z.string().optional(),
  disciplines:   z.array(z.string()),
  schedules:     z.array(scheduleSchema),
}).superRefine((val, ctx) => {
  if (!val.tuition_table && val.monthly_fee == null) {
    ctx.addIssue({ code: "custom", path: ["monthly_fee"], message: "Ingresa la mensualidad" });
  }
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

type CollectiveValues  = z.infer<typeof collectiveSchema>;
type IndividualValues  = z.infer<typeof individualSchema>;

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
  return todayLocalISO();
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

  // Tabuladores de la academia: sin ninguno no se muestra la casilla de paquete
  const [tables, setTables] = useState<TuitionTable[]>([]);
  useEffect(() => {
    tuitionTablesApi.getAll().then(setTables).catch(() => setTables([]));
  }, []);

  const { isFeatureEnabled } = useFeatures();
  // Descubrir Paquetes: admins de academias con el feature
  const isAdmin = useIsAdmin();
  const canManagePackages = isAdmin && isFeatureEnabled(TUITION_TABLES_FEATURE);
  const [newPackageOpen, setNewPackageOpen] = useState(false);
  const showsOnPublicSite = isFeatureEnabled(PUBLIC_SITE_FEATURE);

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
      signup_fee:    initialData?.signup_fee ?? undefined,
      tuition_table: initialData?.tuition_table ?? "",
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

  const tuitionTable = collectiveForm.watch("tuition_table") ?? "";
  const inPackage    = !!tuitionTable;
  // Si el tabulador ligado ya no está activo, igual se muestra por nombre
  const packageTable = tables.find((t) => t.id === tuitionTable);

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
        monthly_fee:   values.tuition_table ? null : values.monthly_fee ?? null,
        signup_fee:    values.signup_fee || null,
        ...(tables.length > 0 || values.tuition_table
          ? { tuition_table: values.tuition_table || null }
          : {}),
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
              {!opt.value && showsOnPublicSite && (
                <p className="mt-1 flex items-center gap-1 text-xs text-primary">
                  <Globe className="h-3 w-3" aria-hidden />
                  Se muestra en Mi Sitio
                </p>
              )}
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
          <form noValidate onSubmit={collectiveForm.handleSubmit(handleCollectiveSubmit)} className="space-y-6">

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

            {/* Nivel + Mensualidad + Inscripción */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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

              {!inPackage && <FormField
                control={collectiveForm.control}
                name="monthly_fee"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Mensualidad (MXN) *</FormLabel>
                    <FormControl>
                      <Input
                        type="number" inputMode="numeric" min={0} placeholder="350"
                        value={field.value ?? ""}
                        onChange={(e) => field.onChange(e.target.value === "" ? undefined : parseFloat(e.target.value))}
                        onFocus={(e) => e.target.select()}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />}

              <FormField
                control={collectiveForm.control}
                name="signup_fee"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Inscripción <span className="text-muted-foreground font-normal text-xs">(opcional)</span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="number" inputMode="numeric" min={0} step={1} placeholder="Sin cuota"
                        value={field.value ?? ""}
                        onChange={(e) => field.onChange(e.target.value === "" ? undefined : parseInt(e.target.value, 10))}
                        onFocus={(e) => e.target.select()}
                      />
                    </FormControl>
                    <p className="text-xs text-muted-foreground">Se propone al inscribir a alguien</p>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Sin paquetes: link para crear uno sin perder lo capturado del grupo */}
            {tables.length === 0 && canManagePackages && (
              <p className="text-sm text-muted-foreground">
                ¿Cobras un solo precio por varios grupos?{" "}
                <button type="button" className="font-medium text-primary hover:underline" onClick={() => setNewPackageOpen(true)}>
                  Crear paquete
                </button>
              </p>
            )}
            <Dialog open={newPackageOpen} onOpenChange={setNewPackageOpen}>
              <DialogContent className="max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Nuevo paquete</DialogTitle>
                </DialogHeader>
                <PackageForm
                  onCancel={() => setNewPackageOpen(false)}
                  onSaved={(saved) => {
                    setTables((cur) => [...cur, saved]);
                    collectiveForm.setValue("tuition_table", saved.id);
                    setNewPackageOpen(false);
                  }}
                />
              </DialogContent>
            </Dialog>

            {/* Paquete por número de grupos (tabulador). Default: precio fijo. */}
            {tables.length > 0 && (
              <div className="rounded-lg border p-3 space-y-2">
                <label className="flex items-start gap-3 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    className="mt-0.5 h-4 w-4 rounded border-input accent-primary"
                    checked={inPackage}
                    disabled={busy}
                    onChange={(e) => collectiveForm.setValue(
                      "tuition_table", e.target.checked ? tables[0].id : "", { shouldValidate: collectiveForm.formState.isSubmitted },
                    )}
                  />
                  <span className="space-y-0.5">
                    <span className="block text-sm font-medium leading-none">Entra al paquete por número de grupos</span>
                    <span className="block text-xs text-muted-foreground">
                      {inPackage && packageTable
                        ? `${packageTable.name}: ${tiersLabel(packageTable.tiers)}. El alumno paga un solo precio por todos sus grupos del paquete.`
                        : "Sin marcar, el grupo cobra su propia mensualidad."}
                    </span>
                    {canManagePackages && (
                      <Link href="/class-groups/packages" className="block text-xs font-medium text-primary hover:underline">
                        Administrar paquetes →
                      </Link>
                    )}
                  </span>
                </label>
                {inPackage && tables.length > 1 && (
                  <Select
                    value={tuitionTable}
                    onValueChange={(v) => collectiveForm.setValue("tuition_table", v)}
                    disabled={busy}
                  >
                    <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {tables.map((t) => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                )}
              </div>
            )}

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
                <div key={field.id} className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_auto] gap-2 items-end p-3 border rounded-lg bg-muted/30">
                  <FormField
                    control={collectiveForm.control}
                    name={`schedules.${index}.day_of_week`}
                    render={({ field: f }) => (
                      <FormItem className="col-span-2 sm:col-span-1 min-w-0">
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
                      <FormItem className="min-w-0">
                        <FormLabel className="text-xs">Inicio</FormLabel>
                        <FormControl><Input type="time" className="h-9 w-full min-w-0 appearance-none" {...f} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={collectiveForm.control}
                    name={`schedules.${index}.end_time`}
                    render={({ field: f }) => (
                      <FormItem className="min-w-0">
                        <FormLabel className="text-xs">Fin</FormLabel>
                        <FormControl><Input type="time" className="h-9 w-full min-w-0 appearance-none" {...f} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="button" variant="ghost" size="icon" className="h-9 w-9 hover:bg-red-50 col-start-3 row-start-1 sm:col-start-auto sm:row-start-auto" aria-label="Quitar horario" onClick={() => remove(index)}>
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
          <form noValidate onSubmit={individualForm.handleSubmit(handleIndividualSubmit)} className="space-y-5">

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
                        type="number" inputMode="numeric" min={1} placeholder="1200"
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
                    <FormLabel>Día de pago</FormLabel>
                    <FormControl>
                      <Input type="number" inputMode="numeric" min={1} max={28} placeholder="Ej: 15" {...field} />
                    </FormControl>
                    <p className="text-xs text-muted-foreground">Del 1 al 28. Vacío = día de inicio</p>
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
