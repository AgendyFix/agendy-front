"use client";

// ============================================
// NEW REMINDER PAGE - Página de creación de reminder
// ============================================

import { useRouter } from "next/navigation";
import { ReminderForm } from "@/components/reminders/ReminderForm";
import { useScheduledReminders } from "@/lib/hooks/useReminders";
import { toast } from "sonner";
import type { CreateReminderRequest } from "@/lib/types/api";

export default function NewReminderPage() {
  const router = useRouter();
  const { createReminder } = useScheduledReminders();

  const handleSubmit = async (data: CreateReminderRequest) => {
    try {
      await createReminder(data);
      toast.success("Reminder creado exitosamente");
      router.push("/reminders");
    } catch (error) {
      toast.error("Error al crear el reminder");
      throw error;
    }
  };

  const handleCancel = () => {
    router.push("/reminders");
  };

  return (
    <div className="space-y-6 pb-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Nuevo Recordatorio</h1>
        <p className="text-muted-foreground">
          Crea un recordatorio individual, grupal o recurrente
        </p>
      </div>

      <div className="max-w-3xl">
        <ReminderForm onSubmit={handleSubmit} onCancel={handleCancel} />
      </div>
    </div>
  );
}