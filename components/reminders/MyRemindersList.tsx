"use client";

// ============================================
// MY REMINDERS LIST - Lista de mis recordatorios
// ============================================

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ReminderCardCompact } from "./ReminderCardCompact";
import { useMyReminders } from "@/lib/hooks/useReminders";

export function MyRemindersList() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");

  const {
    reminders,
    isLoading,
    hasNext,
    currentPage,
    fetchMyReminders,
  } = useMyReminders();

  // Cargar mis reminders inicial
  useEffect(() => {
    fetchMyReminders({ page: 1 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleViewDetails = (id: string | number) => {
    router.push(`/reminders/${id}`);
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
      {/* Búsqueda */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por cliente, grupo o mensaje..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Lista de reminders */}
      {isLoading && reminders.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          Cargando mis recordatorios...
        </div>
      ) : filteredReminders.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          {searchQuery
            ? "No se encontraron recordatorios con ese criterio"
            : "No tienes recordatorios"}
        </div>
      ) : (
        <div className="space-y-2">
          {filteredReminders.map((reminder) => (
            <ReminderCardCompact
              key={reminder.id}
              reminder={reminder}
              onClick={() => handleViewDetails(reminder.id)}
            />
          ))}
        </div>
      )}

      {/* Botón cargar más */}
      {hasNext && (
        <div className="text-center pt-4">
          <Button
            variant="outline"
            onClick={() => fetchMyReminders({ page: currentPage + 1 })}
            disabled={isLoading}
          >
            {isLoading ? "Cargando..." : "Cargar más"}
          </Button>
        </div>
      )}
    </div>
  );
}