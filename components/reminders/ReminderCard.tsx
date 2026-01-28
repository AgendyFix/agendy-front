// ============================================
// REMINDER CARD - Tarjeta de reminder
// ============================================

import { Calendar, MessageSquare, Users, User, Send, Pencil, X } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "./StatusBadge";
import type { Reminder } from "@/lib/types/models";

interface ReminderCardProps {
  reminder: Reminder;
  onEdit?: (id: string) => void;
  onCancel?: (id: string) => void;
  onSendNow?: (id: string) => void;
  onViewDetails?: (id: string) => void;
  showActions?: boolean;
}

export function ReminderCard({ 
  reminder, 
  onEdit, 
  onCancel, 
  onSendNow,
  onViewDetails,
  showActions = true 
}: ReminderCardProps) {
  const getChannelIcon = () => {
    switch (reminder.channel) {
      case 'whatsapp':
        return '📱';
      case 'email':
        return '📧';
      case 'sms':
        return '💬';
      default:
        return '📨';
    }
  };

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

  const getRecipientDisplay = () => {
    if (reminder.client_name) {
      return reminder.client_name;
    }
    if (reminder.client_group_name) {
      return `Grupo: ${reminder.client_group_name}`;
    }
    return 'Sin destinatario';
  };

  const getContactDisplay = () => {
    if (reminder.client) {
      if (reminder.channel === 'email') {
        return reminder.email || 'Sin email';
      }
      return reminder.phone_number || 'Sin teléfono';
    }
    return null;
  };

  return (
    <Card className="shadow-card hover:shadow-lg transition-shadow">
      <CardContent className="pt-6">
        <div className="space-y-3">
          {/* Header: Fecha y Estado */}
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>{formatDate(reminder.scheduled_at)}</span>
            </div>
            <StatusBadge status={reminder.status} statusDisplay={reminder.status_display} />
          </div>

          {/* Destinatario */}
          <div className="flex items-start gap-2">
            <div className="flex items-center gap-2 flex-1">
              <span className="text-lg">{getChannelIcon()}</span>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  {reminder.client ? (
                    <User className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Users className="h-4 w-4 text-muted-foreground" />
                  )}
                  <span className="font-medium">{getRecipientDisplay()}</span>
                </div>
                {getContactDisplay() && (
                  <p className="text-sm text-muted-foreground ml-6">{getContactDisplay()}</p>
                )}
              </div>
            </div>
          </div>

          {/* Mensaje o Template */}
          <div className="flex items-start gap-2">
            <MessageSquare className="h-4 w-4 text-muted-foreground mt-0.5" />
            <div className="flex-1">
              {reminder.uses_template ? (
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-primary">📋 Template:</span>
                    <span className="text-sm text-muted-foreground">{reminder.template_name}</span>
                  </div>
                  {reminder.message && (
                    <p className="text-sm text-muted-foreground line-clamp-2 pl-6">
                      {reminder.message}
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {reminder.message}
                </p>
              )}
            </div>
          </div>

          {/* Recurrencia */}
          {reminder.is_recurring && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>🔁</span>
              <span>{reminder.recurrence_description}</span>
            </div>
          )}

          {/* Estadísticas de Bulk */}
          {reminder.is_bulk && reminder.metadata?.bulk_stats && (
            <div className="flex items-center gap-4 text-sm pt-2 border-t">
              <span className="text-green-600">
                ✓ {reminder.metadata.bulk_stats.sent} enviados
              </span>
              {reminder.metadata.bulk_stats.failed > 0 && (
                <span className="text-red-600">
                  ✗ {reminder.metadata.bulk_stats.failed} fallidos
                </span>
              )}
              {reminder.metadata.bulk_stats.skipped > 0 && (
                <span className="text-gray-600">
                  ⏭️ {reminder.metadata.bulk_stats.skipped} omitidos
                </span>
              )}
            </div>
          )}

          {/* Acciones */}
          {showActions && (
            <div className="flex gap-2 pt-2 border-t">
              {reminder.status === 'pending' && (
                <>
                  {onEdit && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onEdit(String(reminder.id))}
                      className="cursor-pointer"
                    >
                      <Pencil className="h-3 w-3 mr-1" />
                      Editar
                    </Button>
                  )}
                  {onSendNow && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onSendNow(String(reminder.id))}
                      className="cursor-pointer"
                    >
                      <Send className="h-3 w-3 mr-1" />
                      Enviar Ahora
                    </Button>
                  )}
                  {onCancel && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onCancel(String(reminder.id))}
                      className="cursor-pointer text-red-600 hover:text-red-700"
                    >
                      <X className="h-3 w-3 mr-1" />
                      Cancelar
                    </Button>
                  )}
                </>
              )}
              {reminder.is_bulk && onViewDetails && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onViewDetails(String(reminder.id))}
                  className="cursor-pointer ml-auto"
                >
                  Ver detalles
                </Button>
              )}
            </div>
          )}

          {/* Error Message */}
          {reminder.error_message && (
            <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
              ⚠️ {reminder.error_message}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}