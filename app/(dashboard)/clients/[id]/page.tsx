"use client";

// ============================================
// EDIT CLIENT PAGE - Editar cliente existente
// ============================================

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { clientsApi } from "@/lib/api/clients";
import type { Client } from "@/lib/types/models";
import type { CreateClientRequest } from "@/lib/types/api";

const clientSchema = z.object({
  name: z.string().min(1, "El nombre es requerido"),
  last_name: z.string().min(1, "El apellido es requerido"),
  email: z.string().email("Email inválido").optional().or(z.literal("")),
  phone: z.string().min(1, "El teléfono es requerido"),
});

type ClientFormData = z.infer<typeof clientSchema>;

export default function EditClientPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [client, setClient] = useState<Client | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ClientFormData>({
    resolver: zodResolver(clientSchema),
  });

  useEffect(() => {
    const loadClient = async () => {
      try {
        setIsFetching(true);
        const data = await clientsApi.getById(id);
        setClient(data);
        reset({
          name: data.name,
          last_name: data.last_name,
          email: data.email || "",
          phone: data.phone || "",
        });
      } catch (error) {
        toast.error("Error al cargar el cliente");
        router.push("/clients");
      } finally {
        setIsFetching(false);
      }
    };

    loadClient();
  }, [id, reset, router]);

  const onSubmit = async (data: ClientFormData) => {
    try {
      setIsLoading(true);
      
      // Limpiar campos vacíos antes de enviar
      const cleanData: Partial<CreateClientRequest> = {
        name: data.name.trim(),
        last_name: data.last_name.trim(),
        phone: data.phone.trim(),
      };
      
      if (data.email?.trim()) cleanData.email = data.email.trim();
      
      await clientsApi.update(id, cleanData);
      toast.success("Cliente actualizado exitosamente");
      router.push("/clients");
    } catch (error) {
      toast.error("Error al actualizar el cliente");
    } finally {
      setIsLoading(false);
    }
  };

  if (isFetching) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4"></div>
          <p className="text-muted-foreground">Cargando cliente...</p>
        </div>
      </div>
    );
  }

  if (!client) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Editar Cliente</h1>
          <p className="text-muted-foreground">
            Actualiza la información del cliente
          </p>
        </div>
      </div>

      <Card className="max-w-2xl shadow-card">
        <CardHeader>
          <CardTitle>Información del Cliente</CardTitle>
          <CardDescription>
            Modifica los datos del cliente
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">
                  Nombre <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="name"
                  placeholder="Ej: Juan"
                  disabled={isLoading}
                  {...register("name")}
                />
                {errors.name && (
                  <p className="text-sm text-red-500">{errors.name.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="last_name">
                  Apellido <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="last_name"
                  placeholder="Ej: Pérez"
                  disabled={isLoading}
                  {...register("last_name")}
                />
                {errors.last_name && (
                  <p className="text-sm text-red-500">{errors.last_name.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email (opcional)</Label>
              <Input
                id="email"
                type="email"
                placeholder="cliente@ejemplo.com"
                disabled={isLoading}
                {...register("email")}
              />
              {errors.email && (
                <p className="text-sm text-red-500">{errors.email.message}</p>
              )}
              <p className="text-xs text-muted-foreground">
                Para enviar confirmaciones y recordatorios
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">
                Teléfono <span className="text-red-500">*</span>
              </Label>
              <Input
                id="phone"
                type="tel"
                placeholder="Ej: 9991234567"
                disabled={isLoading}
                {...register("phone")}
              />
              {errors.phone && (
                <p className="text-sm text-red-500">{errors.phone.message}</p>
              )}
              <p className="text-xs text-muted-foreground">
                Para contacto directo
              </p>
            </div>

            <div className="flex gap-4">
              <Button
                type="submit"
                disabled={isLoading}
                className="flex-1"
              >
                {isLoading ? "Guardando..." : "Guardar Cambios"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={isLoading}
              >
                Cancelar
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}