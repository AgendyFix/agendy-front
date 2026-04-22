"use client";

// ============================================
// NEW CLIENT PAGE — Formulario unificado
// ============================================
// Flujo 1: Alumno + Contacto + Clase Individual (1 request)
// Flujo 2: Alumno + Contacto + Inscripción a grupo colectivo (1 request)
// Flujo 3: Solo alumno + contacto (sin inscripción)

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { ArrowLeft, Loader2, Plus, Clock, X as XIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { DisciplineMultiSelect } from "@/components/disciplines/DisciplineMultiSelect";
import { DatePicker } from "@/components/ui/date-picker";
import { clientsApi } from "@/lib/api/clients";
import { classGroupsApi } from "@/lib/api/classGroups";
import { useFeatures } from "@/lib/hooks/useFeatures";
import type { CreateClientRequest } from "@/lib/types/api";
import type { ClassGroup } from "@/lib/types/models";

// ── Schemas ────────────────────────────────────────────────────────────────

const schema = z.object({
  // Alumno
  name:      z.string().min(1, "El nombre es requerido"),
  last_name: z.string().optional().or(z.literal("")),
  email:     z.string().email("Email inválido").optional().or(z.literal("")),
  notes:     z.string().optional().or(z.literal("")),

  // Inscripción (condicional)
  enrollment_mode: z.enum(["none", "individual", "group"]),

  // Clase individual
  ind_monthly_fee:        z.string().optional(),
  ind_billing_day:        z.string().optional(),
  ind_signup_fee:         z.string().optional(),   // cuota de inscripción one-time
  ind_signup_fee_paid:    z.string().optional(),   // anticipo de esa cuota
  ind_initial_payment:    z.string().optional(),   // pago de la mensualidad hoy
  ind_initial_method:     z.enum(["cash","card","transfer","other"]).optional(),
  ind_start_date:         z.string().optional(),

  // Grupo colectivo
  grp_class_group:        z.string().optional(),
  grp_billing_day:        z.string().optional(),
  grp_monthly_fee:        z.string().optional(),   // precio personalizado (opcional)
  grp_signup_fee:         z.string().optional(),   // cuota de inscripción one-time
  grp_signup_fee_paid:    z.string().optional(),   // anticipo de esa cuota
  grp_initial_payment:    z.string().optional(),   // pago de la mensualidad hoy
  grp_initial_method:     z.enum(["cash","card","transfer","other"]).optional(),
  grp_start_date:         z.string().optional(),
}).superRefine((val, ctx) => {
  if (val.enrollment_mode === "individual") {
    if (!val.ind_monthly_fee || isNaN(Number(val.ind_monthly_fee))) {
      ctx.addIssue({ code: "custom", path: ["ind_monthly_fee"], message: "La mensualidad es requerida" });
    }
    if (!val.ind_start_date) {
      ctx.addIssue({ code: "custom", path: ["ind_start_date"], message: "La fecha de inicio es requerida" });
    }
  }
  if (val.enrollment_mode === "group") {
    if (!val.grp_class_group) {
      ctx.addIssue({ code: "custom", path: ["grp_class_group"], message: "Selecciona un grupo" });
    }
    if (!val.grp_start_date) {
      ctx.addIssue({ code: "custom", path: ["grp_start_date"], message: "La fecha de inicio es requerida" });
    }
  }
});

type FormData = z.infer<typeof schema>;

// ── Tipo para contactos en el formulario de creación ──────────────────────

type ContactRelationshipValue = "self"|"mother"|"father"|"guardian"|"sibling"|"other";

interface ContactRow {
  phone:                 string;
  name:                  string;
  relationship:          ContactRelationshipValue;
  receive_notifications: boolean;
}

const EMPTY_CONTACT = (): ContactRow => ({
  phone: "", name: "", relationship: "self", receive_notifications: true,
});

// ── Constants ──────────────────────────────────────────────────────────────

const RELATIONSHIP_OPTIONS = [
  { value: "self",     label: "Número personal" },
  { value: "mother",   label: "Madre" },
  { value: "father",   label: "Padre" },
  { value: "guardian", label: "Tutor" },
  { value: "sibling",  label: "Hermano/a" },
  { value: "other",    label: "Otro" },
] as const;

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

// ── Page ───────────────────────────────────────────────────────────────────

export default function NewClientPage() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const { getFeatureName } = useFeatures();

  const entityName     = getFeatureName("client_groups") ?? "Clientes";
  const entitySingular = entityName.endsWith("s") ? entityName.slice(0, -1) : entityName;

  // Si viene de /class-groups/new con ?enrollment=individual, preseleccionar el modo
  const enrollmentParam = searchParams.get("enrollment");
  const defaultMode = enrollmentParam === "individual" ? "individual"
                    : enrollmentParam === "group"      ? "group"
                    : "none";

  const [saving, setSaving]           = useState(false);
  const [disciplines, setDisciplines] = useState<string[]>([]);
  const [groups, setGroups]           = useState<ClassGroup[]>([]);
  const [contacts, setContacts]       = useState<ContactRow[]>([EMPTY_CONTACT()]);
  const [loadingGroups, setLoadingGroups] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      enrollment_mode: defaultMode as "none" | "individual" | "group",
      ind_start_date:  todayISO(),
      grp_start_date:  todayISO(),
    },
  });

  const enrollmentMode    = watch("enrollment_mode");
  const selectedGroupId   = watch("grp_class_group");
  const selectedGroup     = groups.find((g) => g.id === selectedGroupId);

  // Carga grupos colectivos cuando el usuario elige ese modo
  useEffect(() => {
    if (enrollmentMode === "group" && groups.length === 0) {
      setLoadingGroups(true);
      classGroupsApi.getAll({ is_individual: false, limit: 200, ordering: "name" })
        .then((r) => setGroups(r.results))
        .catch(() => toast.error("No se pudieron cargar los grupos"))
        .finally(() => setLoadingGroups(false));
    }
  }, [enrollmentMode]);

  // ── Submit ───────────────────────────────────────────────────────────────

  const onSubmit = async (data: FormData) => {
    try {
      setSaving(true);

      // Filtrar contactos con teléfono válido
      const validContacts = contacts.filter((c) => c.phone.trim().length >= 6);

      const payload: CreateClientRequest = {
        name:      data.name.trim(),
        last_name: data.last_name?.trim() || undefined,
        email:     data.email?.trim()     || undefined,
        notes:     data.notes?.trim()     || undefined,
        contacts: validContacts.length > 0
          ? validContacts.map((c) => ({
              phone:                 c.phone.trim(),
              name:                  c.name.trim() || undefined,
              relationship:          c.relationship,
              receive_notifications: c.receive_notifications,
            }))
          : undefined,
      };

      if (data.enrollment_mode === "individual") {
        const indInitialAmt = data.ind_initial_payment ? Number(data.ind_initial_payment) : 0;
        payload.enrollment = {
          is_individual:      true,
          start_date:         data.ind_start_date!,
          custom_monthly_fee: Number(data.ind_monthly_fee),
          custom_billing_day: data.ind_billing_day     ? Number(data.ind_billing_day)    : undefined,
          signup_fee:         data.ind_signup_fee      ? Number(data.ind_signup_fee)     : null,
          signup_fee_paid:    data.ind_signup_fee_paid ? Number(data.ind_signup_fee_paid): undefined,
          disciplines:        disciplines.length > 0 ? disciplines : undefined,
          // Pago inicial de la mensualidad (distinto a signup_fee)
          ...(indInitialAmt > 0 && {
            initial_payment: {
              amount_paid:    indInitialAmt,
              payment_method: data.ind_initial_method ?? "cash",
              payment_date:   data.ind_start_date,
            },
          }),
        };
      } else if (data.enrollment_mode === "group") {
        const grpInitialAmt = data.grp_initial_payment ? Number(data.grp_initial_payment) : 0;
        payload.enrollment = {
          is_individual:      false,
          class_group:        data.grp_class_group,
          start_date:         data.grp_start_date!,
          custom_billing_day: data.grp_billing_day     ? Number(data.grp_billing_day)    : undefined,
          custom_monthly_fee: data.grp_monthly_fee     ? Number(data.grp_monthly_fee)    : undefined,
          signup_fee:         data.grp_signup_fee      ? Number(data.grp_signup_fee)     : null,
          signup_fee_paid:    data.grp_signup_fee_paid ? Number(data.grp_signup_fee_paid): undefined,
          disciplines:        disciplines.length > 0 ? disciplines : undefined,
          // Pago inicial de la mensualidad (distinto a signup_fee)
          ...(grpInitialAmt > 0 && {
            initial_payment: {
              amount_paid:    grpInitialAmt,
              payment_method: data.grp_initial_method ?? "cash",
              payment_date:   data.grp_start_date,
            },
          }),
        };
      }

      const created = await clientsApi.create(payload);
      toast.success(`${entitySingular} registrado`);
      router.push(`/clients/${created.id}`);
    } catch (err: unknown) {
      const anyErr = err as { response?: { data?: Record<string, unknown> } };
      const apiData = anyErr?.response?.data;
      if (apiData && typeof apiData === "object") {
        const msgs = Object.entries(apiData)
          .map(([k, v]) => `${k}: ${Array.isArray(v) ? v[0] : v}`)
          .join(" · ");
        toast.error(msgs);
      } else {
        toast.error(`Error al registrar el ${entitySingular.toLowerCase()}`);
      }
    } finally {
      setSaving(false);
    }
  };

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-3xl font-bold tracking-tight">
          Nuevo {entitySingular}
        </h1>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 max-w-2xl">

        {/* ── Sección: Datos del alumno ── */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Datos del alumno</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="name">Nombre <span className="text-destructive">*</span></Label>
                <Input id="name" placeholder="Ej: Sofía" disabled={saving} {...register("name")} />
                {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="last_name">Apellido</Label>
                <Input id="last_name" placeholder="Ej: Ramírez" disabled={saving} {...register("last_name")} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="email">Email <span className="text-muted-foreground text-xs">(opcional)</span></Label>
              <Input id="email" type="email" placeholder="sofia@ejemplo.com" disabled={saving} {...register("email")} />
              {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="notes">Notas internas <span className="text-muted-foreground text-xs">(opcional)</span></Label>
              <Input id="notes" placeholder="Ej: Viene los sábados" disabled={saving} {...register("notes")} />
            </div>
          </CardContent>
        </Card>

        {/* ── Sección: Contactos ── */}
        <Card>
          <CardHeader className="pb-3 flex flex-row items-center justify-between gap-2">
            <CardTitle className="text-base">Contactos <span className="text-muted-foreground font-normal text-sm">(opcionales)</span></CardTitle>
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="h-7 px-2 text-xs"
              disabled={saving}
              onClick={() => setContacts((prev) => [...prev, EMPTY_CONTACT()])}
            >
              <Plus className="h-3.5 w-3.5 mr-1" />
              Agregar contacto
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {contacts.map((contact, idx) => (
              <div key={idx} className="rounded-lg border bg-muted/20 p-3 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-medium text-muted-foreground">
                    Contacto {contacts.length > 1 ? idx + 1 : ""}
                  </p>
                  {contacts.length > 1 && (
                    <button
                      type="button"
                      onClick={() => setContacts((prev) => prev.filter((_, i) => i !== idx))}
                      className="p-1 rounded text-muted-foreground hover:text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <XIcon className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
                <div className="grid gap-3 grid-cols-2">
                  <div className="space-y-1.5">
                    <Label>Teléfono</Label>
                    <Input
                      type="tel"
                      placeholder="9991234567"
                      disabled={saving}
                      value={contact.phone}
                      onChange={(e) => setContacts((prev) => prev.map((c, i) => i === idx ? { ...c, phone: e.target.value } : c))}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Nombre <span className="text-muted-foreground text-xs">(si es diferente)</span></Label>
                    <Input
                      placeholder="Ej: Lorna"
                      disabled={saving}
                      value={contact.name}
                      onChange={(e) => setContacts((prev) => prev.map((c, i) => i === idx ? { ...c, name: e.target.value } : c))}
                    />
                  </div>
                </div>
                <div className="grid gap-3 grid-cols-2">
                  <div className="space-y-1.5">
                    <Label>Relación</Label>
                    <Select
                      value={contact.relationship}
                      onValueChange={(v) => setContacts((prev) => prev.map((c, i) => i === idx ? { ...c, relationship: v as ContactRelationshipValue } : c))}
                      disabled={saving}
                    >
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {RELATIONSHIP_OPTIONS.map((o) => (
                          <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-end pb-1">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        className="h-4 w-4 rounded border border-input"
                        checked={contact.receive_notifications}
                        onChange={(e) => setContacts((prev) => prev.map((c, i) => i === idx ? { ...c, receive_notifications: e.target.checked } : c))}
                      />
                      <span className="text-sm">Recibe WhatsApp</span>
                    </label>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* ── Sección: Inscripción ── */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Inscripción</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">

            {/* Selector de modo */}
            <div className="grid grid-cols-3 gap-2">
              {([
                { value: "none",       label: "Sin inscripción",     desc: "Agregar después" },
                { value: "individual", label: "Clase individual",     desc: "Crea grupo propio" },
                { value: "group",      label: "Grupo colectivo",      desc: "Se une a un grupo" },
              ] as const).map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setValue("enrollment_mode", opt.value)}
                  className={`rounded-lg border p-3 text-left transition-colors ${
                    enrollmentMode === opt.value
                      ? "border-primary bg-primary/5 ring-1 ring-primary"
                      : "border-input hover:bg-muted/50"
                  }`}
                >
                  <p className="text-sm font-medium leading-tight">{opt.label}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{opt.desc}</p>
                </button>
              ))}
            </div>

            {/* Campos clase individual */}
            {enrollmentMode === "individual" && (
              <div className="space-y-4 pt-1">
                <div className="space-y-1.5">
                  <Label>Disciplinas</Label>
                  <DisciplineMultiSelect
                    value={disciplines}
                    onChange={setDisciplines}
                    disabled={saving}
                    placeholder="Ej: Guitarra, Piano..."
                  />
                </div>
                <div className="grid gap-3 grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="ind_monthly_fee">Mensualidad <span className="text-destructive">*</span></Label>
                    <Input
                      id="ind_monthly_fee"
                      type="number"
                      min={0}
                      step={50}
                      placeholder="1200"
                      disabled={saving}
                      {...register("ind_monthly_fee")}
                    />
                    {errors.ind_monthly_fee && <p className="text-xs text-red-500">{errors.ind_monthly_fee.message}</p>}
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="ind_billing_day">
                      Día de pago <span className="text-muted-foreground text-xs">(1-28, opcional)</span>
                    </Label>
                    <Input
                      id="ind_billing_day"
                      type="number"
                      min={1}
                      max={28}
                      placeholder="Ej: 15"
                      disabled={saving}
                      {...register("ind_billing_day")}
                    />
                  </div>
                </div>
                <div className="grid gap-3 grid-cols-2">
                  <div className="space-y-1.5">
                    <Label>Fecha de inicio <span className="text-destructive">*</span></Label>
                    <DatePicker
                      value={watch("ind_start_date") ?? ""}
                      onChange={(v) => setValue("ind_start_date", v)}
                      placeholder="dd/mm/yyyy"
                      disabled={saving}
                    />
                    {errors.ind_start_date && <p className="text-xs text-red-500">{errors.ind_start_date.message}</p>}
                  </div>
                </div>

                {/* ── Cuota de inscripción one-time ── */}
                <div className="rounded-lg border bg-muted/20 p-3 space-y-3">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    Cuota de inscripción <span className="font-normal normal-case">— cargo único al darse de alta, opcional</span>
                  </p>
                  <div className="grid gap-3 grid-cols-2">
                    <div className="space-y-1.5">
                      <Label htmlFor="ind_signup_fee">Costo</Label>
                      <Input
                        id="ind_signup_fee"
                        type="number"
                        min={0}
                        placeholder="Ej: 500"
                        disabled={saving}
                        {...register("ind_signup_fee")}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="ind_signup_fee_paid">Pagó hoy</Label>
                      <Input
                        id="ind_signup_fee_paid"
                        type="number"
                        min={0}
                        max={watch("ind_signup_fee") ? Number(watch("ind_signup_fee")) : undefined}
                        placeholder="Vacío = no pagó nada"
                        disabled={saving}
                        {...register("ind_signup_fee_paid")}
                      />
                    </div>
                  </div>
                  {(() => {
                    const total = Number(watch("ind_signup_fee") || 0);
                    const paid  = Number(watch("ind_signup_fee_paid") || 0);
                    if (total <= 0) return null;
                    if (paid <= 0)   return <p className="text-xs text-muted-foreground">Sin pago hoy — quedará pendiente <strong>${total.toLocaleString("es-MX")}</strong></p>;
                    if (paid >= total) return <p className="text-xs text-green-600 font-medium">✓ Cuota de inscripción liquidada</p>;
                    return <p className="text-xs text-orange-600 font-medium">Anticipo ${paid.toLocaleString("es-MX")} — saldo: ${(total - paid).toLocaleString("es-MX")}</p>;
                  })()}
                </div>

                {/* ── Pago inicial de la mensualidad ── */}
                <div className="rounded-lg border bg-muted/20 p-3 space-y-3">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    Pago inicial de mensualidad <span className="font-normal normal-case">— opcional, si ya pagó algo hoy</span>
                  </p>
                  <p className="text-xs text-muted-foreground -mt-1">
                    Si no pagas nada aquí, el sistema genera el cobro automáticamente cuando venza el día de pago.
                  </p>
                  <div className="grid gap-3 grid-cols-2">
                    <div className="space-y-1.5">
                      <Label htmlFor="ind_initial_payment">Monto pagado</Label>
                      <Input
                        id="ind_initial_payment"
                        type="number"
                        min={1}
                        placeholder={watch("ind_monthly_fee") ? `Máx. $${Number(watch("ind_monthly_fee")).toLocaleString("es-MX")}` : "Ej: 800"}
                        disabled={saving}
                        {...register("ind_initial_payment")}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Método de pago</Label>
                      <Select
                        value={watch("ind_initial_method") ?? "cash"}
                        onValueChange={(v) => setValue("ind_initial_method", v as "cash"|"card"|"transfer"|"other")}
                        disabled={saving || !watch("ind_initial_payment")}
                      >
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="cash">Efectivo</SelectItem>
                          <SelectItem value="card">Tarjeta</SelectItem>
                          <SelectItem value="transfer">Transferencia</SelectItem>
                          <SelectItem value="other">Otro</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  {(() => {
                    const monthly = Number(watch("ind_monthly_fee") || 0);
                    const paid    = Number(watch("ind_initial_payment") || 0);
                    if (paid <= 0 || monthly <= 0) return null;
                    if (paid >= monthly) return <p className="text-xs text-green-600 font-medium">✓ Mensualidad pagada completa</p>;
                    return <p className="text-xs text-orange-600 font-medium">Anticipo ${paid.toLocaleString("es-MX")} — saldo pendiente: ${(monthly - paid).toLocaleString("es-MX")}</p>;
                  })()}
                </div>

                {/* Aviso horarios — clase individual */}
                <div className="flex items-start gap-2 rounded-lg bg-blue-50 border border-blue-100 px-3 py-2.5 text-xs text-blue-700">
                  <Clock className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                  <span>El horario de clases se puede agregar después desde la ficha del alumno.</span>
                </div>
              </div>
            )}

            {/* Campos grupo colectivo */}
            {enrollmentMode === "group" && (
              <div className="space-y-4 pt-1">
                <div className="space-y-1.5">
                  <Label>Grupo <span className="text-destructive">*</span></Label>
                  {/* Estado vacío cuando no hay grupos colectivos */}
                  {!loadingGroups && groups.length === 0 ? (
                    <div className="rounded-lg border border-dashed p-4 text-center space-y-2">
                      <p className="text-sm text-muted-foreground">
                        No hay grupos colectivos creados todavía.
                      </p>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => router.push("/class-groups/new")}
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Crear grupo primero
                      </Button>
                    </div>
                  ) : (
                    <Select
                      disabled={saving || loadingGroups}
                      onValueChange={(v) => setValue("grp_class_group", v)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={loadingGroups ? "Cargando grupos..." : "Seleccionar grupo..."} />
                      </SelectTrigger>
                      <SelectContent>
                        {groups.map((g) => (
                          <SelectItem key={g.id} value={g.id}>
                            <span>{g.name}</span>
                            {g.monthly_fee != null && (
                              <span className="ml-2 text-muted-foreground text-xs">
                                · ${g.monthly_fee.toLocaleString("es-MX")}/mes
                              </span>
                            )}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                  {errors.grp_class_group && <p className="text-xs text-red-500">{errors.grp_class_group.message}</p>}
                </div>

                {/* Info del grupo seleccionado */}
                {selectedGroup && (
                  <div className="rounded-lg bg-muted/40 border px-3 py-2 text-sm text-muted-foreground space-y-0.5">
                    {selectedGroup.schedule_display && <p>{selectedGroup.schedule_display}</p>}
                    {selectedGroup.instructor_name   && <p>Instructor: {selectedGroup.instructor_name}</p>}
                    {selectedGroup.monthly_fee != null && (
                      <p>Mensualidad base: <strong className="text-foreground">${selectedGroup.monthly_fee.toLocaleString("es-MX")}</strong></p>
                    )}
                  </div>
                )}

                <div className="space-y-1.5">
                  <Label>Disciplinas <span className="text-muted-foreground text-xs">(opcional, sobreescribe las del grupo)</span></Label>
                  <DisciplineMultiSelect
                    value={disciplines}
                    onChange={setDisciplines}
                    disabled={saving}
                  />
                </div>

                <div className="grid gap-3 grid-cols-2">
                  <div className="space-y-1.5">
                    <Label>Fecha de inicio <span className="text-destructive">*</span></Label>
                    <DatePicker
                      value={watch("grp_start_date") ?? ""}
                      onChange={(v) => setValue("grp_start_date", v)}
                      placeholder="dd/mm/yyyy"
                      disabled={saving}
                    />
                    {errors.grp_start_date && <p className="text-xs text-red-500">{errors.grp_start_date.message}</p>}
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="grp_billing_day">
                      Día de pago <span className="text-muted-foreground text-xs">(1-28, opcional)</span>
                    </Label>
                    <Input
                      id="grp_billing_day"
                      type="number"
                      min={1}
                      max={28}
                      placeholder="Ej: 15"
                      disabled={saving}
                      {...register("grp_billing_day")}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="grp_monthly_fee">
                    Precio especial <span className="text-muted-foreground text-xs">(opcional — vacío usa el precio del grupo)</span>
                  </Label>
                  <Input
                    id="grp_monthly_fee"
                    type="number"
                    min={0}
                    placeholder={selectedGroup?.monthly_fee != null ? String(selectedGroup.monthly_fee) : "Precio del grupo"}
                    disabled={saving}
                    {...register("grp_monthly_fee")}
                  />
                </div>

                {/* ── Cuota de inscripción one-time ── */}
                <div className="rounded-lg border bg-muted/20 p-3 space-y-3">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    Cuota de inscripción <span className="font-normal normal-case">— cargo único al darse de alta, opcional</span>
                  </p>
                  <div className="grid gap-3 grid-cols-2">
                    <div className="space-y-1.5">
                      <Label htmlFor="grp_signup_fee">Costo</Label>
                      <Input
                        id="grp_signup_fee"
                        type="number"
                        min={0}
                        placeholder="Ej: 500"
                        disabled={saving}
                        {...register("grp_signup_fee")}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="grp_signup_fee_paid">Pagó hoy</Label>
                      <Input
                        id="grp_signup_fee_paid"
                        type="number"
                        min={0}
                        max={watch("grp_signup_fee") ? Number(watch("grp_signup_fee")) : undefined}
                        placeholder="Vacío = no pagó nada"
                        disabled={saving}
                        {...register("grp_signup_fee_paid")}
                      />
                    </div>
                  </div>
                  {(() => {
                    const total = Number(watch("grp_signup_fee") || 0);
                    const paid  = Number(watch("grp_signup_fee_paid") || 0);
                    if (total <= 0) return null;
                    if (paid <= 0)   return <p className="text-xs text-muted-foreground">Sin pago hoy — quedará pendiente <strong>${total.toLocaleString("es-MX")}</strong></p>;
                    if (paid >= total) return <p className="text-xs text-green-600 font-medium">✓ Cuota de inscripción liquidada</p>;
                    return <p className="text-xs text-orange-600 font-medium">Anticipo ${paid.toLocaleString("es-MX")} — saldo: ${(total - paid).toLocaleString("es-MX")}</p>;
                  })()}
                </div>

                {/* ── Pago inicial de la mensualidad ── */}
                <div className="rounded-lg border bg-muted/20 p-3 space-y-3">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    Pago inicial de mensualidad <span className="font-normal normal-case">— opcional, si ya pagó algo hoy</span>
                  </p>
                  <p className="text-xs text-muted-foreground -mt-1">
                    Si no pagas nada aquí, el sistema genera el cobro automáticamente cuando venza el día de pago.
                  </p>
                  <div className="grid gap-3 grid-cols-2">
                    <div className="space-y-1.5">
                      <Label htmlFor="grp_initial_payment">Monto pagado</Label>
                      <Input
                        id="grp_initial_payment"
                        type="number"
                        min={1}
                        placeholder={
                          watch("grp_monthly_fee") ? `Máx. $${Number(watch("grp_monthly_fee")).toLocaleString("es-MX")}` :
                          selectedGroup?.monthly_fee ? `Máx. $${selectedGroup.monthly_fee.toLocaleString("es-MX")}` :
                          "Ej: 800"
                        }
                        disabled={saving}
                        {...register("grp_initial_payment")}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Método de pago</Label>
                      <Select
                        value={watch("grp_initial_method") ?? "cash"}
                        onValueChange={(v) => setValue("grp_initial_method", v as "cash"|"card"|"transfer"|"other")}
                        disabled={saving || !watch("grp_initial_payment")}
                      >
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="cash">Efectivo</SelectItem>
                          <SelectItem value="card">Tarjeta</SelectItem>
                          <SelectItem value="transfer">Transferencia</SelectItem>
                          <SelectItem value="other">Otro</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  {(() => {
                    const monthly = Number(watch("grp_monthly_fee") || selectedGroup?.monthly_fee || 0);
                    const paid    = Number(watch("grp_initial_payment") || 0);
                    if (paid <= 0 || monthly <= 0) return null;
                    if (paid >= monthly) return <p className="text-xs text-green-600 font-medium">✓ Mensualidad pagada completa</p>;
                    return <p className="text-xs text-orange-600 font-medium">Anticipo ${paid.toLocaleString("es-MX")} — saldo pendiente: ${(monthly - paid).toLocaleString("es-MX")}</p>;
                  })()}
                </div>

                {/* Aviso horarios — grupo colectivo */}
                <div className="flex items-start gap-2 rounded-lg bg-blue-50 border border-blue-100 px-3 py-2.5 text-xs text-blue-700">
                  <Clock className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                  <span>El horario del grupo ya está definido. Si necesitas ajustarlo, puedes editarlo desde la ficha del grupo.</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Acciones */}
        <div className="flex gap-3 pb-8">
          <Button type="submit" disabled={saving} className="flex-1">
            {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Registrar {entitySingular}
          </Button>
          <Button type="button" variant="outline" onClick={() => router.back()} disabled={saving}>
            Cancelar
          </Button>
        </div>

      </form>
    </div>
  );
}
