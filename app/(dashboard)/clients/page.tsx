"use client";

// ============================================
// CLIENTS PAGE - Página principal con tabs
// ============================================

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ClientsList } from "@/components/clients/ClientsList";
import { ClientGroupsList } from "@/components/clients/ClientGroupsList";

export default function ClientsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Clientes</h1>
        <p className="text-muted-foreground">
          Gestiona los clientes y grupos de tu empresa
        </p>
      </div>

      <Tabs defaultValue="clients" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="clients">Todos los Clientes</TabsTrigger>
          <TabsTrigger value="groups">Grupos</TabsTrigger>
        </TabsList>
        
        <TabsContent value="clients" className="mt-6">
          <ClientsList />
        </TabsContent>
        
        <TabsContent value="groups" className="mt-6">
          <ClientGroupsList />
        </TabsContent>
      </Tabs>
    </div>
  );
}