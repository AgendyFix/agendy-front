"use client";

// ============================================
// REMINDER HISTORY LIST - Lista de historial de reminders
// ============================================

import { useState, useEffect } from "react";
import { Filter } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { ReminderExecutionItem } from "./ReminderExecutionItem";
import { useReminderHistory } from "@/lib/hooks/useReminders";
import type { ReminderChannel } from "@/lib/types/models";

export function ReminderHistoryList() {
  const [selectedChannel, setSelectedChannel] = useState<ReminderChannel | "all">("all");
  const [selectedStatus, setSelectedStatus] = useState<"sent" | "failed" | "all">("all");

  const {
    reminders,
    isLoading,
    hasNext,
    currentPage,
    fetchHistory,
  } = useReminderHistory();

  // Aplicar filtros automáticamente cuando cambian
  useEffect(() => {
    const params: { page: number; channel?: ReminderChannel; status?: "sent" | "failed" } = { page: 1 };
    
    if (selectedChannel !== "all") {
      params.channel = selectedChannel;
    }
    
    if (selectedStatus !== "all") {
      params.status = selectedStatus;
    }

    fetchHistory(params);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedChannel, selectedStatus]);

  const handleLoadMore = () => {
    const params: { page: number; channel?: ReminderChannel; status?: "sent" | "failed" } = { page: currentPage + 1 };
    
    if (selectedChannel !== "all") {
      params.channel = selectedChannel;
    }
    
    if (selectedStatus !== "all") {
      params.status = selectedStatus;
    }

    fetchHistory(params);
  };

  return (
    <div className="space-y-4">
      {/* Filtros */}
      <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
        <Filter className="h-4 w-4 text-muted-foreground" />
        
        <Select value={selectedChannel} onValueChange={(value) => setSelectedChannel(value as ReminderChannel | "all")}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Canal" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los canales</SelectItem>
            <SelectItem value="whatsapp">WhatsApp</SelectItem>
            <SelectItem value="email">Email</SelectItem>
            <SelectItem value="sms">SMS</SelectItem>
          </SelectContent>
        </Select>

        <Select value={selectedStatus} onValueChange={(value) => setSelectedStatus(value as "sent" | "failed" | "all")}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los estados</SelectItem>
            <SelectItem value="sent">Enviados</SelectItem>
            <SelectItem value="failed">Fallidos</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Lista de ejecuciones */}
      {isLoading && reminders.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          Cargando historial...
        </div>
      ) : reminders.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          No hay reminders en el historial
        </div>
      ) : (
        <div className="space-y-2">
          {reminders.map((reminder) => (
            <ReminderExecutionItem
              key={reminder.id}
              reminder={reminder}
            />
          ))}
        </div>
      )}

      {/* Botón cargar más */}
      {hasNext && (
        <div className="text-center pt-4">
          <Button
            variant="outline"
            onClick={handleLoadMore}
            disabled={isLoading}
          >
            {isLoading ? "Cargando..." : "Cargar más"}
          </Button>
        </div>
      )}

    </div>
  );
}