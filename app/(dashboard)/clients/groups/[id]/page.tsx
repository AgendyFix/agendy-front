"use client";

// ============================================
// CLIENT GROUP DETAIL PAGE - Ver/editar grupo
// ============================================

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft, Users, Pencil, Trash2, Plus, X } from "lucide-react";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import type { ClientBasic } from "@/lib/types/models";

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
import { useClientGroup, useClientGroups } from "@/lib/hooks/useClientGroups";
import { useClients } from "@/lib/hooks/useClients";

const formSchema = z.object({
  name: z.string().min(1, "El nombre es requerido").max(100, "Máximo 100 caracteres"),
  description: z.string().max(500, "Máximo 500 caracteres").optional(),
});

type FormData = z.infer<typeof formSchema>;

export default function ClientGroupDetailPage() {
  const router = useRouter();
  const params = useParams();
  const groupId = params.id as string;
  
  const { group, isLoading, fetchGroup, updateGroup, updateMembers } = useClientGroup(groupId);
  const { deleteGroup } = useClientGroups();
  const { clients, fetchClients } = useClients();
  
  const [isEditing, setIsEditing] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [addMembersMode, setAddMembersMode] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedClients, setSelectedClients] = useState<string[]>([]);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
    },
  });

  useEffect(() => {
    fetchGroup();
    fetchClients({ page: 1 });
  }, []);

  useEffect(() => {
    if (group) {
      form.reset({
        name: group.name,
        description: group.description || "",
      });
    }
  }, [group, form]);

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
      await updateGroup({
        name: data.name,
        description: data.description,
      });
      toast.success("Grupo actualizado exitosamente");
      setIsEditing(false);
    } catch (error) {
      toast.error("Error al actualizar el grupo");
    }
  };

  const handleAddMembers = async () => {
    if (selectedClients.length === 0) {
      toast.error("Selecciona al menos un cliente");
      return;
    }

    try {
      await updateMembers({
        action: 'add',
        client_ids: selectedClients,
      });
      toast.success(`${selectedClients.length} cliente${selectedClients.length !== 1 ? "s" : ""} agregado${selectedClients.length !== 1 ? "s" : ""}`);
      setAddMembersMode(false);
      setSelectedClients([]);
      setSearchTerm("");
      await fetchGroup();
    } catch (error) {
      toast.error("Error al agregar clientes");
    }
  };

  const handleRemoveMember = async (clientId: string) => {
    try {
      await updateMembers({
        action: 'remove',
        client_ids: [clientId],
      });
      toast.success("Cliente removido del grupo");
      await fetchGroup();
    } catch (error) {
      toast.error("Error al remover cliente");
    }
  };

  const handleDeleteGroup = async () => {
    try {
      await deleteGroup(groupId);
      toast.success("Grupo eliminado exitosamente");
      router.push("/clients");
    } catch (error) {
      toast.error("Error al eliminar el grupo");
    }
  };

  if (isLoading && !group) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4"></div>
          <p className="text-muted-foreground">Cargando grupo...</p>
        </div>
      </div>
    );
  }

  if (!group) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Grupo no encontrado</p>
        <Button onClick={() => router.back()} className="mt-4">
          Volver
        </Button>
      </div>
    );
  }

  const currentMembers = group.clients_list || [];
  const availableClients = clients.filter(
    client => !currentMembers.some((member: ClientBasic) => member.id === client.id)
  );
  const filteredAvailableClients = availableClients.filter(client =>
    client.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
        <div className="flex-1">
          <h1 className="text-3xl font-bold tracking-tight">{group.name}</h1>
          <p className="text-muted-foreground">
            {group.member_count} {group.member_count === 1 ? "cliente" : "clientes"}
          </p>
        </div>
        <div className="flex gap-2">
          {!isEditing && (
            <>
              <Button onClick={() => setIsEditing(true)} className="cursor-pointer">
                <Pencil className="mr-2 h-4 w-4" />
                Editar
              </Button>
              <Button
                variant="destructive"
                onClick={() => setDeleteDialogOpen(true)}
                className="cursor-pointer"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Eliminar
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Info Section */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>Información del Grupo</CardTitle>
          </CardHeader>
          <CardContent>
            {isEditing ? (
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nombre del Grupo *</FormLabel>
                        <FormControl>
                          <Input {...field} />
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
                            className="resize-none"
                            rows={4}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex gap-2 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setIsEditing(false);
                        form.reset();
                      }}
                      className="cursor-pointer"
                    >
                      Cancelar
                    </Button>
                    <Button type="submit" disabled={isLoading} className="cursor-pointer">
                      Guardar Cambios
                    </Button>
                  </div>
                </form>
              </Form>
            ) : (
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Nombre</p>
                  <p className="text-lg">{group.name}</p>
                </div>
                {group.description && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Descripción</p>
                    <p className="text-sm">{group.description}</p>
                  </div>
                )}
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Creado</p>
                  <p className="text-sm">
                    {new Date(group.created_at).toLocaleDateString('es-MX', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Members Section */}
        <Card className="shadow-card">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Miembros del Grupo</CardTitle>
                <CardDescription>
                  {currentMembers.length} {currentMembers.length === 1 ? "cliente" : "clientes"}
                </CardDescription>
              </div>
              {!addMembersMode && (
                <Button size="sm" onClick={() => setAddMembersMode(true)} className="cursor-pointer">
                  <Plus className="mr-2 h-4 w-4" />
                  Agregar
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {addMembersMode ? (
              <div className="space-y-4">
                <div className="relative">
                  <Input
                    placeholder="Buscar clientes..."
                    value={searchTerm}
                    onChange={(e) => handleSearch(e.target.value)}
                  />
                </div>

                <div className="max-h-96 overflow-y-auto space-y-2 border rounded-lg p-2">
                  {filteredAvailableClients.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">
                      {availableClients.length === 0
                        ? "Todos los clientes ya están en el grupo"
                        : "No se encontraron clientes"
                      }
                    </p>
                  ) : (
                    filteredAvailableClients.map((client) => {
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

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setAddMembersMode(false);
                      setSelectedClients([]);
                      setSearchTerm("");
                    }}
                    className="cursor-pointer"
                  >
                    Cancelar
                  </Button>
                  <Button
                    onClick={handleAddMembers}
                    disabled={selectedClients.length === 0 || isLoading}
                    className="cursor-pointer"
                  >
                    Agregar {selectedClients.length > 0 && `(${selectedClients.length})`}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                {currentMembers.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    No hay clientes en este grupo
                  </p>
                ) : (
                  currentMembers.map((member: ClientBasic) => (
                    <div
                      key={member.id}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div>
                        <p className="font-medium">{member.full_name}</p>
                        {member.email && (
                          <p className="text-sm text-muted-foreground">{member.email}</p>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveMember(member.id)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar grupo?</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Estás seguro de que deseas eliminar el grupo <strong>&quot;{group?.name}&quot;</strong>?
              Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="cursor-pointer">Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteGroup} className="bg-red-600 hover:bg-red-700 cursor-pointer">
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}