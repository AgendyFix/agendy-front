"use client";

// ============================================
// REMINDER DETAIL PAGE - Detalle de reminder con historial
// ============================================

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Calendar, MessageSquare, Users, User, Edit, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
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
import { StatusBadge } from "@/components/reminders/StatusBadge";
import { ReminderExecutionItem } from "@/components/reminders/ReminderExecutionItem";
import { useReminder, useBulkReminderChildren } from "@/lib/hooks/useReminders";
import type { ClientGroup, ReminderClientDetail } from "@/lib/types/models";
import { toast } from "sonner";
import { remindersApi } from "@/lib/api/reminders";

export default function ReminderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const { reminder, isLoading, fetchReminder } = useReminder(id);
  const {
    executions,
    bulkInfo,
    totalCount,
    currentPage,
    hasNext,
    hasPrevious,
    isLoading: isLoadingChildren,
    fetchChildren,
  } = useBulkReminderChildren(id);

  useEffect(() => {
    if (id) {
      fetchReminder();
    }
  }, [id, fetchReminder]);

  useEffect(() => {
    if (reminder?.is_bulk && id) {
      fetchChildren(1);
    }
  }, [reminder?.is_bulk, id, fetchChildren]);

  const handlePageChange = (newPage: number) => {
    fetchChildren(newPage);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString('es-MX', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getChannelIcon = () => {
    switch (reminder?.channel) {
      case 'whatsapp': return '📱';
      case 'email': return '📧';
      case 'sms': return '💬';
      default: return '📨';
    }
  };

  const getCompanyName = () => {
    if (!reminder?.company) return '';
    return typeof reminder.company === 'string' 
      ? reminder.company_name || '' 
      : reminder.company.name;
  };

  const getClientGroupName = () => {
    if (!reminder?.client_group) return null;
    return typeof reminder.client_group === 'string'
      ? reminder.client_group_name
      : (reminder.client_group as ClientGroup).name;
  };

  const getClientName = () => {
    if (!reminder?.client) return null;
    return typeof reminder.client === 'string'
      ? reminder.client_name
      : (reminder.client as ReminderClientDetail).full_name;
  };

  const getClientPhone = () => {
    if (!reminder?.client) return null;
    if (typeof reminder.client === 'string') return null;
    return (reminder.client as ReminderClientDetail).phone;
  };

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      await remindersApi.delete(id);
      toast.success("Reminder eliminado exitosamente");
      router.push("/reminders");
    } catch (error) {
      toast.error("Error al eliminar el reminder");
      console.error("Error deleting reminder:", error);
    } finally {
      setIsDeleting(false);
      setDeleteDialogOpen(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-muted-foreground">Cargando detalle...</p>
      </div>
    );
  }

  if (!reminder) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <p className="text-muted-foreground">Reminder no encontrado</p>
        <Button onClick={() => router.push('/reminders')}>
          Volver a Reminders
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push('/reminders')}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold tracking-tight">
            Detalle de Recordatorio
          </h1>
          <p className="text-muted-foreground">
            {getCompanyName()}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {reminder.status === 'pending' && (
            <Button
              variant="outline"
              onClick={() => router.push(`/reminders/${id}/edit`)}
            >
              <Edit className="h-4 w-4 mr-2" />
              Editar
            </Button>
          )}
          <Button
            variant="outline"
            onClick={() => setDeleteDialogOpen(true)}
            className="text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Eliminar
          </Button>
          <StatusBadge
            status={reminder.status}
            statusDisplay={reminder.status_display}
          />
        </div>
      </div>

      {/* Información Principal */}
      <Card>
        <CardHeader>
          <CardTitle>Información del Recordatorio</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Canal</p>
              <p className="font-medium">
                {getChannelIcon()} {reminder.channel_display}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Tipo</p>
              <p className="font-medium">{reminder.reminder_type_display}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Programado para</p>
              <p className="font-medium">{formatDate(reminder.scheduled_at)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Enviado</p>
              <p className="font-medium">{formatDate(reminder.sent_at)}</p>
            </div>
          </div>

          <div>
            <p className="text-sm text-muted-foreground mb-2">Destinatario</p>
            <div className="space-y-1">
              {getClientName() ? (
                <>
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{getClientName()}</span>
                  </div>
                  {getClientPhone() && (
                    <p className="text-sm text-muted-foreground ml-6">
                      {getClientPhone()}
                    </p>
                  )}
                </>
              ) : getClientGroupName() ? (
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Grupo: {getClientGroupName()}</span>
                </div>
              ) : (
                <span className="text-muted-foreground">Sin destinatario</span>
              )}
            </div>
          </div>

          <div>
            <p className="text-sm text-muted-foreground mb-2">Mensaje</p>
            <div className="flex items-start gap-2 p-3 bg-muted/50 rounded-lg">
              <MessageSquare className="h-4 w-4 text-muted-foreground mt-0.5" />
              <p className="text-sm flex-1">{reminder.message}</p>
            </div>
          </div>

          <div>
            <p className="text-sm text-muted-foreground mb-2">Recurrencia</p>
            <p className="text-sm">{reminder.recurrence_description}</p>
          </div>

          {reminder.error_message && (
            <div className="p-3 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-sm text-red-600 dark:text-red-400">
                ⚠️ {reminder.error_message}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Estadísticas Bulk */}
      {reminder.is_bulk && reminder.metadata?.bulk_stats && (
        <Card>
          <CardHeader>
            <CardTitle>Estadísticas de Envío Masivo</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-4 gap-4">
              <div className="text-center p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
                <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                  {reminder.metadata.bulk_stats.total_clients}
                </p>
                <p className="text-sm text-muted-foreground">Total</p>
              </div>
              <div className="text-center p-4 bg-green-50 dark:bg-green-950 rounded-lg">
                <p className="text-3xl font-bold text-green-600 dark:text-green-400">
                  {reminder.metadata.bulk_stats.sent}
                </p>
                <p className="text-sm text-muted-foreground">Enviados</p>
              </div>
              <div className="text-center p-4 bg-red-50 dark:bg-red-950 rounded-lg">
                <p className="text-3xl font-bold text-red-600 dark:text-red-400">
                  {reminder.metadata.bulk_stats.failed}
                </p>
                <p className="text-sm text-muted-foreground">Fallidos</p>
              </div>
              <div className="text-center p-4 bg-gray-50 dark:bg-gray-950 rounded-lg">
                <p className="text-3xl font-bold text-gray-600 dark:text-gray-400">
                  {reminder.metadata.bulk_stats.skipped}
                </p>
                <p className="text-sm text-muted-foreground">Omitidos</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Historial de Ejecuciones (Children) */}
      {reminder.is_bulk && (
        <Card>
          <CardHeader>
            <CardTitle>Historial de Ejecuciones Individuales</CardTitle>
            <p className="text-sm text-muted-foreground">
              Página {currentPage} - {totalCount} {totalCount === 1 ? 'envío' : 'envíos'} en total
            </p>
          </CardHeader>
          <CardContent>
            {isLoadingChildren ? (
              <div className="text-center py-8 text-muted-foreground">
                Cargando historial...
              </div>
            ) : totalCount === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No hay ejecuciones registradas
              </div>
            ) : (
              <>
                <div className="space-y-3">
                  {executions.map((execution) => (
                    <ReminderExecutionItem key={execution.id} reminder={execution} />
                  ))}
                </div>
                
                {/* Controles de paginación */}
                {(hasNext || hasPrevious) && (
                  <div className="flex items-center justify-between pt-4 mt-4 border-t">
                    <Button
                      variant="outline"
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={!hasPrevious || isLoadingChildren}
                    >
                      Anterior
                    </Button>
                    <span className="text-sm text-muted-foreground">
                      Página {currentPage}
                    </span>
                    <Button
                      variant="outline"
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={!hasNext || isLoadingChildren}
                    >
                      Siguiente
                    </Button>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* Dialog de confirmación para eliminar */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar reminder?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. El reminder será eliminado permanentemente del sistema.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? "Eliminando..." : "Eliminar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}