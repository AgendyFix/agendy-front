"use client";

// ============================================
// CLASS GROUP FORM - Crear / Editar grupo
// ============================================

import { useEffect, useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Trash2, Loader2, UserX } from "lucide-react";
import { toast } from "sonner";

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
import type { ClassGroup, Employee } from "@/lib/types/models";
import type { CreateClassGroupRequest } from "@/lib/types/api";
import { employeesApi } from "@/lib/api/employees";

// ── Schema ─────────────────────────────────────────────────────────────────

const scheduleSchema = z.object({
  day_of_week: z.number().min(0).max(6),
  start_time: z.string().min(1, "Requerido"),
  end_time: z.string().min(1, "Requerido"),
});

const classGroupSchema = z.object({
  name: z.string().min(2, "Mínimo 2 caracteres").max(120, "Máximo 120 caracteres"),
  level: z.enum(["all", "beginner", "intermediate", "advanced"]),
  monthly_fee: z.number().min(0, "Debe ser mayor o igual a 0"),
  instructor: z.string().optional(),
  schedules: z.array(scheduleSchema),
});

type ClassGroupFormValues = z.infer<typeof classGroupSchema>;

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

// ── Props ──────────────────────────────────────────────────────────────────

interface ClassGroupFormProps {
  /** Grupo existente cuando se edita */
  initialData?: ClassGroup;
  onSubmit: (data: CreateClassGroupRequest) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

// ── Component ──────────────────────────────────────────────────────────────

export function ClassGroupForm({
  initialData,
  onSubmit,
  onCancel,
  isLoading = false,
}: ClassGroupFormProps) {
  const [submitting, setSubmitting] = useState(false);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loadingEmployees, setLoadingEmployees] = useState(false);

  // Cargar empleados para el selector de instructor
  useEffect(() => {
    const load = async () => {
      try {
        setLoadingEmployees(true);
        const response = await employeesApi.getAll({ limit: 100 });
        setEmployees(response.results);
      } catch {
        // No bloqueante: si falla, el selector queda vacío
      } finally {
        setLoadingEmployees(false);
      }
    };
    load();
  }, []);

  const form = useForm<ClassGroupFormValues>({
    resolver: zodResolver(classGroupSchema),
    defaultValues: {
      name: initialData?.name ?? "",
      level: (initialData?.level as ClassGroupFormValues["level"]) ?? "all",
      monthly_fee: initialData?.monthly_fee ?? 0,
      instructor: initialData?.instructor_id ?? "",
      schedules: initialData?.schedules?.map((s) => ({
        day_of_week: s.day_of_week,
        start_time: s.start_time.slice(0, 5), // "HH:MM"
        end_time: s.end_time.slice(0, 5),
      })) ?? [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "schedules",
  });

  const handleSubmit = async (values: ClassGroupFormValues) => {
    try {
      setSubmitting(true);
      const payload: CreateClassGroupRequest = {
        name: values.name,
        level: values.level,
        monthly_fee: values.monthly_fee,
        instructor: values.instructor || undefined,
        schedules: values.schedules.map((s) => ({
          day_of_week: s.day_of_week as 0|1|2|3|4|5|6,
          start_time: s.start_time,
          end_time: s.end_time,
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

  const busy = isLoading || submitting;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">

        {/* Nombre */}
        <FormField
          control={form.control}
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

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Nivel */}
          <FormField
            control={form.control}
            name="level"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nivel *</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar nivel" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {LEVELS.map((l) => (
                      <SelectItem key={l.value} value={l.value}>
                        {l.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Mensualidad */}
          <FormField
            control={form.control}
            name="monthly_fee"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Mensualidad (MXN) *</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min={0}
                    placeholder="350"
                    value={field.value === 0 && field.value !== undefined ? "" : field.value}
                    onChange={(e) => {
                      const raw = e.target.value;
                      field.onChange(raw === "" ? 0 : parseFloat(raw));
                    }}
                    onFocus={(e) => {
                      // Selecciona todo al hacer foco para facilitar reemplazar el valor
                      e.target.select();
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Instructor */}
        <FormField
          control={form.control}
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
                    {loadingEmployees ? (
                      <span className="flex items-center gap-2 text-muted-foreground">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Cargando...
                      </span>
                    ) : (
                      <SelectValue placeholder="Sin instructor asignado" />
                    )}
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="none">
                    <span className="flex items-center gap-2 text-muted-foreground">
                      <UserX className="h-4 w-4" />
                      Sin instructor
                    </span>
                  </SelectItem>
                  {employees.map((emp) => (
                    <SelectItem key={emp.id} value={emp.id}>
                      {emp.full_name}
                    </SelectItem>
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
            <p className="text-sm text-muted-foreground italic">
              Sin horarios. Puedes agregarlos después.
            </p>
          )}

          {fields.map((field, index) => (
            <div
              key={field.id}
              className="grid grid-cols-[1fr_1fr_1fr_auto] gap-2 items-end p-3 border rounded-lg bg-muted/30"
            >
              {/* Día */}
              <FormField
                control={form.control}
                name={`schedules.${index}.day_of_week`}
                render={({ field: f }) => (
                  <FormItem>
                    <FormLabel className="text-xs">Día</FormLabel>
                    <Select
                      onValueChange={(v) => f.onChange(parseInt(v, 10))}
                      value={String(f.value)}
                    >
                      <FormControl>
                        <SelectTrigger className="h-9">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {DAYS.map((d) => (
                          <SelectItem key={d.value} value={String(d.value)}>
                            {d.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Inicio */}
              <FormField
                control={form.control}
                name={`schedules.${index}.start_time`}
                render={({ field: f }) => (
                  <FormItem>
                    <FormLabel className="text-xs">Inicio</FormLabel>
                    <FormControl>
                      <Input type="time" className="h-9" {...f} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Fin */}
              <FormField
                control={form.control}
                name={`schedules.${index}.end_time`}
                render={({ field: f }) => (
                  <FormItem>
                    <FormLabel className="text-xs">Fin</FormLabel>
                    <FormControl>
                      <Input type="time" className="h-9" {...f} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Eliminar */}
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-9 w-9 hover:bg-red-50"
                onClick={() => remove(index)}
              >
                <Trash2 className="h-4 w-4 text-red-500" />
              </Button>
            </div>
          ))}

          <div className="flex justify-end">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => append({ day_of_week: 0, start_time: "09:00", end_time: "10:00" })}
            >
              <Plus className="h-4 w-4 mr-1" />
              Agregar día
            </Button>
          </div>
        </div>

        {/* Acciones */}
        <div className="flex gap-3 pt-2">
          <Button type="button" variant="outline" onClick={onCancel} disabled={busy} className="flex-1">
            Cancelar
          </Button>
          <Button type="submit" disabled={busy} className="flex-1">
            {busy && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {initialData ? "Guardar cambios" : "Crear grupo"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
