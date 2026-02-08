"use client";

// ============================================
// REMINDER EXECUTION ITEM - Item de historial de ejecución
// ============================================

import { User, Calendar, Users, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import type { Reminder, ReminderChild, RecipientInfo } from "@/lib/types/models";
import { StatusBadge } from "./StatusBadge";

interface ReminderExecutionItemProps {
  reminder: Reminder | ReminderChild;
}

export function ReminderExecutionItem({ reminder }: ReminderExecutionItemProps) {
  // Validación de seguridad
  if (!reminder) {
    return null;
  }

  const getChannelIcon = () => {
    switch (reminder.channel) {
      case "whatsapp": return '📱';
      case "email": return '📧';
      case "sms": return '💬';
      default: return '📨';
    }
  };

  // Mostrar sent_at si existe, sino scheduled_at
  const displayDate = reminder.sent_at || reminder.scheduled_at;
  const formattedDate = displayDate
    ? format(new Date(displayDate), "dd/MM/yyyy HH:mm", { locale: es })
    : "Sin fecha";

  // Obtener información de destinatarios (solo en ReminderChild)
  const recipients = 'recipients' in reminder ? reminder.recipients : null;
  const recipientsList = recipients?.list || [];
  const recipientsWithoutContact = recipientsList.filter((r: RecipientInfo) => r.has_contact === false);

  // Si hay múltiples destinatarios, mostrar cada uno en su propia fila
  const showRecipientsList = recipients && recipientsList.length > 0;

  // Si es un recordatorio bulk con múltiples destinatarios, renderizar una fila por cada uno
  if (showRecipientsList && recipientsList.length > 1) {
    return (
      <>
        {recipientsList.map((recipient: RecipientInfo) => (
          <div key={recipient.id} className="flex items-center gap-3 p-2.5 bg-card border rounded-lg hover:bg-accent/5 transition-colors">
            {/* Fecha de envío individual */}
            <div className="flex items-center gap-1.5 min-w-[130px] flex-shrink-0">
              <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-xs font-medium">
                {recipient.sent_at
                  ? format(new Date(recipient.sent_at), "dd/MM/yyyy HH:mm", { locale: es })
                  : formattedDate
                }
              </span>
            </div>

            {/* Canal */}
            <div className="flex items-center gap-1 min-w-[90px] flex-shrink-0">
              <span className="text-sm">{getChannelIcon()}</span>
              <span className="text-xs">{reminder.channel_display}</span>
            </div>

            {/* Destinatario individual */}
            <div className="flex items-center gap-1.5 flex-1 min-w-0">
              <User className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
              <span className="text-xs truncate">
                <span className="font-medium">{recipient.name}</span>
                {recipient.phone && <span className="text-muted-foreground ml-1">{recipient.phone}</span>}
              </span>
              {recipient.has_contact === false && (
                <div title="Sin contacto válido">
                  <AlertCircle className="h-3.5 w-3.5 text-yellow-600 dark:text-yellow-400 flex-shrink-0" />
                </div>
              )}
            </div>

            {/* Estado individual */}
            <div className="flex-shrink-0">
              <StatusBadge
                status={recipient.status || reminder.status}
                statusDisplay={recipient.status === 'sent' ? 'Enviado' : recipient.status === 'failed' ? 'Fallido' : reminder.status_display}
              />
            </div>
          </div>
        ))}
      </>
    );
  }

  // Renderizado normal para recordatorios individuales
  return (
    <div className="flex items-center gap-3 p-2.5 bg-card border rounded-lg hover:bg-accent/5 transition-colors">
      {/* Fecha de envío o programación */}
      <div className="flex items-center gap-1.5 min-w-[130px] flex-shrink-0">
        <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
        <span className="text-xs font-medium">{formattedDate}</span>
      </div>

      {/* Canal */}
      <div className="flex items-center gap-1 min-w-[90px] flex-shrink-0">
        <span className="text-sm">{getChannelIcon()}</span>
        <span className="text-xs">{reminder.channel_display}</span>
      </div>

      {/* Cliente */}
      <div className="flex items-center gap-1.5 flex-1 min-w-0">
        {'client_group_name' in reminder && reminder.client_group_name ? (
          <>
            <Users className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
            <span className="text-xs font-medium truncate">Grupo: {reminder.client_group_name}</span>
          </>
        ) : (
          <>
            <User className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
            <span className="text-xs truncate">
              <span className="font-medium">{reminder.client_name}</span>
              {reminder.phone_number && <span className="text-muted-foreground ml-1">{reminder.phone_number}</span>}
            </span>
          </>
        )}
        {recipientsWithoutContact.length > 0 && (
          <div title={`${recipientsWithoutContact.length} sin contacto válido`}>
            <AlertCircle className="h-3.5 w-3.5 text-yellow-600 dark:text-yellow-400 flex-shrink-0" />
          </div>
        )}
      </div>

      {/* Estado */}
      <div className="flex-shrink-0">
        <StatusBadge status={reminder.status} statusDisplay={reminder.status_display} />
      </div>
    </div>
  );
}