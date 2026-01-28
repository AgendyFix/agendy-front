"use client";

// ============================================
// REMINDER EXECUTION ITEM - Item de historial de ejecución
// ============================================

import { MessageSquare, Mail, Phone } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import type { Reminder } from "@/lib/types/models";
import { StatusBadge } from "./StatusBadge";

interface ReminderExecutionItemProps {
  reminder: Reminder;
}

export function ReminderExecutionItem({ reminder }: ReminderExecutionItemProps) {
  // Validación de seguridad
  if (!reminder) {
    return null;
  }

  const getChannelIcon = () => {
    switch (reminder.channel) {
      case "whatsapp":
        return <MessageSquare className="h-4 w-4" />;
      case "email":
        return <Mail className="h-4 w-4" />;
      case "sms":
        return <Phone className="h-4 w-4" />;
      default:
        return <MessageSquare className="h-4 w-4" />;
    }
  };

  const sentDate = reminder.sent_at
    ? format(new Date(reminder.sent_at), "dd/MM/yyyy HH:mm", { locale: es })
    : "-";

  return (
    <div className="flex items-center gap-4 p-3 bg-card border rounded-lg hover:bg-accent/5 transition-colors">
      {/* Canal */}
      <div className="flex items-center gap-2 min-w-[120px]">
        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary">
          {getChannelIcon()}
        </div>
        <span className="text-sm font-medium">{reminder.channel_display}</span>
      </div>

      {/* Cliente */}
      <div className="flex-1 min-w-[150px]">
        <p className="text-sm font-medium">{reminder.client_name}</p>
        <p className="text-xs text-muted-foreground">{reminder.phone_number || reminder.email || "-"}</p>
      </div>

      {/* Fecha de envío */}
      <div className="min-w-[140px]">
        <p className="text-xs text-muted-foreground">Enviado</p>
        <p className="text-sm">{sentDate}</p>
      </div>

      {/* Estado */}
      <div className="min-w-[100px]">
        <StatusBadge status={reminder.status} statusDisplay={reminder.status_display} />
      </div>
    </div>
  );
}