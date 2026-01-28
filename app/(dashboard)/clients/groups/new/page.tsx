"use client";

// ============================================
// NEW CLIENT GROUP PAGE - Crear grupo
// ============================================

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Plus, X } from "lucide-react";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useClientGroups } from "@/lib/hooks/useClientGroups";
import { useClients } from "@/lib/hooks/useClients";

const formSchema = z.object({
  name: z.string().min(1, "El nombre es requerido").max(100, "Máximo 100 caracteres"),
  description: z.string().max(500, "Máximo 500 caracteres").optional(),
});

type FormData = z.infer<typeof formSchema>;

export default function NewClientGroupPage() {
  const router = useRouter();
  const { createGroup, isLoading: isCreating } = useClientGroups();
  const { clients, fetchClients } = useClients();
  const [selectedClients, setSelectedClients] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
    },
  });

  // Fetch clients on mount
  useState(() => {
    fetchClients({ page: 1 });
  });

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    fetchClients({ page: 1, search: value || undefined });
  };

  const toggleClient = (clientId: string) => {
    setSelectedClients(prev =>
      prev.includes(clientId)
        ? prev.filter(id => id !== clientId)
        : [...prev, clientId]
    );
  };

  const onSubmit = async (data: FormData) => {
    try {
      const newGroup = await createGroup({
        name: data.name,
        description: data.description,
        client_ids: selectedClients,
      });

      toast.success("Grupo creado exitosamente");
      router.push(`/clients/groups/${newGroup.id}`);
    } catch (error) {
      toast.error("Error al crear el grupo");
    }
  };

  const filteredClients = Array.isArray(clients) 
    ? clients.filter(client => 
        client.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.email?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : [];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.back()}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Nuevo Grupo</h1>
          <p className="text-muted-foreground">
            Crea un grupo para organizar tus clientes
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Form Section */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>Información del Grupo</CardTitle>
            <CardDescription>
              Completa los datos básicos del grupo
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nombre del Grupo *</FormLabel>
                      <FormControl>
                        <Input placeholder="Ej: Clientes VIP" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Descripción</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Describe el propósito de este grupo..."
                          className="resize-none"
                          rows={4}
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Opcional. Máximo 500 caracteres.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex gap-2 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.back()}
                    disabled={isCreating}
                    className="cursor-pointer"
                  >
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={isCreating} className="cursor-pointer">
                    {isCreating ? "Creando..." : "Crear Grupo"}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>

        {/* Client Selection Section */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>Seleccionar Clientes</CardTitle>
            <CardDescription>
              {selectedClients.length > 0
                ? `${selectedClients.length} cliente${selectedClients.length !== 1 ? "s" : ""} seleccionado${selectedClients.length !== 1 ? "s" : ""}`
                : "Ningún cliente seleccionado"
              }
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="relative">
              <Input
                placeholder="Buscar clientes..."
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
              />
            </div>

            <div className="max-h-96 overflow-y-auto space-y-2 border rounded-lg p-2">
              {filteredClients.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No se encontraron clientes
                </p>
              ) : (
                filteredClients.map((client) => {
                  const isSelected = selectedClients.includes(client.id);
                  return (
                    <div
                      key={client.id}
                      onClick={() => toggleClient(client.id)}
                      className={`
                        flex items-center justify-between p-3 rounded-lg cursor-pointer
                        transition-colors hover:bg-accent
                        ${isSelected ? "bg-primary/10 border-2 border-primary" : "border"}
                      `}
                    >
                      <div>
                        <p className="font-medium">{client.full_name}</p>
                        {client.email && (
                          <p className="text-sm text-muted-foreground">{client.email}</p>
                        )}
                      </div>
                      {isSelected && (
                        <div className="h-5 w-5 rounded-full bg-primary flex items-center justify-center">
                          <Plus className="h-3 w-3 text-primary-foreground rotate-45" />
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}