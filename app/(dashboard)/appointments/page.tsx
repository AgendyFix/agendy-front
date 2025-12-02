"use client";

// ============================================
// APPOINTMENTS PAGE - Lista/Calendario de citas
// ============================================

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, Search, Calendar, User, Clock, Eye } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAppointments } from "@/lib/hooks/useAppointments";
import { appointmentsApi } from "@/lib/api/appointments";
import { MonthSelector } from "@/components/appointments/MonthSelector";
import { DateRangePicker } from "@/components/appointments/DateRangePicker";
import { AppointmentCard } from "@/components/appointments/AppointmentCard";
import type { AppointmentStatus } from "@/lib/types/models";

type ViewMode = "month" | "range" | "all";

interface CalendarAppointment {
  id: string;
  time: string;
  title: string;
  client: string;
  service: string;
  status: string;
  assigned_to: string | null;
}

const statusColors = {
  pending: "bg-yellow-50 text-yellow-700 border-yellow-200",
  confirmed: "bg-blue-50 text-blue-700 border-blue-200",
  in_progress: "bg-purple-50 text-purple-700 border-purple-200",
  completed: "bg-green-50 text-green-700 border-green-200",
  cancelled: "bg-gray-50 text-gray-700 border-gray-200",
  rejected: "bg-red-50 text-red-700 border-red-200",
};

const statusLabels = {
  pending: "Pendiente",
  confirmed: "Confirmada",
  in_progress: "En Progreso",
  completed: "Completada",
  cancelled: "Cancelada",
  rejected: "Rechazada",
};

// Convierte "YYYY-MM-DD" a Date en horario LOCAL (evita desfase por UTC)
const parseLocalDate = (dateStr: string) => {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1); // midnight local
};

export default function AppointmentsPage() {
  const router = useRouter();
  const {
    appointments,
    isLoading,
    totalCount,
    currentPage,
    hasNext,
    hasPrevious,
    fetchAppointments,
    updateAppointmentStatus,
    deleteAppointment
  } = useAppointments();
  
  // View mode states
  const [viewMode, setViewMode] = useState<ViewMode>("month");
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [calendarData, setCalendarData] = useState<Record<string, CalendarAppointment[]>>({});
  const [isLoadingCalendar, setIsLoadingCalendar] = useState(false);
  const [calendarInfo, setCalendarInfo] = useState<{
    total: number;
    period: { start: string; end: string; days: number };
    warning?: string;
  } | null>(null);
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  
  // Dialog states
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [appointmentToDelete, setAppointmentToDelete] = useState<{ id: string; title: string } | null>(null);
  
  const hasFetched = useRef(false);

  // Load data based on view mode
  useEffect(() => {
    if (!hasFetched.current) {
      loadAppointmentsByMode();
      hasFetched.current = true;
    }
  }, []);

  useEffect(() => {
    if (hasFetched.current) {
      loadAppointmentsByMode();
    }
  }, [viewMode, selectedMonth, startDate, endDate]);

  const loadAppointmentsByMode = async () => {
    if (viewMode === "month") {
      await fetchCalendarByMonth(selectedMonth);
    } else if (viewMode === "range") {
      if (startDate && endDate) {
        await fetchCalendarByRange(startDate, endDate);
      }
    } else {
      await fetchAppointments({ page: 1, search: searchTerm || undefined });
    }
  };

  const fetchCalendarByMonth = async (month: string) => {
    try {
      setIsLoadingCalendar(true);
      const response: any = await appointmentsApi.getCalendar({ month });
      setCalendarData(response.calendar || {});
      setCalendarInfo({
        total: response.total_appointments || 0,
        period: response.period || { start: "", end: "", days: 0 },
        warning: response.warning,
      });
      
      if (response.warning) {
        toast.warning(response.warning);
      }
    } catch (error) {
      toast.error("Error al cargar calendario");
      setCalendarData({});
    } finally {
      setIsLoadingCalendar(false);
    }
  };

  const fetchCalendarByRange = async (start: string, end: string) => {
    try {
      setIsLoadingCalendar(true);
      const response: any = await appointmentsApi.getCalendar({ start_date: start, end_date: end });
      setCalendarData(response.calendar || {});
      setCalendarInfo({
        total: response.total_appointments || 0,
        period: response.period || { start, end, days: 0 },
        warning: response.warning,
      });
      
      if (response.warning) {
        toast.warning(response.warning);
      }
    } catch (error) {
      toast.error("Error al cargar calendario");
      setCalendarData({});
    } finally {
      setIsLoadingCalendar(false);
    }
  };

  const handlePageChange = (page: number) => {
    fetchAppointments({ 
      page, 
      search: searchTerm || undefined,
      status: statusFilter !== "all" ? statusFilter : undefined
    });
  };

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    if (viewMode === "all") {
      fetchAppointments({ 
        page: 1, 
        search: value || undefined,
        status: statusFilter !== "all" ? statusFilter : undefined
      });
    }
  };

  const handleStatusFilter = (value: string) => {
    setStatusFilter(value);
    if (viewMode === "all") {
      fetchAppointments({
        page: 1,
        search: searchTerm || undefined,
        status: value !== "all" ? value : undefined
      });
    }
  };

  const handleQuickStatusChange = async (aptId: string, newStatus: string) => {
    try {
      await updateAppointmentStatus(aptId, newStatus as AppointmentStatus);
      toast.success("Estado actualizado");
      // Reload appointments
      loadAppointmentsByMode();
    } catch (error) {
      toast.error("Error al actualizar estado");
    }
  };

  const handleApplyRange = () => {
    if (startDate && endDate) {
      fetchCalendarByRange(startDate, endDate);
    }
  };

  const openDeleteDialog = (id: string, title: string) => {
    setAppointmentToDelete({ id, title });
    setDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!appointmentToDelete) return;

    try {
      await deleteAppointment(appointmentToDelete.id);
      toast.success("Cita eliminada exitosamente");
      setDeleteDialogOpen(false);
      setAppointmentToDelete(null);
      // Reload current view
      loadAppointmentsByMode();
    } catch (error) {
      toast.error("Error al eliminar la cita");
    }
  };

  const formatDate = (dateString: string) => {
    // Si viene "YYYY-MM-DD" (sin hora), parse local.
    // Si viene ISO con hora (start_at), usa Date normal.
    const date = dateString.includes("T") ? new Date(dateString) : parseLocalDate(dateString);

    return date.toLocaleDateString("es-MX", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString("es-MX", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatDateHeader = (dateStr: string) => {
    const date = parseLocalDate(dateStr);
    return date.toLocaleDateString("es-MX", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const filteredAppointments = Array.isArray(appointments) ? appointments : [];
  const startItem = totalCount === 0 ? 0 : (currentPage - 1) * 10 + 1;
  const endItem = Math.min(currentPage * 10, totalCount);
  const totalPages = Math.ceil(totalCount / 10);

  const isLoadingAny = isLoading || isLoadingCalendar;

  if (isLoadingAny && filteredAppointments.length === 0 && Object.keys(calendarData).length === 0) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4"></div>
          <p className="text-muted-foreground">Cargando citas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Citas</h1>
          <p className="text-muted-foreground">
            Gestiona las citas de tu empresa
          </p>
        </div>
        <Button onClick={() => router.push("/appointments/new")}>
          <Plus className="mr-2 h-4 w-4" />
          Nueva Cita
        </Button>
      </div>

      {/* Selectores de Vista - Compactos */}
      <Card className="shadow-card">
        <CardContent className="py-4">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            {/* Selector de Vista + Fecha */}
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Vista:</span>
                <Select value={viewMode} onValueChange={(v) => setViewMode(v as ViewMode)}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="month">📅 Mes Actual</SelectItem>
                    <SelectItem value="range">📆 Rango de Fechas</SelectItem>
                    <SelectItem value="all">📋 Todas las Citas</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Selección de Mes */}
              {viewMode === "month" && (
                <MonthSelector value={selectedMonth} onChange={setSelectedMonth} />
              )}

              {/* Selección de Rango */}
              {viewMode === "range" && (
                <DateRangePicker
                  from={startDate}
                  to={endDate}
                  onRangeChange={(from, to) => {
                    setStartDate(from);
                    setEndDate(to);
                    fetchCalendarByRange(from, to);
                  }}
                />
              )}

              {/* Filtros vista "Todas" */}
              {viewMode === "all" && (
                <>
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Buscar..."
                      value={searchTerm}
                      onChange={(e) => handleSearch(e.target.value)}
                      className="pl-8 w-[200px]"
                    />
                  </div>
                  <Select value={statusFilter} onValueChange={handleStatusFilter}>
                    <SelectTrigger className="w-[150px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="pending">Pendiente</SelectItem>
                      <SelectItem value="confirmed">Confirmada</SelectItem>
                      <SelectItem value="in_progress">En Progreso</SelectItem>
                      <SelectItem value="completed">Completada</SelectItem>
                      <SelectItem value="cancelled">Cancelada</SelectItem>
                      <SelectItem value="rejected">Rechazada</SelectItem>
                    </SelectContent>
                  </Select>
                </>
              )}
            </div>

            {/* Info compacta - solo en vista calendario */}
            {(viewMode === "month" || viewMode === "range") && calendarInfo && calendarInfo.total > 0 && (
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span>📊 <strong className="text-foreground">{calendarInfo.total}</strong> citas</span>
                {calendarInfo.period.days && (
                  <span>📅 <strong className="text-foreground">{calendarInfo.period.days}</strong> días</span>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Vista de Calendario (Mes/Rango) */}
      {(viewMode === "month" || viewMode === "range") && (
        <div className="space-y-4">
          {Object.keys(calendarData).length === 0 ? (
            <Card className="shadow-card">
              <CardContent className="py-12">
                <div className="text-center">
                  <Calendar className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                  <p className="text-muted-foreground">
                    No hay citas en este período
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            Object.entries(calendarData)
              .sort(([dateA], [dateB]) => dateA.localeCompare(dateB))
              .map(([date, dayAppointments]) => (
                <Card key={date} className="shadow-sm">
                  <div className="px-4 py-2 border-b bg-muted/20 flex items-center justify-between">
                    <span className="text-sm font-medium flex items-center gap-2">
                      <Calendar className="h-3 w-3 text-muted-foreground" />
                      {formatDateHeader(date)}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {dayAppointments.length} cita{dayAppointments.length !== 1 ? "s" : ""}
                    </span>
                  </div>
                  {/* Vista Desktop - Tabla */}
                  <div className="p-0 hidden md:block">
                    <Table className="table-fixed">
                      <colgroup>
                        <col style={{ width: "90px" }} />
                        <col style={{ width: "200px" }} />
                        <col style={{ width: "150px" }} />
                        <col style={{ width: "180px" }} />
                        <col style={{ width: "140px" }} />
                        <col style={{ width: "130px" }} />
                        <col style={{ width: "60px" }} />
                      </colgroup>
                      <TableHeader>
                        <TableRow className="hover:bg-transparent">
                          <TableHead className="h-9 py-2 w-[90px]">Hora</TableHead>
                          <TableHead className="h-9 py-2 w-[200px]">Título</TableHead>
                          <TableHead className="h-9 py-2 w-[150px]">Cliente</TableHead>
                          <TableHead className="h-9 py-2 w-[180px]">Servicio</TableHead>
                          <TableHead className="h-9 py-2 w-[140px]">Asignado</TableHead>
                          <TableHead className="h-9 py-2 w-[130px]">Estado</TableHead>
                          <TableHead className="h-9 py-2 text-right w-[60px]"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {dayAppointments.map((apt) => (
                          <TableRow
                            key={apt.id}
                            className="cursor-pointer hover:bg-accent/50 transition-colors"
                            onClick={() => router.push(`/appointments/${apt.id}`)}
                          >
                            <TableCell className="py-2 w-[90px]">
                              <span className="text-sm flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {apt.time}
                              </span>
                            </TableCell>
                            <TableCell className="py-2 w-[200px]">
                              <span className="text-sm font-medium">
                                {apt.title || `Cita de ${apt.client}`}
                              </span>
                            </TableCell>
                            <TableCell className="py-2 w-[150px]">
                              <span className="text-sm flex items-center gap-1">
                                <User className="h-3 w-3 text-muted-foreground" />
                                {apt.client}
                              </span>
                            </TableCell>
                            <TableCell className="py-2 w-[180px]">
                              <span className="text-sm text-muted-foreground">
                                {apt.service || (
                                  <span className="italic">Sin servicio</span>
                                )}
                              </span>
                            </TableCell>
                            <TableCell className="py-2 w-[140px]">
                              <span className="text-sm text-muted-foreground">
                                {apt.assigned_to || (
                                  <span className="italic">Sin asignar</span>
                                )}
                              </span>
                            </TableCell>
                            <TableCell className="py-2 w-[130px]" onClick={(e) => e.stopPropagation()}>
                              <Select
                                value={apt.status}
                                onValueChange={(val) => handleQuickStatusChange(apt.id, val)}
                              >
                                <SelectTrigger className={`h-7 w-[125px] text-xs border-0 ${
                                  statusColors[apt.status as keyof typeof statusColors].split(" border-")[0]
                                }`}>
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
                            </TableCell>
                            <TableCell className="py-2 text-right w-[60px]">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 w-7 p-0 hover:bg-red-50"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openDeleteDialog(apt.id, apt.title || `Cita de ${apt.client}`);
                                }}
                              >
                                <Trash2 className="h-3.5 w-3.5 text-red-600" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  {/* Vista Móvil - Cards */}
                  <div className="md:hidden p-4 space-y-3">
                    {dayAppointments.map((apt) => (
                      <AppointmentCard
                        key={apt.id}
                        appointment={{
                          id: apt.id,
                          start_at: `${date}T${apt.time}:00`,
                          end_at: `${date}T${apt.time}:00`,
                          client_name: apt.client,
                          service_name: apt.service,
                          assigned_to_name: apt.assigned_to,
                          status: apt.status,
                          title: apt.title,
                        }}
                        onDelete={openDeleteDialog}
                        onStatusChange={(id, status) => handleQuickStatusChange(id, status)}
                        formatDate={() => formatDateHeader(date)}
                        formatTime={() => apt.time}
                        statusColors={statusColors}
                        statusLabels={statusLabels}
                      />
                    ))}
                  </div>
                </Card>
              ))
          )}
        </div>
      )}

      {/* Vista de Tabla (Todas) */}
      {viewMode === "all" && (
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>Todas las Citas</CardTitle>
            <CardDescription>
              {totalCount > 0
                ? `Mostrando ${startItem}-${endItem} de ${totalCount} cita${totalCount !== 1 ? "s" : ""}`
                : "No hay citas registradas"
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            {filteredAppointments.length === 0 ? (
              <div className="text-center py-12">
                <Calendar className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                <p className="text-muted-foreground mb-2">
                  {searchTerm || statusFilter !== "all"
                    ? "No se encontraron citas"
                    : "No hay citas registradas"}
                </p>
                {!searchTerm && statusFilter === "all" && (
                  <Button
                    onClick={() => router.push("/appointments/new")}
                    className="mt-4"
                    variant="outline"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Crear primera cita
                  </Button>
                )}
              </div>
            ) : (
              <>
                {/* Vista Desktop - Tabla */}
                <div className="hidden md:block rounded-md border">
                  <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Fecha y Hora</TableHead>
                      <TableHead>Cliente</TableHead>
                      <TableHead>Servicio</TableHead>
                      <TableHead>Asignado A</TableHead>
                      <TableHead>Origen</TableHead>
                      <TableHead>Notas</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredAppointments.map((appointment) => (
                      <TableRow
                        key={appointment.id}
                        className="cursor-pointer hover:bg-accent/50 transition-colors"
                        onClick={() => router.push(`/appointments/${appointment.id}`)}
                      >
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <p>{formatDate(appointment.start_at)}</p>
                              <p className="text-xs text-muted-foreground flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {formatTime(appointment.start_at)} - {formatTime(appointment.end_at)}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-muted-foreground" />
                            {appointment.client_name}
                          </div>
                        </TableCell>
                        <TableCell>
                          {appointment.service_name || (
                            <span className="text-muted-foreground italic text-sm">
                              {appointment.custom_service_description || "Sin servicio"}
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          {appointment.assigned_to_name ? (
                            <span className="text-sm">{appointment.assigned_to_name}</span>
                          ) : (
                            <span className="text-muted-foreground italic text-sm">Sin asignar</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                            appointment.source === "manual" ? "bg-gray-50 text-gray-700" :
                            appointment.source === "online" ? "bg-green-50 text-green-700" :
                            "bg-blue-50 text-blue-700"
                          }`}>
                            {appointment.source_display || appointment.source}
                          </span>
                        </TableCell>
                        <TableCell>
                          {(appointment.notes_count || 0) > 0 ? (
                            <span className="inline-flex items-center rounded-full bg-purple-50 text-purple-700 px-2 py-1 text-xs font-medium">
                              {appointment.notes_count} nota{appointment.notes_count !== 1 ? "s" : ""}
                            </span>
                          ) : (
                            <span className="text-muted-foreground italic text-sm">Sin notas</span>
                          )}
                        </TableCell>
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          <Select
                            value={appointment.status}
                            onValueChange={(val) => handleQuickStatusChange(appointment.id, val)}
                          >
                            <SelectTrigger className={`h-7 w-[125px] text-xs border-0 ${
                              statusColors[appointment.status as keyof typeof statusColors]
                            }`}>
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
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="hover:bg-red-50"
                            onClick={(e) => {
                              e.stopPropagation();
                              openDeleteDialog(appointment.id, appointment.title || `Cita de ${appointment.client_name}`);
                            }}
                          >
                            <Trash2 className="h-4 w-4 text-red-600" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                </div>

                {/* Vista Móvil - Cards */}
                <div className="md:hidden space-y-3">
                  {filteredAppointments.map((appointment) => (
                    <AppointmentCard
                      key={appointment.id}
                      appointment={appointment}
                      onDelete={openDeleteDialog}
                      onStatusChange={(id, status) => handleQuickStatusChange(id, status)}
                      formatDate={formatDate}
                      formatTime={formatTime}
                      statusColors={statusColors}
                      statusLabels={statusLabels}
                    />
                  ))}
                </div>
              </>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-2 py-4">
                <div className="text-sm text-muted-foreground">
                  Página {currentPage} de {totalPages}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={!hasPrevious || isLoading}
                  >
                    Anterior
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={!hasNext || isLoading}
                  >
                    Siguiente
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Delete Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar cita?</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Estás seguro de que deseas eliminar <strong>&quot;{appointmentToDelete?.title}&quot;</strong>?
              Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}