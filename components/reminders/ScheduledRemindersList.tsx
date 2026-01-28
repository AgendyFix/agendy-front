"use client";

// ============================================
// SCHEDULED REMINDERS LIST - Lista de reminders programados
// ============================================

import { useState, useEffect } from "react";
import { Search, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
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
import { ReminderCardCompact } from "./ReminderCardCompact";
import { useScheduledReminders } from "@/lib/hooks/useReminders";
import { toast } from "sonner";

export function ScheduledRemindersList() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [sendNowDialogOpen, setSendNowDialogOpen] = useState(false);
  const [selectedReminderId, setSelectedReminderId] = useState<string | null>(null);

  const {
    reminders,
    isLoading,
    hasNext,
    currentPage,
    fetchReminders,
    cancelReminder,
    sendNow,
  } = useScheduledReminders();

  // Cargar reminders inicial
  useEffect(() => {
    fetchReminders({ page: 1 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleEdit = (id: string) => {
    router.push(`/reminders/${id}/edit`);
  };

  const handleCancelClick = (id: string) => {
    setSelectedReminderId(id);
    setCancelDialogOpen(true);
  };

  const handleSendNowClick = (id: string) => {
    setSelectedReminderId(id);
    setSendNowDialogOpen(true);
  };

  const handleConfirmCancel = async () => {
    if (!selectedReminderId) return;

    try {
      await cancelReminder(selectedReminderId);
      toast.success("Reminder cancelado exitosamente");
      setCancelDialogOpen(false);
      setSelectedReminderId(null);
      fetchReminders({ page: 1 });
    } catch (error) {
      toast.error("Error al cancelar el reminder");
    }
  };

  const handleConfirmSendNow = async () => {
    if (!selectedReminderId) return;

    try {
      await sendNow(selectedReminderId);
      toast.success("Reminder enviado exitosamente");
      setSendNowDialogOpen(false);
      setSelectedReminderId(null);
      fetchReminders({ page: 1 });
    } catch (error) {
      toast.error("Error al enviar el reminder");
    }
  };

  const filteredReminders = reminders.filter((reminder) => {
    const searchLower = searchQuery.toLowerCase();
    const clientName = reminder.client_name?.toLowerCase() || "";
    const groupName = reminder.client_group_name?.toLowerCase() || "";
    const message = reminder.message?.toLowerCase() || "";

    return (
      clientName.includes(searchLower) ||
      groupName.includes(searchLower) ||
      message.includes(searchLower)
    );
  });

  return (
    <div className="space-y-4">
      {/* Header con búsqueda y botón nuevo */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por cliente, grupo o mensaje..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button
          onClick={() => router.push("/reminders/new")}
          className="cursor-pointer"
        >
          <Plus className="h-4 w-4 mr-2" />
          Nuevo Reminder
        </Button>
      </div>

      {/* Lista de reminders */}
      {isLoading ? (
        <div className="text-center py-8 text-muted-foreground">
          Cargando reminders...
        </div>
      ) : filteredReminders.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          {searchQuery
            ? "No se encontraron reminders con ese criterio"
            : "No hay reminders programados"}
        </div>
      ) : (
        <div className="space-y-2">
          {filteredReminders.map((reminder) => (
            <ReminderCardCompact
              key={reminder.id}
              reminder={reminder}
              onClick={() => router.push(`/reminders/${reminder.id}`)}
              onEdit={handleEdit}
              onSendNow={handleSendNowClick}
              onCancel={handleCancelClick}
              showActions={true}
            />
          ))}
        </div>
      )}

      {/* Botón cargar más */}
      {hasNext && (
        <div className="text-center pt-4">
          <Button
            variant="outline"
            onClick={() => fetchReminders({ page: currentPage + 1 })}
            disabled={isLoading}
          >
            {isLoading ? "Cargando..." : "Cargar más"}
          </Button>
        </div>
      )}

      {/* Dialog de confirmación para cancelar */}
      <AlertDialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Cancelar reminder?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. El reminder será cancelado y no se enviará.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmCancel}>
              Confirmar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog de confirmación para enviar ahora */}
      <AlertDialog open={sendNowDialogOpen} onOpenChange={setSendNowDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Enviar reminder ahora?</AlertDialogTitle>
            <AlertDialogDescription>
              El reminder se enviará inmediatamente, sin esperar a la fecha programada.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmSendNow}>
              Enviar Ahora
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}