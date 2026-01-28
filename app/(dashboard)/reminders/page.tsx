"use client";

// ============================================
// REMINDERS PAGE - Página principal de reminders
// ============================================

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MyRemindersList } from "@/components/reminders/MyRemindersList";
import { ScheduledRemindersList } from "@/components/reminders/ScheduledRemindersList";
import { ReminderHistoryList } from "@/components/reminders/ReminderHistoryList";

export default function RemindersPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Recordatorios</h1>
        <p className="text-muted-foreground">
          Gestiona recordatorios programados, revisa los tuyos y consulta el historial
        </p>
      </div>

      <Tabs defaultValue="scheduled" className="space-y-4">
        <TabsList>
          <TabsTrigger value="scheduled">Programados</TabsTrigger>
          <TabsTrigger value="my-reminders">Mis Recordatorios</TabsTrigger>
          <TabsTrigger value="history">Historial</TabsTrigger>
        </TabsList>

        <TabsContent value="scheduled" className="space-y-4">
          <ScheduledRemindersList />
        </TabsContent>

        <TabsContent value="my-reminders" className="space-y-4">
          <MyRemindersList />
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <ReminderHistoryList />
        </TabsContent>
      </Tabs>
    </div>
  );
}