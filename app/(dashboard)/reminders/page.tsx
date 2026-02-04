"use client";

// ============================================
// REMINDERS PAGE - Página principal de reminders
// ============================================

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MyRemindersList } from "@/components/reminders/MyRemindersList";
import { ScheduledRemindersList } from "@/components/reminders/ScheduledRemindersList";

export default function RemindersPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Recordatorios</h1>
        <p className="text-muted-foreground">
          Gestiona recordatorios programados y revisa tu historial personal
        </p>
      </div>

      <Tabs defaultValue="scheduled" className="space-y-4">
        <TabsList>
          <TabsTrigger value="scheduled">Programados</TabsTrigger>
          <TabsTrigger value="my-reminders">Mis Recordatorios</TabsTrigger>
        </TabsList>

        <TabsContent value="scheduled" className="space-y-4">
          <ScheduledRemindersList />
        </TabsContent>

        <TabsContent value="my-reminders" className="space-y-4">
          <MyRemindersList />
        </TabsContent>
      </Tabs>
    </div>
  );
}