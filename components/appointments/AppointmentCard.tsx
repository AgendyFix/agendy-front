// ============================================
// APPOINTMENT CARD - Mobile view for appointments
// ============================================

import { Calendar, Clock, User, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface AppointmentCardProps {
  appointment: {
    id: string;
    start_at: string;
    end_at: string;
    client_name: string;
    service_name: string;
    assigned_to_name?: string | null;
    status: string;
    title?: string | null;
    custom_service_description?: string;
  };
  onDelete: (id: string, title: string) => void;
  onStatusChange: (id: string, status: string) => void;
  formatDate: (date: string) => string;
  formatTime: (date: string) => string;
  statusColors: Record<string, string>;
  statusLabels: Record<string, string>;
}

export function AppointmentCard({ 
  appointment, 
  onDelete, 
  onStatusChange,
 formatDate,
  formatTime,
  statusColors,
  statusLabels 
}: AppointmentCardProps) {
  const router = useRouter();

  return (
    <Card 
      className="cursor-pointer hover:shadow-md transition-all"
      onClick={() => router.push(`/appointments/${appointment.id}`)}
    >
      <CardContent className="p-4">
        <div className="space-y-3">
          {/* Fecha y Hora */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">{formatDate(appointment.start_at)}</span>
            </div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              {formatTime(appointment.start_at)} - {formatTime(appointment.end_at)}
            </div>
          </div>

          {/* Título */}
          <h3 className="font-semibold">
            {appointment.title || `Cita de ${appointment.client_name}`}
          </h3>

          {/* Info Principal */}
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <User className="h-3 w-3 text-muted-foreground" />
              <span className="text-muted-foreground">Cliente:</span>
              <span className="font-medium">{appointment.client_name}</span>
            </div>

            <div className="flex items-start gap-2">
              <span className="text-muted-foreground">Servicio:</span>
              <span className="font-medium">
                {appointment.service_name || appointment.custom_service_description || "Sin servicio"}
              </span>
            </div>

            {appointment.assigned_to_name && (
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">Asignado:</span>
                <span className="font-medium">{appointment.assigned_to_name}</span>
              </div>
            )}
          </div>

          {/* Status y Acciones */}
          <div className="flex items-center justify-between gap-2 pt-2 border-t">
            <div className="flex-1" onClick={(e) => e.stopPropagation()}>
              <Select 
                value={appointment.status} 
                onValueChange={(val) => onStatusChange(appointment.id, val)}
              >
                <SelectTrigger className={`h-8 text-xs border ${
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
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 hover:bg-red-50"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(appointment.id, appointment.title || `Cita de ${appointment.client_name}`);
              }}
            >
              <Trash2 className="h-4 w-4 text-red-600" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}