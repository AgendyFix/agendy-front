"use client";

// ============================================
// REMINDER CARD COMPACT - Tarjeta compacta de reminder
// ============================================

import { Calendar, User, Users } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "./StatusBadge";
import type { Reminder } from "@/lib/types/models";
import { cn } from "@/lib/utils";
import { Edit, Send, X } from "lucide-react";

interface ReminderCardCompactProps {
  reminder: Reminder;
  onClick?: () => void;
  onEdit?: (id: string) => void;
  onSendNow?: (id: string) => void;
  onCancel?: (id: string) => void;
  showActions?: boolean;
}

export function ReminderCardCompact({
  reminder,
  onClick,
  onEdit,
  onSendNow,
  onCancel,
  showActions = false
}: ReminderCardCompactProps) {
  const formatDate = (dateString: string) => {
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
    switch (reminder.channel) {
      case 'whatsapp': return '📱';
      case 'email': return '📧';
      case 'sms': return '💬';
      default: return '📨';
    }
  };

  const handleCardClick = (e: React.MouseEvent) => {
    // Solo ejecutar onClick si no se clickeó un botón
    if (!(e.target as HTMLElement).closest('button')) {
      onClick?.();
    }
  };

  return (
    <Card
      className={cn(
        "hover:shadow-md transition-shadow",
        onClick && "cursor-pointer"
      )}
      onClick={handleCardClick}
    >
      <CardContent className="p-3">
        <div className="flex items-center gap-4">
          {/* Fecha - MÁS PROMINENTE */}
          <div className="flex items-center gap-2 min-w-[160px]">
            <Calendar className="h-4 w-4 text-primary" />
            <span className="font-semibold text-sm text-foreground">
              {formatDate(reminder.sent_at || reminder.scheduled_at)}
            </span>
          </div>

          {/* Canal y Destinatario */}
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <span className="text-base">{getChannelIcon()}</span>
            {reminder.client_name ? (
              <div className="flex items-center gap-1.5 min-w-0">
                <User className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                <span className="font-medium text-sm truncate">{reminder.client_name}</span>
                {reminder.phone_number && (
                  <span className="text-xs text-muted-foreground flex-shrink-0">{reminder.phone_number}</span>
                )}
              </div>
            ) : reminder.client_group_name ? (
              <div className="flex items-center gap-1.5 min-w-0">
                <Users className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                <span className="font-medium text-sm truncate">Grupo: {reminder.client_group_name}</span>
              </div>
            ) : null}
          </div>

          {/* Recurrencia (si aplica) */}
          {reminder.is_recurring && (
            <div className="flex items-center gap-1 text-xs text-orange-600 bg-orange-50 dark:bg-orange-950 px-2 py-1 rounded flex-shrink-0">
              <span>🔁</span>
              <span className="font-medium">{reminder.recurrence_display}</span>
            </div>
          )}

          {/* Estado */}
          <div className="flex-shrink-0">
            <StatusBadge
              status={reminder.status}
              statusDisplay={reminder.status_display}
            />
          </div>

          {/* Acciones - Solo para pending */}
          {showActions && reminder.status === 'pending' && (
            <div className="flex items-center gap-1 flex-shrink-0">
              {onEdit && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit(String(reminder.id));
                  }}
                  className="h-8 px-2"
                >
                  <Edit className="h-3.5 w-3.5 mr-1" />
                  Editar
                </Button>
              )}
              {onSendNow && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSendNow(String(reminder.id));
                  }}
                  className="h-8 px-2"
                >
                  <Send className="h-3.5 w-3.5 mr-1" />
                  Enviar Ahora
                </Button>
              )}
              {onCancel && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onCancel(String(reminder.id));
                  }}
                  className="h-8 px-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <X className="h-3.5 w-3.5 mr-1" />
                  Cancelar
                </Button>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}