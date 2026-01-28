"use client";

// ============================================
// EDIT REMINDER PAGE - Página de edición de reminder
// ============================================

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ReminderForm } from "@/components/reminders/ReminderForm";
import { useReminder } from "@/lib/hooks/useReminders";
import { toast } from "sonner";
import type { UpdateReminderRequest } from "@/lib/types/api";

export default function EditReminderPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const { reminder, isLoading, fetchReminder, updateReminder } = useReminder(id);

  useEffect(() => {
    if (id) {
      fetchReminder();
    }
  }, [id, fetchReminder]);

  const handleSubmit = async (data: UpdateReminderRequest) => {
    try {
      await updateReminder(data);
      toast.success("Reminder actualizado exitosamente");
      router.push(`/reminders/${id}`);
    } catch (error) {
      toast.error("Error al actualizar el reminder");
      throw error;
    }
  };

  const handleCancel = () => {
    router.push(`/reminders/${id}`);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-muted-foreground">Cargando reminder...</p>
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

  // Solo permitir editar si está pending
  if (reminder.status !== 'pending') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <p className="text-muted-foreground">
          Solo puedes editar reminders con estado &quot;Pendiente&quot;
        </p>
        <Button onClick={() => router.push(`/reminders/${id}`)}>
          Volver al Detalle
        </Button>
      </div>
    );
  }

  // Convertir reminder a formato del formulario
  const scheduledDate = reminder.scheduled_at ? new Date(reminder.scheduled_at) : new Date();
  const scheduledTime = reminder.scheduled_at 
    ? new Date(reminder.scheduled_at).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', hour12: false })
    : '09:00';

  const initialData = {
    targetType: reminder.client ? 'individual' : 'group' as 'individual' | 'group',
    channel: reminder.channel,
    reminderType: reminder.reminder_type,
    client: typeof reminder.client === 'string' ? reminder.client : reminder.client?.id,
    clientGroup: typeof reminder.client_group === 'string' ? reminder.client_group : reminder.client_group?.id,
    message: reminder.message,
    scheduledDate,
    scheduledTime,
    recurrence: reminder.recurrence || 'once' as 'once' | 'daily' | 'weekly' | 'monthly',
    recurrenceWeekday: reminder.recurrence_weekday ?? undefined,
    recurrenceEndDate: reminder.recurrence_end_date ? new Date(reminder.recurrence_end_date) : undefined,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push(`/reminders/${id}`)}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Editar Recordatorio</h1>
          <p className="text-muted-foreground">
            Modifica el mensaje, fecha u otros detalles del recordatorio
          </p>
        </div>
      </div>

      <ReminderForm
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        initialData={initialData}
      />
    </div>
  );
}