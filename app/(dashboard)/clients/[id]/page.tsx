"use client";

// ============================================
// CLIENT DETAIL PAGE - Info + Contactos + Inscripciones + Pagos
// ============================================

import { useEffect, useState, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import {
  ArrowLeft, Phone, Mail, Pencil, UserPlus, Plus,
  Loader2, Pause, UserX, CreditCard, GraduationCap, CheckCircle, AlertTriangle,
  Check, X as XIcon, Users, Trash2, Bell, BellOff, Clock, Music2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DatePicker } from "@/components/ui/date-picker";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { clientsApi } from "@/lib/api/clients";
import { enrollmentsApi } from "@/lib/api/enrollments";
import { paymentsApi } from "@/lib/api/payments";
import { classGroupsApi } from "@/lib/api/classGroups";
import { useFeatures } from "@/lib/hooks/useFeatures";
import { useAuth } from "@/lib/hooks/useAuth";
import { useClientContacts } from "@/lib/hooks/useClientContacts";
import { RegisterPaymentForm } from "@/components/payments/RegisterPaymentForm";
import { DisciplineMultiSelect } from "@/components/disciplines/DisciplineMultiSelect";
import type {
  Client, Enrollment, Payment, UnpaidEnrollment, ClientContact, ContactRelationship,
  ClassGroup, ClassSchedule,
} from "@/lib/types/models";
import type { UpdateClientRequest } from "@/lib/types/api";
import type { CreateClientContactRequest, UpdateClientContactRequest } from "@/lib/api/clientContacts";

// ── Schemas ────────────────────────────────────────────────────────────────────

const clientSchema = z.object({
  name:      z.string().min(1, "El nombre es requerido"),
  last_name: z.string().optional().or(z.literal("")),
  email:     z.string().email("Email inválido").optional().or(z.literal("")),
  notes:     z.string().optional().or(z.literal("")),
});

type ClientFormData = z.infer<typeof clientSchema>;

const contactSchema = z.object({
  phone:                 z.string().min(6, "El teléfono es requerido"),
  name:                  z.string().optional().or(z.literal("")),
  relationship:          z.enum(["self","mother","father","guardian","sibling","other"]),
  receive_notifications: z.boolean(),
});

type ContactFormData = z.infer<typeof contactSchema>;

// ── Constants ──────────────────────────────────────────────────────────────────

const STATUS_STYLES: Record<string, string> = {
  active:  "bg-green-100 text-green-700",
  paused:  "bg-yellow-100 text-yellow-700",
  dropped: "bg-red-100 text-red-700",
};

const STATUS_LABELS: Record<string, string> = {
  active:  "Activo",
  paused:  "Pausado",
  dropped: "Baja",
};

const PAYMENT_STATUS_STYLES: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-700",
  partial: "bg-orange-100 text-orange-700",
  paid:    "bg-green-100 text-green-700",
  overdue: "bg-red-100 text-red-700",
  waived:  "bg-gray-100 text-gray-600",
};

const PAYMENT_STATUS_LABELS: Record<string, string> = {
  pending: "Pendiente",
  partial: "Pago parcial",
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

const RELATIONSHIP_OPTIONS: { value: ContactRelationship; label: string }[] = [
  { value: "self",     label: "Número personal" },
  { value: "mother",   label: "Madre" },
  { value: "father",   label: "Padre" },
  { value: "guardian", label: "Tutor" },
  { value: "sibling",  label: "Hermano/a" },
  { value: "other",    label: "Otro" },
];

function formatDate(date: string) {
  const [y, m, d] = date.split("-");
  return `${d}/${m}/${y}`;
}

const DAYS_SHORT: Record<number, string> = {
  0: "Lun", 1: "Mar", 2: "Mié", 3: "Jue", 4: "Vie", 5: "Sáb", 6: "Dom",
};

const DAYS_FULL: { value: string; label: string }[] = [
  { value: "0", label: "Lunes" },
  { value: "1", label: "Martes" },
  { value: "2", label: "Miércoles" },
  { value: "3", label: "Jueves" },
  { value: "4", label: "Viernes" },
  { value: "5", label: "Sábado" },
  { value: "6", label: "Domingo" },
];

// ── Component ──────────────────────────────────────────────────────────────────

export default function ClientDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const { getFeatureName } = useFeatures();
  const { currentCompany } = useAuth();

  const entityName     = getFeatureName("client_groups") ?? "Clientes";
  const entitySingular = entityName.endsWith("s") ? entityName.slice(0, -1) : entityName;

  // ── State ───────────────────────────────────────────────────────────────────
  const [client, setClient]               = useState<Client | null>(null);
  const [enrollments, setEnrollments]     = useState<Enrollment[]>([]);
  const [payments, setPayments]           = useState<Payment[]>([]);
  const [loadingPayments, setLoadingPayments] = useState(false);
  const [isFetching, setIsFetching]       = useState(true);
  const [isSaving, setIsSaving]           = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [dropTarget, setDropTarget]       = useState<Enrollment | null>(null);
  const [dropping, setDropping]           = useState(false);
  const [registerPaymentOpen, setRegisterPaymentOpen] = useState(false);
  const [registeringPayment, setRegisteringPayment]   = useState(false);
  const [preselectedPaymentEnrollment, setPreselectedPaymentEnrollment] =
    useState<UnpaidEnrollment | undefined>();

  // ── Contacts state ──────────────────────────────────────────────────────────
  const {
    contacts,
    isLoading: loadingContacts,
    fetchContacts,
    createContact,
    updateContact,
    deleteContact,
  } = useClientContacts();

  const [contactDialogOpen, setContactDialogOpen] = useState(false);
  const [editingContact, setEditingContact]        = useState<ClientContact | null>(null);
  const [deleteContactTarget, setDeleteContactTarget] = useState<ClientContact | null>(null);
  const [savingContact, setSavingContact]          = useState(false);

  // ── Group details cache (para is_individual + schedules) ───────────────────
  const [groupDetails, setGroupDetails] = useState<Record<string, ClassGroup>>({});

  // ── Schedule dialog ─────────────────────────────────────────────────────────
  // scheduleTarget: { groupId, schedules actuales }
  const [scheduleTarget, setScheduleTarget] = useState<{
    groupId: string;
    groupName: string;
    schedules: ClassSchedule[];
    // si está editando un slot existente, su índice; si es nuevo, null
    editingIndex: number | null;
  } | null>(null);
  const [scheduleDay,   setScheduleDay]   = useState<string>("1"); // 0-6
  const [scheduleStart, setScheduleStart] = useState<string>("09:00");
  const [scheduleEnd,   setScheduleEnd]   = useState<string>("10:00");
  const [savingSchedule, setSavingSchedule] = useState(false);

  // ── Billing day inline edit (legacy — se mantiene para compatibilidad) ──────
  const [editingBillingDay, setEditingBillingDay] = useState<string | null>(null);
  const [billingDayValue, setBillingDayValue]     = useState<string>("");
  const [savingBillingDay, setSavingBillingDay]   = useState(false);

  // ── Edit enrollment dialog ──────────────────────────────────────────────────
  const [editEnrollment, setEditEnrollment]         = useState<Enrollment | null>(null);
  const [editEnrFee, setEditEnrFee]                 = useState("");
  const [editEnrBillingDay, setEditEnrBillingDay]   = useState("");
  const [editEnrDisciplines, setEditEnrDisciplines] = useState<string[]>([]);
  const [editEnrStatus, setEditEnrStatus]           = useState<"active"|"paused"|"dropped">("active");
  const [editEnrSignupFee, setEditEnrSignupFee]     = useState("");       // costo total inscripción
  const [editEnrSignupPaid, setEditEnrSignupPaid]   = useState("");       // cuánto pagó ya
  const [savingEnrollment, setSavingEnrollment]     = useState(false);

  // ── Liquidar pago parcial ───────────────────────────────────────────────────
  const [settlePayment, setSettlePayment]         = useState<Payment | null>(null);
  const [settleAmount, setSettleAmount]           = useState("");
  const [settleMethod, setSettleMethod]           = useState<Payment["payment_method"]>("cash");
  const [settleDate, setSettleDate]               = useState(new Date().toISOString().slice(0, 10));
  const [savingSettle, setSavingSettle]           = useState(false);

  // ── Liquidar saldo de inscripción ───────────────────────────────────────────
  const [settleSignup, setSettleSignup]           = useState<Enrollment | null>(null);
  const [settleSignupAmount, setSettleSignupAmount] = useState("");
  const [settleSignupMethod, setSettleSignupMethod] = useState<Payment["payment_method"]>("cash");
  const [savingSignupSettle, setSavingSignupSettle] = useState(false);

  // ── Eliminar pago ───────────────────────────────────────────────────────────
  const [deletePaymentTarget, setDeletePaymentTarget] = useState<Payment | null>(null);
  const [deletingPayment, setDeletingPayment]         = useState(false);

  // ── Forms ───────────────────────────────────────────────────────────────────
  const clientForm = useForm<ClientFormData>({
    resolver: zodResolver(clientSchema),
  });

  const contactForm = useForm<ContactFormData>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      phone:                 "",
      name:                  "",
      relationship:          "self",
      receive_notifications: true,
    },
  });

  // ── Loaders ─────────────────────────────────────────────────────────────────

  useEffect(() => {
    const load = async () => {
      try {
        setIsFetching(true);
        const data = await clientsApi.getById(id);
        setClient(data);
        clientForm.reset({
          name:      data.name,
          last_name: data.last_name ?? "",
          email:     data.email ?? "",
          notes:     data.notes ?? "",
        });
      } catch {
        toast.error(`Error al cargar el ${entitySingular.toLowerCase()}`);
        router.push("/clients");
      } finally {
        setIsFetching(false);
      }
    };
    load();
  }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchEnrollments = useCallback(async () => {
    try {
      const data = await enrollmentsApi.getAll({ client: id, limit: 50 });
      setEnrollments(data.results);
      // Cargar detalles de cada grupo en paralelo (para is_individual + schedules)
      const uniqueGroupIds = [...new Set(data.results.map((e) => e.class_group))];
      const details = await Promise.allSettled(
        uniqueGroupIds.map((gid) => classGroupsApi.getById(gid))
      );
      const newMap: Record<string, ClassGroup> = {};
      details.forEach((result, i) => {
        if (result.status === "fulfilled") {
          newMap[uniqueGroupIds[i]] = result.value;
        }
      });
      setGroupDetails((prev) => ({ ...prev, ...newMap }));
    } catch { /* no bloqueante */ }
  }, [id]);

  const fetchPayments = useCallback(async () => {
    try {
      setLoadingPayments(true);
      const data = await paymentsApi.getAll({
        enrollment__client: id,
        ordering: "-due_date",
        limit: 100,
      });
      setPayments(data.results);
    } catch { /* no bloqueante */ }
    finally { setLoadingPayments(false); }
  }, [id]);

  useEffect(() => {
    fetchEnrollments();
    fetchPayments();
    fetchContacts(id);
  }, [fetchEnrollments, fetchPayments, fetchContacts, id]);

  // ── Handlers — client ───────────────────────────────────────────────────────

  const onClientSubmit = async (data: ClientFormData) => {
    try {
      setIsSaving(true);

      // Construir el payload con solo los campos presentes.
      // - name: siempre presente (Zod garantiza min(1)), nunca null.
      // - last_name / email / notes: enviar "" o null cuando se borran
      //   para que DRF los limpie; enviar el valor cuando tienen contenido.
      //   Nunca incluir name: null (el backend lo rechaza con 400).
      const trimmedName = data.name.trim();
      if (!trimmedName) return; // Zod ya lo valida, pero doble-seguro

      const payload: UpdateClientRequest = { name: trimmedName };

      const last_name = data.last_name?.trim() ?? "";
      const email     = data.email?.trim()     ?? "";
      const notes     = data.notes?.trim()     ?? "";

      // Solo incluir si difiere del valor actual (evita PATCHes innecesarios).
      // Normalizar null/"" del backend a "" para comparar correctamente.
      // Cuando el campo se vacía se envía null para que DRF lo limpie.
      const currentLastName = client?.last_name ?? "";
      const currentEmail    = client?.email     ?? "";
      const currentNotes    = client?.notes     ?? "";

      if (last_name !== currentLastName) {
        payload.last_name = last_name || null;
      }
      if (email !== currentEmail) {
        payload.email = email || null;
      }
      if (notes !== currentNotes) {
        payload.notes = notes || null;
      }

      const updated = await clientsApi.update(id, payload);
      setClient(updated);
      setEditDialogOpen(false);
      toast.success(`${entitySingular} actualizado`);
    } catch {
      toast.error(`Error al actualizar el ${entitySingular.toLowerCase()}`);
    } finally {
      setIsSaving(false);
    }
  };

  // ── Handlers — contacts ─────────────────────────────────────────────────────

  const openCreateContact = () => {
    setEditingContact(null);
    contactForm.reset({ phone: "", name: "", relationship: "self", receive_notifications: true });
    setContactDialogOpen(true);
  };

  const openEditContact = (contact: ClientContact) => {
    setEditingContact(contact);
    contactForm.reset({
      phone:                 contact.phone,
      name:                  contact.name ?? "",
      relationship:          contact.relationship,
      receive_notifications: contact.receive_notifications,
    });
    setContactDialogOpen(true);
  };

  const onContactSubmit = async (data: ContactFormData) => {
    try {
      setSavingContact(true);
      if (editingContact) {
        const payload: UpdateClientContactRequest = {
          phone:                 data.phone.trim(),
          name:                  data.name?.trim() || undefined,
          relationship:          data.relationship,
          receive_notifications: data.receive_notifications,
        };
        await updateContact(editingContact.id, payload);
        toast.success("Contacto actualizado");
      } else {
        const payload: CreateClientContactRequest = {
          client:                id,
          phone:                 data.phone.trim(),
          name:                  data.name?.trim() || undefined,
          relationship:          data.relationship,
          receive_notifications: data.receive_notifications,
        };
        await createContact(payload);
        toast.success("Contacto agregado");
        // Recargar el client para actualizar primary_contact_phone
        const refreshed = await clientsApi.getById(id);
        setClient(refreshed);
      }
      setContactDialogOpen(false);
    } catch (err: unknown) {
      const anyErr = err as { response?: { data?: Record<string, string[]> } };
      const apiData = anyErr?.response?.data;
      if (apiData) {
        const msg =
          apiData.phone?.[0] ||
          apiData.non_field_errors?.[0] ||
          "Error al guardar el contacto";
        toast.error(msg);
      } else {
        toast.error("Error al guardar el contacto");
      }
    } finally {
      setSavingContact(false);
    }
  };

  const handleDeleteContact = async () => {
    if (!deleteContactTarget) return;
    try {
      await deleteContact(deleteContactTarget.id);
      toast.success("Contacto eliminado");
      const refreshed = await clientsApi.getById(id);
      setClient(refreshed);
      setDeleteContactTarget(null);
    } catch {
      toast.error("Error al eliminar el contacto");
    }
  };

  // ── Handlers — schedules ───────────────────────────────────────────────────

  const openAddSchedule = (groupId: string, groupName: string, schedules: ClassSchedule[]) => {
    setScheduleTarget({ groupId, groupName, schedules, editingIndex: null });
    setScheduleDay("1");
    setScheduleStart("09:00");
    setScheduleEnd("10:00");
  };

  const openEditSchedule = (groupId: string, groupName: string, schedules: ClassSchedule[], idx: number) => {
    const s = schedules[idx];
    setScheduleTarget({ groupId, groupName, schedules, editingIndex: idx });
    setScheduleDay(String(s.day_of_week));
    setScheduleStart(s.start_time.slice(0, 5)); // "HH:MM"
    setScheduleEnd(s.end_time.slice(0, 5));
  };

  const handleDeleteSchedule = async (groupId: string, schedules: ClassSchedule[], idx: number) => {
    const newSchedules = schedules
      .filter((_, i) => i !== idx)
      .map((s) => ({ day_of_week: s.day_of_week, start_time: s.start_time.slice(0, 5), end_time: s.end_time.slice(0, 5) }));
    try {
      const updated = await classGroupsApi.update(groupId, { schedules: newSchedules });
      setGroupDetails((prev) => ({ ...prev, [groupId]: updated }));
      toast.success("Horario eliminado");
    } catch {
      toast.error("No se pudo eliminar el horario");
    }
  };

  const handleSaveSchedule = async () => {
    if (!scheduleTarget) return;
    const { groupId, schedules, editingIndex } = scheduleTarget;

    if (scheduleStart >= scheduleEnd) {
      toast.error("La hora de fin debe ser después de la hora de inicio");
      return;
    }

    const newSlot = {
      day_of_week: Number(scheduleDay) as 0|1|2|3|4|5|6,
      start_time:  scheduleStart,
      end_time:    scheduleEnd,
    };

    let newSchedules: typeof newSlot[];
    if (editingIndex !== null) {
      // Reemplazar slot existente
      newSchedules = schedules.map((s, i) =>
        i === editingIndex
          ? newSlot
          : { day_of_week: s.day_of_week, start_time: s.start_time.slice(0, 5), end_time: s.end_time.slice(0, 5) }
      );
    } else {
      // Añadir nuevo slot
      newSchedules = [
        ...schedules.map((s) => ({ day_of_week: s.day_of_week, start_time: s.start_time.slice(0, 5), end_time: s.end_time.slice(0, 5) })),
        newSlot,
      ];
    }

    try {
      setSavingSchedule(true);
      const updated = await classGroupsApi.update(groupId, { schedules: newSchedules });
      setGroupDetails((prev) => ({ ...prev, [groupId]: updated }));
      setScheduleTarget(null);
      toast.success(editingIndex !== null ? "Horario actualizado" : "Horario agregado");
    } catch {
      toast.error("No se pudo guardar el horario");
    } finally {
      setSavingSchedule(false);
    }
  };

  // ── Handlers — enrollment edit dialog ──────────────────────────────────────

  const openEditEnrollment = (enrollment: Enrollment) => {
    setEditEnrollment(enrollment);
    setEditEnrFee(enrollment.custom_monthly_fee != null ? String(enrollment.custom_monthly_fee) : "");
    setEditEnrBillingDay(enrollment.custom_billing_day != null ? String(enrollment.custom_billing_day) : "");
    setEditEnrDisciplines(enrollment.disciplines?.map((d) => d.id) ?? []);
    setEditEnrStatus(enrollment.status as "active"|"paused"|"dropped");
    setEditEnrSignupFee(enrollment.signup_fee != null ? String(enrollment.signup_fee) : "");
    setEditEnrSignupPaid(enrollment.signup_fee_paid != null ? String(enrollment.signup_fee_paid) : "");
  };

  const handleSaveEnrollment = async () => {
    if (!editEnrollment) return;
    try {
      setSavingEnrollment(true);

      // Incluir signup_fee / signup_fee_paid solo si cambiaron
      const origSignupFee  = editEnrollment.signup_fee  != null ? String(editEnrollment.signup_fee)  : "";
      const origSignupPaid = editEnrollment.signup_fee_paid != null ? String(editEnrollment.signup_fee_paid) : "";
      const signupFeeChanged  = editEnrSignupFee  !== origSignupFee;
      const signupPaidChanged = editEnrSignupPaid !== origSignupPaid;

      await enrollmentsApi.update(editEnrollment.id, {
        status:             editEnrStatus,
        custom_monthly_fee: editEnrFee.trim()        ? Number(editEnrFee)        : null,
        custom_billing_day: editEnrBillingDay.trim() ? Number(editEnrBillingDay) : null,
        disciplines:        editEnrDisciplines.length > 0 ? editEnrDisciplines : [],
        ...(signupFeeChanged  && { signup_fee:      editEnrSignupFee.trim()  ? Number(editEnrSignupFee)  : null }),
        ...(signupPaidChanged && { signup_fee_paid: editEnrSignupPaid.trim() ? Number(editEnrSignupPaid) : null }),
      });
      toast.success("Inscripción actualizada");
      setEditEnrollment(null);
      fetchEnrollments();
    } catch {
      toast.error("No se pudo actualizar la inscripción");
    } finally {
      setSavingEnrollment(false);
    }
  };

  // ── Handlers — enrollments ──────────────────────────────────────────────────

  const handleTogglePause = async (enrollment: Enrollment) => {
    const newStatus = enrollment.status === "paused" ? "active" : "paused";
    try {
      await enrollmentsApi.update(enrollment.id, { status: newStatus });
      toast.success(newStatus === "paused" ? "Inscripción pausada" : "Inscripción reactivada");
      fetchEnrollments();
    } catch {
      toast.error("No se pudo actualizar el estado");
    }
  };

  const handleSaveBillingDay = async (enrollment: Enrollment) => {
    const val = parseInt(billingDayValue, 10);
    if (isNaN(val) || val < 1 || val > 28) {
      toast.error("El día de pago debe estar entre 1 y 28");
      return;
    }
    try {
      setSavingBillingDay(true);
      await enrollmentsApi.update(enrollment.id, { custom_billing_day: val });
      toast.success("Día de pago actualizado");
      fetchEnrollments();
    } catch {
      toast.error("No se pudo actualizar el día de pago");
    } finally {
      setSavingBillingDay(false);
      setEditingBillingDay(null);
    }
  };

  const handleDrop = async () => {
    if (!dropTarget) return;
    try {
      setDropping(true);
      await enrollmentsApi.update(dropTarget.id, { status: "dropped" });
      toast.success(`Dado de baja de ${dropTarget.class_group_name}`);
      fetchEnrollments();
    } catch {
      toast.error("No se pudo dar de baja");
    } finally {
      setDropping(false);
      setDropTarget(null);
    }
  };

  // ── Handlers — payments ─────────────────────────────────────────────────────

  const buildUnpaid = (e: Enrollment): UnpaidEnrollment => ({
    enrollment_id:    e.id,
    client_id:        e.client,
    client_name:      client?.full_name ?? "",
    client_phone:     client?.primary_contact_phone ?? client?.phone ?? "",
    class_group_name: e.class_group_name,
    monthly_fee:      e.monthly_fee,
  });

  const openRegisterPayment = (enrollment?: Enrollment) => {
    if (enrollment) {
      setPreselectedPaymentEnrollment(buildUnpaid(enrollment));
    } else {
      const active = enrollments.filter((e) => e.status === "active");
      setPreselectedPaymentEnrollment(active.length === 1 ? buildUnpaid(active[0]) : undefined);
    }
    setRegisterPaymentOpen(true);
  };

  const handleRegisterPayment = async (data: {
    enrollment: string;
    payment_method: Payment["payment_method"];
    payment_date: string;
    amount_paid: number;
  }) => {
    try {
      setRegisteringPayment(true);
      await paymentsApi.create(data);
      const monthlyFee = enrollments.find((e) => e.id === data.enrollment)?.monthly_fee;
      const isParcial  = monthlyFee !== undefined && data.amount_paid < monthlyFee;
      toast.success(isParcial ? "Anticipo registrado" : "Pago registrado");
      setRegisterPaymentOpen(false);
      fetchPayments();
    } catch (err: unknown) {
      const anyErr = err as { response?: { data?: Record<string, unknown> } };
      const apiErrors = anyErr?.response?.data;
      if (apiErrors && typeof apiErrors === "object") {
        Object.entries(apiErrors).forEach(([field, messages]) => {
          const msg = Array.isArray(messages) ? messages[0] : String(messages);
          toast.error(`${field}: ${msg}`);
        });
      } else {
        toast.error("Error al registrar el pago");
      }
    } finally {
      setRegisteringPayment(false);
    }
  };

  // ── Handlers — liquidar pago parcial ───────────────────────────────────────

  const openSettlePayment = (payment: Payment) => {
    setSettlePayment(payment);
    setSettleAmount(String(payment.balance));
    setSettleMethod("cash");
    setSettleDate(new Date().toISOString().slice(0, 10));
  };

  const handleSettlePayment = async () => {
    if (!settlePayment) return;
    const newPaid = (settlePayment.amount_paid ?? 0) + (parseFloat(settleAmount) || 0);
    try {
      setSavingSettle(true);
      await paymentsApi.update(settlePayment.id, {
        amount_paid:    newPaid,
        payment_method: settleMethod,
        payment_date:   settleDate,
      });
      toast.success(newPaid >= settlePayment.amount ? "Pago liquidado" : "Anticipo actualizado");
      setSettlePayment(null);
      fetchPayments();
    } catch {
      toast.error("No se pudo actualizar el pago");
    } finally {
      setSavingSettle(false);
    }
  };

  // ── Handlers — liquidar saldo de inscripción ────────────────────────────────

  const openSettleSignup = (enrollment: Enrollment) => {
    setSettleSignup(enrollment);
    setSettleSignupAmount(String(enrollment.signup_fee_balance));
    setSettleSignupMethod("cash");
  };

  const handleSettleSignup = async () => {
    if (!settleSignup) return;
    const newPaid = (settleSignup.signup_fee_paid ?? 0) + (parseFloat(settleSignupAmount) || 0);
    try {
      setSavingSignupSettle(true);
      await enrollmentsApi.update(settleSignup.id, { signup_fee_paid: newPaid });
      toast.success(
        newPaid >= (settleSignup.signup_fee ?? 0)
          ? "Inscripción liquidada"
          : "Anticipo de inscripción actualizado"
      );
      setSettleSignup(null);
      fetchEnrollments();
    } catch {
      toast.error("No se pudo actualizar el saldo de inscripción");
    } finally {
      setSavingSignupSettle(false);
    }
  };

  // ── Handlers — eliminar pago ────────────────────────────────────────────────

  const handleDeletePayment = async () => {
    if (!deletePaymentTarget) return;
    try {
      setDeletingPayment(true);
      await paymentsApi.delete(deletePaymentTarget.id);
      toast.success("Pago eliminado");
      setDeletePaymentTarget(null);
      fetchPayments();
    } catch {
      toast.error("No se pudo eliminar el pago");
    } finally {
      setDeletingPayment(false);
    }
  };

  // ── Render ──────────────────────────────────────────────────────────────────

  if (isFetching) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4" />
          <p className="text-muted-foreground">Cargando {entitySingular.toLowerCase()}...</p>
        </div>
      </div>
    );
  }

  if (!client) return null;

  const activeEnrollments = enrollments.filter((e) => e.status === "active");
  const displayPhone = client.primary_contact_phone ?? client.phone;

  return (
    <div className="space-y-6">

      {/* ── Header ── */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-bold tracking-tight truncate">{client.full_name}</h1>
          <div className="flex items-center gap-4 text-sm text-muted-foreground mt-0.5">
            {displayPhone && (
              <span className="flex items-center gap-1">
                <Phone className="h-3 w-3" />{displayPhone}
              </span>
            )}
            {client.email && (
              <span className="flex items-center gap-1">
                <Mail className="h-3 w-3" />{client.email}
              </span>
            )}
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={() => setEditDialogOpen(true)}>
          <Pencil className="h-4 w-4 mr-2" />
          Editar
        </Button>
      </div>

      {/* ── Layout 2 columnas ── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-start">

        {/* ── Inscripciones (3/5) ── */}
        <Card className="lg:col-span-3">
          <CardHeader className="flex flex-row items-center justify-between gap-3 pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <GraduationCap className="h-4 w-4 text-muted-foreground" />
              Grupos inscritos
              <span className="text-muted-foreground font-normal text-sm">
                ({activeEnrollments.length} activo{activeEnrollments.length !== 1 ? "s" : ""})
              </span>
            </CardTitle>
            <Button size="sm" onClick={() => router.push(`/enrollments/new?client=${id}`)}>
              <UserPlus className="h-4 w-4 mr-2" />
              Inscribir
            </Button>
          </CardHeader>
          <CardContent>
            {enrollments.length === 0 ? (
              <div className="flex flex-col items-center py-8 gap-2 text-center">
                <GraduationCap className="h-10 w-10 text-muted-foreground/30" />
                <p className="text-sm text-muted-foreground">Sin inscripciones en ningún grupo</p>
                <Button variant="outline" size="sm" onClick={() => router.push(`/enrollments/new?client=${id}`)}>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Inscribir en un grupo
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                {enrollments.map((enrollment) => {
                  const group = groupDetails[enrollment.class_group];
                  const isIndividual = group?.is_individual ?? false;
                  const schedules   = group?.schedules ?? [];
                  const disciplines = enrollment.disciplines ?? [];
                  const isDropped   = enrollment.status === "dropped";

                  return (
                    <div
                      key={enrollment.id}
                      className={`rounded-lg border p-4 space-y-3 transition-colors ${
                        isDropped
                          ? "bg-muted/30 border-dashed opacity-70"
                          : "bg-background hover:bg-muted/20"
                      }`}
                    >
                      {/* ── Fila superior: nombre + badge + botones ── */}
                      <div className="flex items-center gap-2">
                        <div className="flex-1 min-w-0">
                          <button
                            type="button"
                            className={`font-semibold text-base text-left truncate w-full leading-tight ${
                              !isDropped ? "hover:text-primary hover:underline" : "text-muted-foreground cursor-default"
                            }`}
                            onClick={() => !isDropped && router.push(`/class-groups/${enrollment.class_group}?from=/clients/${id}`)}
                            disabled={isDropped}
                          >
                            {enrollment.class_group_name}
                          </button>
                        </div>

                        <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold shrink-0 ${STATUS_STYLES[enrollment.status]}`}>
                          {STATUS_LABELS[enrollment.status]}
                        </span>

                        {/* Editar inscripción */}
                        {!isDropped && (
                          <Button
                            variant="outline" size="sm" className="h-8 px-3 shrink-0 gap-1.5"
                            onClick={() => openEditEnrollment(enrollment)}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                            <span className="hidden sm:inline text-xs">Editar</span>
                          </Button>
                        )}

                        {/* Dar de baja */}
                        {!isDropped && (
                          <Button
                            variant="ghost" size="icon" className="h-8 w-8 hover:bg-red-50 shrink-0"
                            title="Dar de baja"
                            onClick={() => setDropTarget(enrollment)}
                          >
                            <UserX className="h-4 w-4 text-red-500" />
                          </Button>
                        )}
                      </div>

                      {/* ── Metadatos: precio · día · disciplinas ── */}
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm">
                        <span className="font-semibold text-green-700">
                          ${enrollment.monthly_fee.toLocaleString("es-MX")}/mes
                        </span>
                        <span className="text-muted-foreground">
                          Día de pago: <strong className="text-foreground font-medium">{enrollment.billing_day}</strong>
                        </span>
                        {disciplines.length > 0 && (
                          <span className="flex items-center gap-1.5 text-muted-foreground">
                            <Music2 className="h-4 w-4 shrink-0" />
                            <span>{disciplines.map((d) => d.name).join(", ")}</span>
                          </span>
                        )}
                      </div>

                      {/* ── Inscripción (signup_fee) con saldo pendiente ── */}
                      {enrollment.signup_fee != null && enrollment.signup_fee > 0 && (
                        <div className={`flex items-center justify-between rounded-md px-3 py-2 text-sm ${
                          enrollment.signup_fee_balance > 0
                            ? "bg-orange-50 border border-orange-200"
                            : "bg-green-50 border border-green-200"
                        }`}>
                          <div className="flex flex-wrap gap-x-3 gap-y-0.5 items-center">
                            <span className="font-medium text-foreground">
                              Inscripción: ${enrollment.signup_fee.toLocaleString("es-MX")}
                            </span>
                            {enrollment.signup_fee_paid != null && (
                              <span className="text-muted-foreground text-xs">
                                Pagado: ${enrollment.signup_fee_paid.toLocaleString("es-MX")}
                              </span>
                            )}
                            {enrollment.signup_fee_balance > 0 ? (
                              <span className="text-orange-700 font-semibold text-xs">
                                Saldo: ${enrollment.signup_fee_balance.toLocaleString("es-MX")}
                              </span>
                            ) : (
                              <span className="text-green-700 text-xs font-medium">Liquidada ✓</span>
                            )}
                          </div>
                          {!isDropped && enrollment.signup_fee_balance > 0 && (
                            <Button
                              size="sm" variant="outline"
                              className="h-7 px-2 text-xs shrink-0 border-orange-300 text-orange-700 hover:bg-orange-50"
                              onClick={() => openSettleSignup(enrollment)}
                            >
                              Liquidar
                            </Button>
                          )}
                        </div>
                      )}

                      {/* ── Horarios (solo clases individuales) ── */}
                      {isIndividual && !isDropped && (
                        <div className="space-y-1.5 pt-1 border-t">
                          {schedules.length === 0 ? (
                            <button
                              type="button"
                              onClick={() => openAddSchedule(enrollment.class_group, enrollment.class_group_name, schedules)}
                              className="flex items-center gap-2 text-sm text-primary font-medium hover:underline py-0.5"
                            >
                              <Plus className="h-4 w-4" />
                              Agregar horario
                            </button>
                          ) : (
                            <div className="space-y-1">
                              {schedules.map((s, idx) => (
                                <div key={idx} className="flex items-center gap-3">
                                  <Clock className="h-4 w-4 text-muted-foreground shrink-0" />
                                  <span className="text-sm flex-1">
                                    {DAYS_SHORT[s.day_of_week]}{" "}
                                    {s.start_time.slice(0, 5)}–{s.end_time.slice(0, 5)}
                                  </span>
                                  {/* Botones siempre visibles */}
                                  <div className="flex items-center gap-1 shrink-0">
                                    <button
                                      onClick={() => openEditSchedule(enrollment.class_group, enrollment.class_group_name, schedules, idx)}
                                      className="p-1.5 rounded text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
                                      title="Editar horario"
                                    >
                                      <Pencil className="h-4 w-4" />
                                    </button>
                                    <button
                                      onClick={() => handleDeleteSchedule(enrollment.class_group, schedules, idx)}
                                      className="p-1.5 rounded text-muted-foreground hover:text-red-600 hover:bg-red-50 transition-colors"
                                      title="Eliminar horario"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </button>
                                  </div>
                                </div>
                              ))}
                              <button
                                type="button"
                                onClick={() => openAddSchedule(enrollment.class_group, enrollment.class_group_name, schedules)}
                                className="flex items-center gap-2 text-sm text-primary font-medium hover:underline pt-0.5"
                              >
                                <Plus className="h-4 w-4" />
                                Agregar horario
                              </button>
                            </div>
                          )}
                        </div>
                      )}

                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* ── Columna derecha (2/5) ── */}
        <div className="lg:col-span-2 space-y-6">

          {/* Datos del alumno — solo lectura */}
          <Card>
            <CardHeader className="pb-3 flex flex-row items-center justify-between gap-2">
              <CardTitle className="text-base">Datos del alumno</CardTitle>
              <Button variant="ghost" size="sm" className="h-7 px-2 text-muted-foreground" onClick={() => setEditDialogOpen(true)}>
                <Pencil className="h-3.5 w-3.5 mr-1" />
                Editar
              </Button>
            </CardHeader>
            <CardContent>
              <dl className="space-y-2 text-sm">
                <div className="flex gap-2">
                  <dt className="text-muted-foreground w-20 shrink-0">Nombre</dt>
                  <dd className="font-medium">{client.full_name}</dd>
                </div>
                {(client.primary_contact_phone ?? client.phone) && (
                  <div className="flex gap-2">
                    <dt className="text-muted-foreground w-20 shrink-0">Teléfono</dt>
                    <dd>{client.primary_contact_phone ?? client.phone}</dd>
                  </div>
                )}
                {client.email && (
                  <div className="flex gap-2">
                    <dt className="text-muted-foreground w-20 shrink-0">Email</dt>
                    <dd>{client.email}</dd>
                  </div>
                )}
                {client.notes && (
                  <div className="flex gap-2">
                    <dt className="text-muted-foreground w-20 shrink-0">Notas</dt>
                    <dd className="text-foreground/80 italic text-sm">{client.notes}</dd>
                  </div>
                )}
              </dl>
            </CardContent>
          </Card>

          {/* ── Contactos ── */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-3 pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                Contactos
                {contacts.length > 0 && (
                  <span className="text-muted-foreground font-normal text-sm">
                    ({contacts.length})
                  </span>
                )}
              </CardTitle>
              <Button size="sm" variant="outline" onClick={openCreateContact}>
                <Plus className="h-4 w-4 mr-1" />
                Agregar
              </Button>
            </CardHeader>
            <CardContent>
              {loadingContacts ? (
                <div className="flex justify-center py-4">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : contacts.length === 0 ? (
                <div className="flex flex-col items-center py-6 gap-2 text-center">
                  <Users className="h-8 w-8 text-muted-foreground/30" />
                  <p className="text-sm text-muted-foreground">Sin contactos registrados</p>
                  <Button variant="outline" size="sm" onClick={openCreateContact}>
                    <Plus className="h-4 w-4 mr-1" />
                    Agregar contacto
                  </Button>
                </div>
              ) : (
                <div className="divide-y">
                  {contacts.map((contact) => (
                    <div key={contact.id} className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-sm truncate">
                            {contact.name || contact.relationship_display}
                          </p>
                          {contact.receive_notifications ? (
                            <Bell className="h-3 w-3 text-green-600 shrink-0" aria-label="Recibe WhatsApp" />
                          ) : (
                            <BellOff className="h-3 w-3 text-muted-foreground/50 shrink-0" aria-label="No recibe notificaciones" />
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                          <Phone className="h-3 w-3 shrink-0" />
                          <span>{contact.phone}</span>
                          <span className="text-muted-foreground/50">·</span>
                          <span>{contact.relationship_display}</span>
                        </div>
                      </div>
                      <div className="flex gap-1 shrink-0">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEditContact(contact)}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost" size="icon"
                          className="h-7 w-7 hover:bg-red-50"
                          onClick={() => setDeleteContactTarget(contact)}
                        >
                          <Trash2 className="h-3.5 w-3.5 text-red-500" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

        </div>
      </div>

      {/* ── Historial de pagos ── */}
      <Card>
        <CardHeader className="pb-3 flex flex-row items-center justify-between gap-3">
          <CardTitle className="text-base flex items-center gap-2">
            <CreditCard className="h-4 w-4 text-muted-foreground" />
            Historial de pagos
            {!loadingPayments && payments.length > 0 && (
              <span className="text-muted-foreground font-normal text-sm">({payments.length})</span>
            )}
          </CardTitle>
          <Button size="sm" onClick={() => openRegisterPayment()}>
            <Plus className="h-4 w-4 mr-2" />
            Registrar pago
          </Button>
        </CardHeader>
        <CardContent>
          {loadingPayments ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : payments.length === 0 ? (
            <div className="flex flex-col items-center py-8 gap-2 text-center">
              <CreditCard className="h-10 w-10 text-muted-foreground/30" />
              <p className="text-sm text-muted-foreground">Sin pagos registrados</p>
              <Button variant="outline" size="sm" onClick={() => openRegisterPayment()}>
                <Plus className="h-4 w-4 mr-2" />
                Registrar primer pago
              </Button>
            </div>
          ) : (
            <div className="divide-y">
              {payments.map((payment) => {
                const isOverdue  = payment.status === "overdue";
                const isPartial  = payment.status === "partial";
                const isPending  = payment.status === "pending";
                const needAction = isOverdue || isPartial || isPending;

                return (
                  <div
                    key={payment.id}
                    className={`flex items-center gap-3 py-3 first:pt-0 last:pb-0 ${
                      isOverdue ? "bg-red-50/50 -mx-6 px-6 rounded" :
                      isPartial ? "bg-orange-50/40 -mx-6 px-6 rounded" : ""
                    }`}
                  >
                    {/* Icono de estado */}
                    <div className="shrink-0">
                      {payment.status === "paid" ? (
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      ) : isOverdue ? (
                        <AlertTriangle className="h-5 w-5 text-red-500" />
                      ) : isPartial ? (
                        <AlertTriangle className="h-5 w-5 text-orange-500" />
                      ) : (
                        <CheckCircle className="h-5 w-5 text-gray-300" />
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{payment.class_group_name}</p>
                      <div className="flex items-center flex-wrap gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
                        {payment.payment_date && <span>{formatDate(payment.payment_date)}</span>}
                        {payment.payment_method && (
                          <span>{METHOD_LABELS[payment.payment_method] ?? payment.payment_method}</span>
                        )}
                        {payment.due_date && isOverdue && (
                          <span className="text-red-600 font-medium">Venció: {formatDate(payment.due_date)}</span>
                        )}
                        {/* Saldo pendiente en parciales */}
                        {isPartial && payment.balance > 0 && (
                          <span className="text-orange-600 font-medium">
                            Saldo: ${payment.balance.toLocaleString("es-MX")}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Monto */}
                    <div className="text-right shrink-0">
                      <p className={`font-semibold text-sm ${isOverdue ? "text-red-600" : isPartial ? "text-orange-600" : ""}`}>
                        {isPartial && payment.amount_paid != null
                          ? `$${payment.amount_paid.toLocaleString("es-MX")}`
                          : `$${payment.amount.toLocaleString("es-MX")}`}
                      </p>
                      {isPartial && (
                        <p className="text-xs text-muted-foreground">
                          de ${payment.amount.toLocaleString("es-MX")}
                        </p>
                      )}
                    </div>

                    {/* Acción principal */}
                    {needAction ? (
                      <Button
                        size="sm" variant="outline"
                        className={`shrink-0 ${
                          isOverdue
                            ? "border-red-200 text-red-600 hover:bg-red-50"
                            : "border-orange-200 text-orange-700 hover:bg-orange-50"
                        }`}
                        onClick={() => {
                          if (isPartial) {
                            openSettlePayment(payment);
                          } else {
                            const enrollment = enrollments.find((e) => e.id === payment.enrollment);
                            if (enrollment) openRegisterPayment(enrollment);
                            else openRegisterPayment();
                          }
                        }}
                      >
                        {isPartial ? "Liquidar" : "Cobrar"}
                      </Button>
                    ) : (
                      <span className={`hidden sm:inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium shrink-0 ${PAYMENT_STATUS_STYLES[payment.status]}`}>
                        {PAYMENT_STATUS_LABELS[payment.status]}
                      </span>
                    )}

                    {/* Eliminar pago */}
                    <Button
                      variant="ghost" size="icon"
                      className="h-7 w-7 shrink-0 hover:bg-red-50 text-muted-foreground/40 hover:text-red-500"
                      title="Eliminar pago"
                      onClick={() => setDeletePaymentTarget(payment)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Modal: Editar inscripción ── */}
      <Dialog open={!!editEnrollment} onOpenChange={(o) => !o && setEditEnrollment(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Editar inscripción</DialogTitle>
          </DialogHeader>
          {editEnrollment && (
            <div className="space-y-4 mt-1">

              <p className="text-sm text-muted-foreground truncate font-medium">
                {editEnrollment.class_group_name}
              </p>

              {/* Estado */}
              <div className="space-y-1.5">
                <Label>Estado</Label>
                <Select
                  value={editEnrStatus}
                  onValueChange={(v) => setEditEnrStatus(v as typeof editEnrStatus)}
                  disabled={savingEnrollment}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Activo</SelectItem>
                    <SelectItem value="paused">Pausado</SelectItem>
                    <SelectItem value="dropped">Baja</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {/* Mensualidad */}
                <div className="space-y-1.5">
                  <Label htmlFor="enr-fee">
                    Mensualidad <span className="text-muted-foreground text-xs">(MXN)</span>
                  </Label>
                  <Input
                    id="enr-fee"
                    type="number"
                    min={0}
                    placeholder={String(editEnrollment.monthly_fee)}
                    value={editEnrFee}
                    onChange={(e) => setEditEnrFee(e.target.value)}
                    disabled={savingEnrollment}
                  />
                </div>

                {/* Día de pago */}
                <div className="space-y-1.5">
                  <Label htmlFor="enr-day">
                    Día de pago <span className="text-muted-foreground text-xs">(1-28)</span>
                  </Label>
                  <Input
                    id="enr-day"
                    type="number"
                    min={1}
                    max={28}
                    placeholder={String(editEnrollment.billing_day)}
                    value={editEnrBillingDay}
                    onChange={(e) => setEditEnrBillingDay(e.target.value)}
                    disabled={savingEnrollment}
                  />
                </div>
              </div>

              {/* Disciplinas */}
              <div className="space-y-1.5">
                <Label>Disciplinas</Label>
                <DisciplineMultiSelect
                  value={editEnrDisciplines}
                  onChange={setEditEnrDisciplines}
                  disabled={savingEnrollment}
                />
              </div>

              {/* ── Inscripción (signup_fee) ── */}
              <div className="rounded-lg border bg-muted/20 p-3 space-y-3">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Inscripción (pago único)
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="enr-signup-fee">
                      Costo <span className="text-muted-foreground text-xs">(MXN)</span>
                    </Label>
                    <Input
                      id="enr-signup-fee"
                      type="number"
                      min={0}
                      placeholder={editEnrollment.signup_fee != null ? String(editEnrollment.signup_fee) : "Sin cargo"}
                      value={editEnrSignupFee}
                      onChange={(e) => setEditEnrSignupFee(e.target.value)}
                      disabled={savingEnrollment}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="enr-signup-paid">
                      Ya pagó <span className="text-muted-foreground text-xs">(MXN)</span>
                    </Label>
                    <Input
                      id="enr-signup-paid"
                      type="number"
                      min={0}
                      max={editEnrSignupFee ? Number(editEnrSignupFee) : undefined}
                      placeholder="0"
                      value={editEnrSignupPaid}
                      onChange={(e) => setEditEnrSignupPaid(e.target.value)}
                      disabled={savingEnrollment}
                    />
                  </div>
                </div>
                {/* Resumen en tiempo real */}
                {editEnrSignupFee && Number(editEnrSignupFee) > 0 && (
                  <div className={`text-xs font-medium rounded px-2 py-1 ${
                    Number(editEnrSignupPaid) >= Number(editEnrSignupFee)
                      ? "bg-green-100 text-green-700"
                      : Number(editEnrSignupPaid) > 0
                        ? "bg-orange-100 text-orange-700"
                        : "bg-muted text-muted-foreground"
                  }`}>
                    {Number(editEnrSignupPaid) >= Number(editEnrSignupFee)
                      ? "✓ Inscripción liquidada"
                      : Number(editEnrSignupPaid) > 0
                        ? `Saldo pendiente: $${(Number(editEnrSignupFee) - Number(editEnrSignupPaid)).toLocaleString("es-MX")}`
                        : `Pendiente de pago: $${Number(editEnrSignupFee).toLocaleString("es-MX")}`}
                  </div>
                )}
              </div>

              <div className="flex gap-2 pt-1">
                <Button onClick={handleSaveEnrollment} disabled={savingEnrollment} className="flex-1">
                  {savingEnrollment && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Guardar
                </Button>
                <Button variant="outline" onClick={() => setEditEnrollment(null)} disabled={savingEnrollment}>
                  Cancelar
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ── Modal: Horario (agregar / editar slot) ── */}
      <Dialog open={!!scheduleTarget} onOpenChange={(o) => !o && setScheduleTarget(null)}>
        <DialogContent className="max-w-xs">
          <DialogHeader>
            <DialogTitle>
              {scheduleTarget?.editingIndex !== null ? "Editar horario" : "Agregar horario"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-1">

            {scheduleTarget?.groupName && (
              <p className="text-sm text-muted-foreground truncate">{scheduleTarget.groupName}</p>
            )}

            <div className="space-y-1.5">
              <Label>Día de la semana</Label>
              <Select value={scheduleDay} onValueChange={setScheduleDay} disabled={savingSchedule}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {DAYS_FULL.map((d) => (
                    <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="sch-start">Hora inicio</Label>
                <Input
                  id="sch-start"
                  type="time"
                  value={scheduleStart}
                  onChange={(e) => setScheduleStart(e.target.value)}
                  disabled={savingSchedule}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="sch-end">Hora fin</Label>
                <Input
                  id="sch-end"
                  type="time"
                  value={scheduleEnd}
                  onChange={(e) => setScheduleEnd(e.target.value)}
                  disabled={savingSchedule}
                />
              </div>
            </div>

            <div className="flex gap-2 pt-1">
              <Button onClick={handleSaveSchedule} disabled={savingSchedule} className="flex-1">
                {savingSchedule && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Guardar
              </Button>
              <Button variant="outline" onClick={() => setScheduleTarget(null)} disabled={savingSchedule}>
                Cancelar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Modal: Editar alumno ── */}
      <Dialog open={editDialogOpen} onOpenChange={(o) => {
        setEditDialogOpen(o);
        if (!o) clientForm.reset({ name: client?.name, last_name: client?.last_name ?? "", email: client?.email ?? "", notes: client?.notes ?? "" });
      }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar {entitySingular}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-1">

            {/* ── Sección: Datos del alumno ── */}
            <div className="rounded-lg border bg-muted/20 p-4 space-y-3">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Datos del alumno</p>
              <div className="grid gap-3 grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="edit-name">Nombre <span className="text-destructive">*</span></Label>
                  <Input id="edit-name" disabled={isSaving} placeholder="Ej: Sofía" {...clientForm.register("name")} />
                  {clientForm.formState.errors.name && (
                    <p className="text-xs text-red-500">{clientForm.formState.errors.name.message}</p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="edit-last-name">Apellido</Label>
                  <Input id="edit-last-name" disabled={isSaving} placeholder="Ej: Ramírez" {...clientForm.register("last_name")} />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="edit-email">Email <span className="text-muted-foreground text-xs">(opcional)</span></Label>
                <Input id="edit-email" type="email" disabled={isSaving} placeholder="sofia@ejemplo.com" {...clientForm.register("email")} />
                {clientForm.formState.errors.email && (
                  <p className="text-xs text-red-500">{clientForm.formState.errors.email.message}</p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="edit-notes">Notas internas <span className="text-muted-foreground text-xs">(opcional)</span></Label>
                <Input id="edit-notes" disabled={isSaving} placeholder="Ej: Viene los sábados" {...clientForm.register("notes")} />
              </div>
            </div>

            {/* ── Sección: Contactos ── */}
            <div className="rounded-lg border bg-muted/20 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Contactos</p>
                <Button type="button" size="sm" variant="ghost" className="h-7 px-2 text-xs" onClick={openCreateContact}>
                  <Plus className="h-3.5 w-3.5 mr-1" />
                  Agregar
                </Button>
              </div>

              {loadingContacts ? (
                <div className="flex justify-center py-3">
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                </div>
              ) : contacts.length === 0 ? (
                <p className="text-xs text-muted-foreground italic">Sin contactos. Usa "Agregar" para añadir uno.</p>
              ) : (
                <div className="space-y-2">
                  {contacts.map((contact) => (
                    <div key={contact.id} className="flex items-center gap-2 rounded-md border bg-background px-3 py-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm font-medium truncate">{contact.name || contact.relationship_display}</span>
                          {contact.receive_notifications
                            ? <Bell className="h-3 w-3 text-green-600 shrink-0" />
                            : <BellOff className="h-3 w-3 text-muted-foreground/40 shrink-0" />
                          }
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5">
                          <Phone className="h-3 w-3 shrink-0" />
                          <span>{contact.phone}</span>
                          <span>·</span>
                          <span>{contact.relationship_display}</span>
                        </div>
                      </div>
                      <div className="flex gap-1 shrink-0">
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => openEditContact(contact)}>
                          <Pencil className="h-3 w-3" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-6 w-6 hover:bg-red-50" onClick={() => setDeleteContactTarget(contact)}>
                          <Trash2 className="h-3 w-3 text-red-500" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* ── Acciones ── */}
            <form onSubmit={clientForm.handleSubmit(onClientSubmit)}>
              <div className="flex gap-2">
                <Button type="submit" disabled={isSaving} className="flex-1">
                  {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Guardar datos
                </Button>
                <Button type="button" variant="outline" onClick={() => setEditDialogOpen(false)} disabled={isSaving}>
                  Cerrar
                </Button>
              </div>
            </form>

          </div>
        </DialogContent>
      </Dialog>

      {/* ── Modal: Crear / Editar contacto ── */}
      <Dialog
        open={contactDialogOpen}
        onOpenChange={(open) => { setContactDialogOpen(open); if (!open) setEditingContact(null); }}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{editingContact ? "Editar contacto" : "Agregar contacto"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={contactForm.handleSubmit(onContactSubmit)} className="space-y-4 mt-2">

            <div className="space-y-1.5">
              <Label htmlFor="contact-phone">Teléfono <span className="text-destructive">*</span></Label>
              <Input
                id="contact-phone"
                type="tel"
                placeholder="9991234567"
                disabled={savingContact}
                {...contactForm.register("phone")}
              />
              {contactForm.formState.errors.phone && (
                <p className="text-xs text-red-500">{contactForm.formState.errors.phone.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="contact-name">Nombre del contacto</Label>
              <Input
                id="contact-name"
                placeholder="Ej: Lorna (vacío si es el alumno)"
                disabled={savingContact}
                {...contactForm.register("name")}
              />
            </div>

            <div className="space-y-1.5">
              <Label>Relación</Label>
              <Select
                value={contactForm.watch("relationship")}
                onValueChange={(v) => contactForm.setValue("relationship", v as ContactRelationship)}
                disabled={savingContact}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {RELATIONSHIP_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-3">
              <input
                id="contact-notif"
                type="checkbox"
                className="h-4 w-4 rounded border border-input"
                disabled={savingContact}
                checked={contactForm.watch("receive_notifications")}
                onChange={(e) => contactForm.setValue("receive_notifications", e.target.checked)}
              />
              <Label htmlFor="contact-notif" className="cursor-pointer font-normal">
                Recibe notificaciones WhatsApp
              </Label>
            </div>

            <div className="flex gap-2 pt-1">
              <Button type="submit" disabled={savingContact} className="flex-1">
                {savingContact && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {editingContact ? "Guardar cambios" : "Agregar contacto"}
              </Button>
              <Button type="button" variant="outline" onClick={() => setContactDialogOpen(false)} disabled={savingContact}>
                Cancelar
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── Modal: Eliminar contacto ── */}
      <AlertDialog open={!!deleteContactTarget} onOpenChange={(open) => !open && setDeleteContactTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar contacto?</AlertDialogTitle>
            <AlertDialogDescription>
              Se eliminará el contacto{" "}
              <strong>{deleteContactTarget?.name || deleteContactTarget?.phone}</strong>.
              Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteContact} className="bg-red-600 hover:bg-red-700">
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ── Modal: Registrar pago ── */}
      <Dialog open={registerPaymentOpen} onOpenChange={(o) => { setRegisterPaymentOpen(o); if (!o) setPreselectedPaymentEnrollment(undefined); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Registrar pago</DialogTitle>
          </DialogHeader>
          <RegisterPaymentForm
            onSubmit={handleRegisterPayment}
            onCancel={() => { setRegisterPaymentOpen(false); setPreselectedPaymentEnrollment(undefined); }}
            isLoading={registeringPayment}
            preselectedEnrollment={preselectedPaymentEnrollment}
            clientFilter={preselectedPaymentEnrollment ? undefined : id}
          />
        </DialogContent>
      </Dialog>

      {/* ── Modal: Confirmar baja ── */}
      <AlertDialog open={!!dropTarget} onOpenChange={(open) => !open && setDropTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Dar de baja de {dropTarget?.class_group_name}?</AlertDialogTitle>
            <AlertDialogDescription>
              La inscripción se marcará como <strong>Baja</strong>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={dropping}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDrop} disabled={dropping} className="bg-red-600 hover:bg-red-700">
              {dropping && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Dar de baja
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ── Modal: Liquidar pago parcial ── */}
      <Dialog open={!!settlePayment} onOpenChange={(o) => !o && setSettlePayment(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Liquidar pago parcial</DialogTitle>
          </DialogHeader>
          {settlePayment && (
            <div className="space-y-4 mt-1">
              <div className="rounded-lg border bg-muted/20 p-3 text-sm space-y-1">
                <p className="font-medium">{settlePayment.class_group_name}</p>
                <div className="flex gap-4 text-muted-foreground">
                  <span>Total: <strong className="text-foreground">${settlePayment.amount.toLocaleString("es-MX")}</strong></span>
                  <span>Pagado: <strong className="text-foreground">${(settlePayment.amount_paid ?? 0).toLocaleString("es-MX")}</strong></span>
                  <span className="text-orange-700 font-semibold">Saldo: ${settlePayment.balance.toLocaleString("es-MX")}</span>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="settle-amount">Monto a pagar ahora</Label>
                <Input
                  id="settle-amount"
                  type="number"
                  min={1}
                  max={settlePayment.balance}
                  placeholder={`Máx. $${settlePayment.balance.toLocaleString("es-MX")}`}
                  value={settleAmount}
                  onChange={(e) => setSettleAmount(e.target.value)}
                  disabled={savingSettle}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Método</Label>
                  <Select value={settleMethod} onValueChange={(v) => setSettleMethod(v as Payment["payment_method"])} disabled={savingSettle}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cash">Efectivo</SelectItem>
                      <SelectItem value="card">Tarjeta</SelectItem>
                      <SelectItem value="transfer">Transferencia</SelectItem>
                      <SelectItem value="other">Otro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Fecha</Label>
                  <DatePicker value={settleDate} onChange={setSettleDate} placeholder="dd/mm/yyyy" />
                </div>
              </div>

              <div className="flex gap-2 pt-1">
                <Button onClick={handleSettlePayment} disabled={savingSettle || !settleAmount} className="flex-1">
                  {savingSettle && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Confirmar pago
                </Button>
                <Button variant="outline" onClick={() => setSettlePayment(null)} disabled={savingSettle}>
                  Cancelar
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ── Modal: Liquidar saldo de inscripción ── */}
      <Dialog open={!!settleSignup} onOpenChange={(o) => !o && setSettleSignup(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Liquidar saldo de inscripción</DialogTitle>
          </DialogHeader>
          {settleSignup && (
            <div className="space-y-4 mt-1">
              <div className="rounded-lg border bg-muted/20 p-3 text-sm space-y-1">
                <p className="font-medium">{settleSignup.class_group_name}</p>
                <div className="flex gap-4 text-muted-foreground">
                  <span>Total: <strong className="text-foreground">${(settleSignup.signup_fee ?? 0).toLocaleString("es-MX")}</strong></span>
                  <span>Pagado: <strong className="text-foreground">${(settleSignup.signup_fee_paid ?? 0).toLocaleString("es-MX")}</strong></span>
                  <span className="text-orange-700 font-semibold">Saldo: ${settleSignup.signup_fee_balance.toLocaleString("es-MX")}</span>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="settle-signup-amount">Monto a pagar ahora</Label>
                <Input
                  id="settle-signup-amount"
                  type="number"
                  min={1}
                  max={settleSignup.signup_fee_balance}
                  placeholder={`Máx. $${settleSignup.signup_fee_balance.toLocaleString("es-MX")}`}
                  value={settleSignupAmount}
                  onChange={(e) => setSettleSignupAmount(e.target.value)}
                  disabled={savingSignupSettle}
                />
              </div>

              <div className="space-y-1.5">
                <Label>Método</Label>
                <Select value={settleSignupMethod} onValueChange={(v) => setSettleSignupMethod(v as Payment["payment_method"])} disabled={savingSignupSettle}>
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
                <Button onClick={handleSettleSignup} disabled={savingSignupSettle || !settleSignupAmount} className="flex-1">
                  {savingSignupSettle && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Confirmar pago
                </Button>
                <Button variant="outline" onClick={() => setSettleSignup(null)} disabled={savingSignupSettle}>
                  Cancelar
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ── AlertDialog: Eliminar pago ── */}
      <AlertDialog
        open={!!deletePaymentTarget}
        onOpenChange={(open) => !open && setDeletePaymentTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar este pago?</AlertDialogTitle>
            <AlertDialogDescription>
              {deletePaymentTarget && (
                <>
                  Se eliminará el pago de{" "}
                  <strong>
                    {deletePaymentTarget.amount_paid != null
                      ? `$${deletePaymentTarget.amount_paid.toLocaleString("es-MX")} de $${deletePaymentTarget.amount.toLocaleString("es-MX")}`
                      : `$${deletePaymentTarget.amount.toLocaleString("es-MX")}`}
                  </strong>{" "}
                  ({deletePaymentTarget.class_group_name}
                  {deletePaymentTarget.payment_date ? ` · ${formatDate(deletePaymentTarget.payment_date)}` : ""}).
                  {" "}Esta acción no se puede deshacer.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deletingPayment}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeletePayment}
              disabled={deletingPayment}
              className="bg-red-600 hover:bg-red-700"
            >
              {deletingPayment && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Eliminar pago
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </div>
  );
}
