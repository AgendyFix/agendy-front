"use client";

// ============================================
// APPOINTMENT DETAIL PAGE - Ver/editar cita + Notas
// ============================================

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { ArrowLeft, Calendar, Clock, User, MapPin, DollarSign, MessageSquare, Plus, Trash2, Pencil, Check, X, Save, Users, FileText, Tag } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { appointmentsApi } from "@/lib/api/appointments";
import { clientsApi } from "@/lib/api/clients";
import { servicesApi } from "@/lib/api/services";
import { employeesApi } from "@/lib/api/employees";
import { teamsApi } from "@/lib/api/teams";
import type { Appointment, Note, AppointmentStatus, Client, Service, Employee, Team } from "@/lib/types/models";

const appointmentEditSchema = z.object({
  client: z.string().min(1, "El cliente es requerido"),
  service: z.string().optional(),
  start_at: z.string().min(1, "La fecha es requerida"),
  end_at: z.string().optional(),
  title: z.string().optional(),
  description: z.string().optional(),
  location: z.string().optional(),
  estimated_price: z.string().optional(),
  advance_payment: z.string().optional(),
  client_notes: z.string().optional(),
  custom_service_description: z.string().optional(),
  assigned_to: z.string().optional(),
  team: z.string().optional(),
  source: z.string().optional(),
}).refine((data) => {
  // Validar que advance_payment no sea negativo
  if (data.advance_payment) {
    const advance = parseFloat(data.advance_payment);
    if (isNaN(advance) || advance < 0) {
      return false;
    }
  }
  return true;
}, {
  message: "El anticipo debe ser un número positivo",
  path: ["advance_payment"],
}).refine((data) => {
  // Validar que advance_payment no sea mayor que estimated_price
  if (data.advance_payment && data.estimated_price) {
    const advance = parseFloat(data.advance_payment);
    const price = parseFloat(data.estimated_price);
    if (!isNaN(advance) && !isNaN(price) && advance > price) {
      return false;
    }
  }
  return true;
}, {
  message: "El anticipo no puede ser mayor que el precio estimado",
  path: ["advance_payment"],
});

const statusLabels = {
  pending: "Pendiente",
  confirmed: "Confirmada",
  in_progress: "En Progreso",
  completed: "Completada",
  cancelled: "Cancelada",
  rejected: "Rechazada",
};

const statusColors = {
  pending: "bg-yellow-50 text-yellow-700",
  confirmed: "bg-blue-50 text-blue-700",
  in_progress: "bg-purple-50 text-purple-700",
  completed: "bg-green-50 text-green-700",
  cancelled: "bg-gray-50 text-gray-700",
  rejected: "bg-red-50 text-red-700",
};

export default function AppointmentDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [notes, setNotes] = useState<Note[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [newNoteText, setNewNoteText] = useState("");
  const [deleteNoteId, setDeleteNoteId] = useState<string | null>(null);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editNoteText, setEditNoteText] = useState("");
  const [isEditingAppointment, setIsEditingAppointment] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(appointmentEditSchema),
  });

  useEffect(() => {
    loadAppointment();
  }, [id]);

  const loadAppointment = async () => {
    try {
      setIsFetching(true);
      const [appointmentData, clientsRes, servicesRes, employeesRes, teamsRes] = await Promise.all([
        appointmentsApi.getById(id),
        clientsApi.getAll({ limit: 100, offset: 0 }),
        servicesApi.getAll({}),
        employeesApi.getAll({ limit: 100, offset: 0 }),
        teamsApi.getAll({ limit: 100, offset: 0 }),
      ]);

      setAppointment(appointmentData);
      setNotes(appointmentData.notes || []);
      setClients(clientsRes.results);
      setServices(servicesRes.results);
      setEmployees(employeesRes.results);
      setTeams(teamsRes.results);

      // Extraer IDs de client y service (pueden venir como objetos o strings)
      const clientId = typeof appointmentData.client === 'string'
        ? appointmentData.client
        : appointmentData.client?.id || "";

      const serviceId = appointmentData.service
        ? (typeof appointmentData.service === 'string'
          ? appointmentData.service
          : appointmentData.service?.id || "")
        : "";

      const assignedToId = appointmentData.assigned_to?.id || "";
      const teamId = appointmentData.team?.id || "";

      // Pre-populate form
      reset({
        client: clientId,
        service: serviceId,
        start_at: appointmentData.start_at.slice(0, 16), // Format for datetime-local
        end_at: appointmentData.end_at?.slice(0, 16) || "",
        title: appointmentData.title || "",
        description: appointmentData.description || "",
        location: appointmentData.location || "",
        estimated_price: appointmentData.estimated_price || "",
        advance_payment: appointmentData.advance_payment || "",
        client_notes: appointmentData.client_notes || "",
        custom_service_description: appointmentData.custom_service_description || "",
        assigned_to: assignedToId,
        team: teamId,
        source: appointmentData.source || "",
      });
    } catch (error) {
      toast.error("Error al cargar la cita");
      router.push("/appointments");
    } finally {
      setIsFetching(false);
    }
  };

  // Resetear formulario cuando se activa modo edición
  useEffect(() => {
    if (isEditingAppointment && appointment) {
      // Extraer IDs de client y service
      const clientId = typeof appointment.client === 'string'
        ? appointment.client
        : appointment.client?.id || "";

      const serviceId = appointment.service
        ? (typeof appointment.service === 'string'
          ? appointment.service
          : appointment.service?.id || "")
        : "";

      const assignedToId = appointment.assigned_to?.id || "";
      const teamId = appointment.team?.id || "";

      reset({
        client: clientId,
        service: serviceId,
        start_at: appointment.start_at.slice(0, 16),
        end_at: appointment.end_at?.slice(0, 16) || "",
        title: appointment.title || "",
        description: appointment.description || "",
        location: appointment.location || "",
        estimated_price: appointment.estimated_price || "",
        advance_payment: appointment.advance_payment || "",
        client_notes: appointment.client_notes || "",
        custom_service_description: appointment.custom_service_description || "",
        assigned_to: assignedToId,
        team: teamId,
        source: appointment.source || "",
      });
    }
  }, [isEditingAppointment, appointment, reset]);

  const handleStatusChange = async (newStatus: string) => {
    if (!appointment) return;

    try {
      setIsLoading(true);
      const updated = await appointmentsApi.updateStatus(id, {
        status: newStatus as AppointmentStatus
      });
      setAppointment(updated);
      toast.success("Estado actualizado exitosamente");
    } catch (error) {
      toast.error("Error al actualizar el estado");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddNote = async () => {
    if (!newNoteText.trim()) {
      toast.error("La nota no puede estar vacía");
      return;
    }

    try {
      setIsLoading(true);
      const newNote = await appointmentsApi.createNote(id, {
        description: newNoteText.trim(),
        is_internal: true, // Todas las notas son internas
      });
      setNotes([...notes, newNote]);
      setNewNoteText("");
      toast.success("Nota agregada exitosamente");
    } catch (error) {
      toast.error("Error al agregar nota");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    try {
      setIsLoading(true);
      await appointmentsApi.deleteNote(id, noteId);
      setNotes(notes.filter(n => n.id !== noteId));
      setDeleteNoteId(null);
      toast.success("Nota eliminada");
    } catch (error) {
      toast.error("Error al eliminar nota");
    } finally {
      setIsLoading(false);
    }
  };

  const startEditNote = (note: Note) => {
    setEditingNoteId(note.id);
    setEditNoteText(note.description || "");
  };

  const cancelEditNote = () => {
    setEditingNoteId(null);
    setEditNoteText("");
  };

  const handleUpdateNote = async (noteId: string) => {
    if (!editNoteText.trim()) {
      toast.error("La nota no puede estar vacía");
      return;
    }

    try {
      setIsLoading(true);
      const updated = await appointmentsApi.updateNote(id, noteId, {
        description: editNoteText.trim(),
        is_internal: true, // Mantener como interna
      });
      setNotes(notes.map(n => n.id === noteId ? updated : n));
      cancelEditNote();
      toast.success("Nota actualizada");
    } catch (error) {
      toast.error("Error al actualizar nota");
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateAppointment = async (data: z.infer<typeof appointmentEditSchema>) => {
    try {
      setIsLoading(true);

      const cleanData: Record<string, string> = {
        client: data.client,
        start_at: data.start_at,
      };

      if (data.service && data.service !== "none") cleanData.service = data.service;
      if (data.end_at) cleanData.end_at = data.end_at;
      if (data.title?.trim()) cleanData.title = data.title.trim();
      if (data.description?.trim()) cleanData.description = data.description.trim();
      if (data.location?.trim()) cleanData.location = data.location.trim();
      if (data.estimated_price?.trim()) cleanData.estimated_price = data.estimated_price.trim();
      if (data.advance_payment?.trim()) cleanData.advance_payment = data.advance_payment.trim();
      if (data.client_notes?.trim()) cleanData.client_notes = data.client_notes.trim();
      if (data.custom_service_description?.trim()) {
        cleanData.custom_service_description = data.custom_service_description.trim();
      }
      if (data.assigned_to && data.assigned_to !== "none") cleanData.assigned_to = data.assigned_to;
      if (data.team && data.team !== "none") cleanData.team = data.team;
      if (data.source && data.source !== "none") cleanData.source = data.source;

      const updated = await appointmentsApi.update(id, cleanData);
      setAppointment(updated);
      setIsEditingAppointment(false);
      toast.success("Cita actualizada exitosamente");
    } catch (error) {
      toast.error("Error al actualizar la cita");
    } finally {
      setIsLoading(false);
    }
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString("es-MX", {
      day: "2-digit",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Detectar si la ubicación es una URL
  const isUrl = (text: string) => {
    try {
      const url = new URL(text);
      return url.protocol === 'http:' || url.protocol === 'https:';
    } catch {
      return false;
    }
  };

  // Renderizar ubicación como link o texto
  const renderLocation = (location: string) => {
    if (isUrl(location)) {
      return (
        <a
          href={location}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-blue-600 hover:text-blue-800 underline flex items-center gap-1"
        >
          <MapPin className="h-3 w-3" />
          Abrir en Maps
        </a>
      );
    }
    return <p className="text-sm text-muted-foreground">{location}</p>;
  };

  if (isFetching) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4"></div>
          <p className="text-muted-foreground">Cargando cita...</p>
        </div>
      </div>
    );
  }

  if (!appointment) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Header - Responsive */}
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight break-words">
              {appointment.title || `Cita de ${appointment.client_name}`}
            </h1>
            <p className="text-sm text-muted-foreground">
              Código: {appointment.confirmation_code}
            </p>
          </div>
        </div>
        
        {/* Botones en móvil - Debajo del título */}
        <div className="flex items-center gap-2 flex-wrap">
          {!isEditingAppointment && (
            <Button onClick={() => setIsEditingAppointment(true)} size="sm" className="md:size-default">
              <Pencil className="mr-2 h-4 w-4" />
              Editar Cita
            </Button>
          )}
          <span
            className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium ${statusColors[appointment.status as keyof typeof statusColors]
              }`}
          >
            {statusLabels[appointment.status as keyof typeof statusLabels]}
          </span>
        </div>
      </div>

      {/* Información de la Cita - Vista o Edición */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle>{isEditingAppointment ? "Editar Cita" : "Detalles de la Cita"}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {isEditingAppointment ? (
            // MODO EDICIÓN
            <form onSubmit={handleSubmit(handleUpdateAppointment)} className="space-y-4">
              {/* Título */}
              <div className="space-y-2">
                <Label htmlFor="edit-title">Título</Label>
                <Input id="edit-title" {...register("title")} />
              </div>

              {/* Descripción */}
              <div className="space-y-2">
                <Label htmlFor="edit-description">Descripción</Label>
                <Textarea
                  id="edit-description"
                  rows={3}
                  {...register("description")}
                />
              </div>

              {/* Cliente y Fecha Inicio */}
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="edit-client">Cliente *</Label>
                  <Controller
                    name="client"
                    control={control}
                    render={({ field }) => (
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                        defaultValue={field.value}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona un cliente" />
                        </SelectTrigger>
                        <SelectContent>
                          {clients.map((client) => (
                            <SelectItem key={client.id} value={client.id}>
                              {client.full_name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-start">Fecha y Hora Inicio *</Label>
                  <Input
                    id="edit-start"
                    type="datetime-local"
                    {...register("start_at")}
                  />
                </div>
              </div>

              {/* Hora Fin y Duración (solo Fin editable) */}
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="edit-end">Hora de Fin</Label>
                  <Input
                    id="edit-end"
                    type="datetime-local"
                    {...register("end_at")}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Duración</Label>
                  <Input
                    value={appointment.duration_minutes ? `${appointment.duration_minutes} minutos` : ""}
                    disabled
                    className="bg-muted"
                  />
                </div>
              </div>

              {/* Servicio y Origen */}
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Servicio</Label>
                  <Controller
                    name="service"
                    control={control}
                    render={({ field }) => (
                      <Select
                        onValueChange={field.onChange}
                        value={field.value || "none"}
                        defaultValue={field.value || "none"}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Sin servicio" />
                        </SelectTrigger>
                        <SelectContent className="max-h-[300px]">
                          <SelectItem value="none">Sin servicio</SelectItem>
                          {services.map((service) => (
                            <SelectItem key={service.id} value={service.id}>
                              {service.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                  <p className="text-xs text-muted-foreground">
                    {services.length} servicio{services.length !== 1 ? 's' : ''} disponible{services.length !== 1 ? 's' : ''}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Origen</Label>
                  <Controller
                    name="source"
                    control={control}
                    render={({ field }) => (
                      <Select
                        onValueChange={field.onChange}
                        value={field.value || "none"}
                        defaultValue={field.value || "none"}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Sin origen" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Sin origen</SelectItem>
                          <SelectItem value="admin">Admin</SelectItem>
                          <SelectItem value="public">Sitio Público</SelectItem>
                          <SelectItem value="whatsapp">WhatsApp</SelectItem>
                          <SelectItem value="other">Otro</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>
              </div>

              {/* Asignado a y Equipo */}
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Asignado a</Label>
                  <Controller
                    name="assigned_to"
                    control={control}
                    render={({ field }) => (
                      <Select
                        onValueChange={field.onChange}
                        value={field.value || ""}
                        defaultValue={field.value || ""}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Sin asignar" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Sin asignar</SelectItem>
                          {employees.map((emp) => (
                            <SelectItem key={emp.id} value={emp.id}>
                              {emp.full_name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Equipo</Label>
                  <Controller
                    name="team"
                    control={control}
                    render={({ field }) => (
                      <Select
                        onValueChange={field.onChange}
                        value={field.value || ""}
                        defaultValue={field.value || ""}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Sin equipo" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Sin equipo</SelectItem>
                          {teams.map((team) => (
                            <SelectItem key={team.id} value={team.id}>
                              {team.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>
              </div>

              {/* Ubicación */}
              <div className="space-y-2">
                <Label htmlFor="edit-location">Ubicación</Label>
                <Input id="edit-location" {...register("location")} />
              </div>

              {/* Precio y Anticipo */}
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="edit-price">Precio Estimado</Label>
                  <Input
                    id="edit-price"
                    type="text"
                    inputMode="decimal"
                    placeholder="0.00"
                    {...register("estimated_price")}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-advance">Anticipo Pagado</Label>
                  <Input
                    id="edit-advance"
                    type="text"
                    inputMode="decimal"
                    placeholder="0.00"
                    {...register("advance_payment")}
                  />
                  {errors.advance_payment && (
                    <p className="text-sm text-red-500">{errors.advance_payment.message}</p>
                  )}
                </div>
              </div>

              {/* Notas del cliente */}
              <div className="space-y-2">
                <Label htmlFor="edit-client-notes">Notas del Cliente</Label>
                <Textarea
                  id="edit-client-notes"
                  rows={2}
                  {...register("client_notes")}
                />
              </div>

              {/* Botones */}
              <div className="flex gap-2 pt-4 border-t">
                <Button type="submit" disabled={isLoading}>
                  <Save className="mr-2 h-4 w-4" />
                  {isLoading ? "Guardando..." : "Guardar Cambios"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsEditingAppointment(false)}
                  disabled={isLoading}
                >
                  <X className="mr-2 h-4 w-4" />
                  Cancelar
                </Button>
              </div>
            </form>
          ) : (
            // MODO VISUALIZACIÓN
            <>
              {/* Título y Descripción */}
              {(appointment.title || appointment.description) && (
                <div className="space-y-3 pb-4">
                  {appointment.title && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-1">Título</p>
                      <p className="text-base">{appointment.title}</p>
                    </div>
                  )}
                  {appointment.description && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-1">Descripción</p>
                      <p className="text-sm whitespace-pre-wrap">{appointment.description}</p>
                    </div>
                  )}
                </div>
              )}

              <div className="grid gap-4 md:grid-cols-2">
                <div className="flex items-start gap-3">
                  <User className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Cliente</p>
                    <p className="text-sm text-muted-foreground">{appointment.client_name}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Fecha y Hora Inicio</p>
                    <p className="text-sm text-muted-foreground">
                      {formatDateTime(appointment.start_at)}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Clock className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Hora de Fin</p>
                    <p className="text-sm text-muted-foreground">
                      {formatDateTime(appointment.end_at)}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Clock className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Duración</p>
                    <p className="text-sm text-muted-foreground">
                      {appointment.duration_minutes} minutos
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <MessageSquare className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Servicio</p>
                    <p className="text-sm text-muted-foreground">
                      {appointment.service_name || appointment.custom_service_description || "Sin servicio"}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Tag className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Origen</p>
                    <p className="text-sm text-muted-foreground">
                      {appointment.source_display || appointment.source}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <User className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Asignado a</p>
                    <p className="text-sm text-muted-foreground">
                      {appointment.assigned_to?.full_name || (
                        <span className="italic">Sin asignar</span>
                      )}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Users className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Equipo</p>
                    <p className="text-sm text-muted-foreground">
                      {appointment.team?.name || (
                        <span className="italic">Sin equipo</span>
                      )}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Ubicación</p>
                    {appointment.location ? (
                      renderLocation(appointment.location)
                    ) : (
                      <p className="text-sm text-muted-foreground italic">Sin ubicación</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Información de Pago */}
              <div className="bg-green-50/50 p-4 rounded-lg border border-green-200">
                <div className="flex items-start gap-2 mb-3">
                  <DollarSign className="h-5 w-5 text-green-700 mt-0.5" />
                  <p className="text-sm font-medium text-green-900">Información de Pago</p>
                </div>
                <div className="grid gap-3 md:grid-cols-3 pl-7">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Precio Total</p>
                    <p className="text-base font-semibold">
                      {appointment.estimated_price ? `$${appointment.estimated_price}` : (
                        <span className="text-sm italic font-normal">A consultar</span>
                      )}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Anticipo Pagado</p>
                    <p className="text-base font-semibold text-green-700">
                      {appointment.advance_payment ? `$${appointment.advance_payment}` : "$0.00"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Saldo Pendiente</p>
                    <p className="text-base font-semibold text-orange-700">
                      {appointment.balance_due ? `$${appointment.balance_due}` : (
                        appointment.estimated_price ? `$${appointment.estimated_price}` : (
                          <span className="text-sm italic font-normal">A consultar</span>
                        )
                      )}
                    </p>
                  </div>
                </div>
              </div>

              {appointment.client_notes && (
                <div className="bg-blue-50/50 p-4 rounded-lg border border-blue-200 mt-4">
                  <div className="flex items-start gap-2 mb-2">
                    <FileText className="h-4 w-4 text-blue-700 mt-0.5" />
                    <p className="text-sm font-medium text-blue-900">Notas del Cliente</p>
                  </div>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap pl-6">{appointment.client_notes}</p>
                </div>
              )}

              {/* Cambiar Status */}
              <div className="pt-4 border-t">
                <Label htmlFor="status">Cambiar Estado</Label>
                <Select
                  value={appointment.status}
                  onValueChange={handleStatusChange}
                  disabled={isLoading}
                >
                  <SelectTrigger className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pendiente</SelectItem>
                    <SelectItem value="confirmed">Confirmada</SelectItem>
                    <SelectItem value="in_progress">En Progreso</SelectItem>
                    <SelectItem value="completed">Completada</SelectItem>
                    <SelectItem value="cancelled">Cancelada</SelectItem>
                    <SelectItem value="rejected">Rechazada</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Notas */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle>Notas ({notes.length})</CardTitle>
          <CardDescription>
            Agrega notas internas o visibles para el cliente
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Agregar Nueva Nota */}
          <div className="space-y-3 p-4 bg-purple-50/50 rounded-lg border border-purple-200">
            <div className="flex items-center justify-between">
              <Label htmlFor="new-note">Nueva Nota Interna</Label>
              <span className="text-xs text-muted-foreground">Solo visible para el staff</span>
            </div>
            <Textarea
              id="new-note"
              placeholder="Escribe una nota... (puedes usar Enter para saltos de línea)"
              value={newNoteText}
              onChange={(e) => setNewNoteText(e.target.value)}
              disabled={isLoading}
              rows={3}
            />
            <div className="flex justify-end">
              <Button onClick={handleAddNote} disabled={isLoading || !newNoteText.trim()}>
                <Plus className="mr-2 h-4 w-4" />
                Agregar Nota
              </Button>
            </div>
          </div>

          {/* Lista de Notas */}
          {notes.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No hay notas aún
            </div>
          ) : (
            <div className="space-y-3">
              {notes.map((note) => (
                <div
                  key={note.id}
                  className={`p-4 rounded-lg border ${note.is_internal ? "bg-purple-50/50" : "bg-blue-50/50"
                    }`}
                >
                  {editingNoteId === note.id ? (
                    // Modo edición
                    <div className="space-y-3">
                      <Textarea
                        value={editNoteText}
                        onChange={(e) => setEditNoteText(e.target.value)}
                        placeholder="Texto de la nota..."
                        disabled={isLoading}
                        rows={3}
                      />
                      <div className="flex justify-end gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={cancelEditNote}
                          disabled={isLoading}
                        >
                          <X className="h-4 w-4 mr-1" />
                          Cancelar
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleUpdateNote(note.id)}
                          disabled={isLoading}
                        >
                          <Check className="h-4 w-4 mr-1" />
                          Guardar
                        </Button>
                      </div>
                    </div>
                  ) : (
                    // Modo visualización
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        {note.title && (
                          <p className="font-medium mb-1">{note.title}</p>
                        )}
                        <p className="text-sm text-muted-foreground mb-2 whitespace-pre-wrap">
                          {note.description}
                        </p>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span>Por: {note.author_name}</span>
                          <span>
                            {new Date(note.created_at).toLocaleDateString("es-MX", {
                              day: "2-digit",
                              month: "short",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                          {note.is_internal && (
                            <span className="inline-flex items-center rounded-full bg-purple-100 px-2 py-0.5 text-xs font-medium text-purple-700">
                              Interna
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => startEditNote(note)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeleteNoteId(note.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Note Dialog */}
      <AlertDialog open={!!deleteNoteId} onOpenChange={() => setDeleteNoteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar nota?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteNoteId && handleDeleteNote(deleteNoteId)}
              className="bg-red-600 hover:bg-red-700"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}