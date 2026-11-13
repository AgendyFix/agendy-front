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
import { EnrollmentCharges } from "@/components/enrollments/EnrollmentCharges";
import { GroupMultiPicker } from "@/components/enrollments/GroupMultiPicker";
import { tuitionTablesApi } from "@/lib/api/tuitionTables";
import { enrollmentSummary, packagePricingMissing } from "@/lib/tuition";
import {
  EMPTY_CHARGES, chargesPayload, validateCharges, type EnrollmentChargesValue,
} from "@/lib/enrollmentCharges";
import { DatePicker } from "@/components/ui/date-picker";
import { todayLocalISO } from "@/lib/dates";
import { clientsApi } from "@/lib/api/clients";
import { classGroupsApi } from "@/lib/api/classGroups";
import { useFeatures } from "@/lib/hooks/useFeatures";
import type { CreateClientRequest } from "@/lib/types/api";
import type { ClassGroup, TuitionTable } from "@/lib/types/models";

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
  ind_start_date:         z.string().optional(),

  // Grupo colectivo
  grp_class_group:        z.string().optional(),
  grp_billing_day:        z.string().optional(),
  grp_monthly_fee:        z.string().optional(),   // precio personalizado (opcional)
  grp_start_date:         z.string().optional(),
}).superRefine((val, ctx) => {
  if (val.enrollment_mode === "individual") {
    const indFee = Number(val.ind_monthly_fee);
    if (!val.ind_monthly_fee || isNaN(indFee)) {
      ctx.addIssue({ code: "custom", path: ["ind_monthly_fee"], message: "La mensualidad es requerida" });
    } else if (indFee < 0) {
      ctx.addIssue({ code: "custom", path: ["ind_monthly_fee"], message: "La mensualidad no puede ser negativa" });
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
  return todayLocalISO();
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
  const [charges, setCharges]             = useState<EnrollmentChargesValue>(EMPTY_CHARGES);

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
  // Varios grupos a la vez: con 2 o más se manda group_enrollment
  const [groupIds, setGroupIds] = useState<string[]>([]);
  const [tables, setTables]     = useState<TuitionTable[]>([]);
  const bulk           = groupIds.length > 1;
  const selectedGroups = groups.filter((g) => groupIds.includes(g.id));
  const summary        = enrollmentSummary(selectedGroups, groups, tables);
  const signupGroup    = selectedGroups.find((g) => (g.signup_fee ?? 0) > 0) ?? selectedGroups[0];
  const packageGroupSelected = !bulk && !!selectedGroup?.tuition_table;
  const onPickGroups = (ids: string[]) => {
    setGroupIds(ids);
    setValue("grp_class_group", ids[0] ?? "");
    if (ids.length > 1) setValue("grp_monthly_fee", "");
  };

  // Al cambiar de modo (individual / grupo / sin inscripción) se reinician los cobros
  useEffect(() => { setCharges(EMPTY_CHARGES); }, [enrollmentMode]);

  // Carga grupos colectivos cuando el usuario elige ese modo
  useEffect(() => {
    if (enrollmentMode === "group" && groups.length === 0) {
      tuitionTablesApi.getAll().then(setTables).catch(() => setTables([]));
      setLoadingGroups(true);
      classGroupsApi.getAll({ is_individual: false, limit: 200, ordering: "name" })
        .then((r) => setGroups(r.results))
        .catch(() => toast.error("No se pudieron cargar los grupos"))
        .finally(() => setLoadingGroups(false));
    }
  }, [enrollmentMode]);

  // ── Submit ───────────────────────────────────────────────────────────────

  const onSubmit = async (data: FormData) => {
    if (enrollmentMode === "group" && packagePricingMissing(selectedGroups, tables)) {
      toast.error("No se pudieron cargar los precios del paquete. Recarga la página e inténtalo de nuevo.");
      return;
    }
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
        const chargesError = validateCharges(charges, Number(data.ind_monthly_fee) || null);
        if (chargesError) { toast.error(chargesError); return; }
        payload.enrollment = {
          is_individual:      true,
          start_date:         data.ind_start_date!,
          custom_monthly_fee: Number(data.ind_monthly_fee),
          custom_billing_day: data.ind_billing_day     ? Number(data.ind_billing_day)    : undefined,
          disciplines:        disciplines.length > 0 ? disciplines : undefined,
          // Cuota de inscripción + pago de la primera mensualidad
          ...chargesPayload(charges, todayISO()),
        };
      } else if (data.enrollment_mode === "group" && bulk) {
        const chargesError = validateCharges(charges, summary.firstChargeTotal || null);
        if (chargesError) { toast.error(chargesError); return; }
        const { signup_fee, signup_fee_paid, initial_payment } = chargesPayload(charges, todayISO());
        payload.group_enrollment = {
          class_groups:       groupIds,
          start_date:         data.grp_start_date!,
          custom_billing_day: data.grp_billing_day ? Number(data.grp_billing_day) : undefined,
          signup_fee, signup_fee_paid, initial_payment,
        };
      } else if (data.enrollment_mode === "group") {
        const groupFee = data.grp_monthly_fee ? Number(data.grp_monthly_fee)
          : summary.firstChargeTotal || null;
        const chargesError = validateCharges(charges, groupFee);
        if (chargesError) { toast.error(chargesError); return; }
        payload.enrollment = {
          is_individual:      false,
          class_group:        data.grp_class_group,
          start_date:         data.grp_start_date!,
          custom_billing_day: data.grp_billing_day     ? Number(data.grp_billing_day)    : undefined,
          custom_monthly_fee: data.grp_monthly_fee     ? Number(data.grp_monthly_fee)    : undefined,
          disciplines:        disciplines.length > 0 ? disciplines : undefined,
          // Cuota de inscripción + pago de la primera mensualidad
          ...chargesPayload(charges, todayISO()),
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

      <form noValidate onSubmit={handleSubmit(onSubmit)} className="space-y-4 max-w-2xl">

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
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Contactos <span className="text-muted-foreground font-normal text-sm">(opcionales)</span></CardTitle>
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
                    <Label>Nombre</Label>
                    <Input
                      placeholder="Opcional"
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
            <Button
              type="button"
              variant="outline"
              className="w-full border-dashed"
              disabled={saving}
              onClick={() => setContacts((prev) => [...prev, EMPTY_CONTACT()])}
            >
              <Plus className="h-4 w-4 mr-1" />
              {contacts.length > 0 ? "Agregar otro contacto" : "Agregar contacto"}
            </Button>
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
                      inputMode="numeric"
                      min={0}
                      step={50}
                      placeholder="1200"
                      disabled={saving}
                      {...register("ind_monthly_fee")}
                    />
                    {errors.ind_monthly_fee && <p className="text-xs text-red-500">{errors.ind_monthly_fee.message}</p>}
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="ind_billing_day">Día de pago</Label>
                    <Input
                      id="ind_billing_day"
                      type="number"
                      inputMode="numeric"
                      min={1}
                      max={28}
                      placeholder="Ej: 15"
                      disabled={saving}
                      {...register("ind_billing_day")}
                    />
                    <p className="text-xs text-muted-foreground">Del 1 al 28. Vacío = día de inicio</p>
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

                {/* ── Cobros al inscribir ── */}
                <EnrollmentCharges
                  idPrefix="ind-charges"
                  value={charges}
                  onChange={setCharges}
                  monthlyFee={watch("ind_monthly_fee") ? Number(watch("ind_monthly_fee")) : null}
                  startDate={watch("ind_start_date") ?? ""}
                  billingDay={watch("ind_billing_day")}
                  disabled={saving}
                />

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
                  <Label>Grupos <span className="text-destructive">*</span></Label>
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
                    <GroupMultiPicker
                      groups={groups}
                      value={groupIds}
                      onChange={onPickGroups}
                      tables={tables}
                      hideSummary={packageGroupSelected && !!watch("grp_monthly_fee")}
                      disabled={saving || loadingGroups}
                    />
                  )}
                  {errors.grp_class_group && <p className="text-xs text-red-500">{errors.grp_class_group.message}</p>}
                </div>

                {/* Instructor del grupo (horario y precio ya están en la lista y el resumen) */}
                {selectedGroup?.instructor_name && !bulk && (
                  <p className="text-sm text-muted-foreground">Instructor: {selectedGroup.instructor_name}</p>
                )}

                {bulk && (
                  <p className="text-xs text-muted-foreground">
                    Con varios grupos, el precio especial y las disciplinas se ajustan después desde la ficha del alumno.
                  </p>
                )}

                {!bulk && <div className="space-y-1.5">
                  <Label>Disciplinas <span className="text-muted-foreground text-xs">(opcional, sobreescribe las del grupo)</span></Label>
                  <DisciplineMultiSelect
                    value={disciplines}
                    onChange={setDisciplines}
                    disabled={saving}
                  />
                </div>}

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
                    <Label htmlFor="grp_billing_day">Día de pago</Label>
                    <Input
                      id="grp_billing_day"
                      type="number"
                      inputMode="numeric"
                      min={1}
                      max={28}
                      placeholder="Ej: 15"
                      disabled={saving}
                      {...register("grp_billing_day")}
                    />
                    <p className="text-xs text-muted-foreground">Del 1 al 28. Vacío = día de inicio</p>
                  </div>
                </div>

                {!bulk && <div className="space-y-1.5">
                  <Label htmlFor="grp_monthly_fee">Precio especial</Label>
                  <Input
                    id="grp_monthly_fee"
                    type="number"
                    inputMode="numeric"
                    min={0}
                    placeholder={packageGroupSelected ? "Según el paquete" : selectedGroup?.monthly_fee != null ? String(selectedGroup.monthly_fee) : "Precio del grupo"}
                    disabled={saving}
                    {...register("grp_monthly_fee")}
                  />
                  <p className="text-xs text-muted-foreground">
                    {packageGroupSelected
                      ? "Si lo llenas, este grupo se cobra aparte y no cuenta en el paquete"
                      : "Opcional. Vacío usa el precio del grupo"}
                  </p>
                </div>}

                {/* ── Cobros al inscribir (la cuota se propone desde el grupo) ── */}
                <EnrollmentCharges
                  idPrefix="grp-charges"
                  value={charges}
                  onChange={setCharges}
                  monthlyFee={
                    watch("grp_monthly_fee") && !bulk ? Number(watch("grp_monthly_fee"))
                    : summary.firstChargeTotal || null
                  }
                  startDate={watch("grp_start_date") ?? ""}
                  billingDay={watch("grp_billing_day")}
                  groupId={signupGroup?.id}
                  groupSignupFee={signupGroup?.signup_fee ?? null}
                  disabled={saving}
                />

                {/* Aviso horarios — grupo colectivo */}
                {selectedGroup && <div className="flex items-start gap-2 rounded-lg bg-blue-50 border border-blue-100 px-3 py-2.5 text-xs text-blue-700">
                  <Clock className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                  <span>El horario del grupo ya está definido. Si necesitas ajustarlo, puedes editarlo desde la ficha del grupo.</span>
                </div>}
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
