"use client";

// ============================================
// NEW CLIENT PAGE
// ============================================

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useClients } from "@/lib/hooks/useClients";
import { useFeatures } from "@/lib/hooks/useFeatures";
import type { CreateClientRequest } from "@/lib/types/api";

const clientSchema = z.object({
  name: z.string().min(1, "El nombre es requerido"),
  last_name: z.string().min(1, "El apellido es requerido"),
  email: z.string().email("Email inválido").optional().or(z.literal("")),
  phone: z.string().min(1, "El teléfono es requerido"),
});

type ClientFormData = z.infer<typeof clientSchema>;

export default function NewClientPage() {
  const router = useRouter();
  const { createClient, isLoading } = useClients();
  const { getFeatureName } = useFeatures();

  const entityName = getFeatureName("client_groups") ?? "Clientes";
  const entitySingular = entityName.endsWith("s") ? entityName.slice(0, -1) : entityName;

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ClientFormData>({
    resolver: zodResolver(clientSchema),
  });

  const onSubmit = async (data: ClientFormData) => {
    try {
      const cleanData: Partial<CreateClientRequest> = {
        name: data.name.trim(),
        last_name: data.last_name.trim(),
        phone: data.phone.trim(),
      };
      if (data.email?.trim()) cleanData.email = data.email.trim();

      await createClient(cleanData as CreateClientRequest);
      toast.success(`${entitySingular} creado exitosamente`);
      router.push("/clients");
    } catch {
      toast.error(`Error al crear el ${entitySingular.toLowerCase()}`);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-3xl font-bold tracking-tight">
          Nuevo {entitySingular}
        </h1>
      </div>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Datos del {entitySingular}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">

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
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email (opcional)</Label>
              <Input
                id="email"
                type="email"
                placeholder="ejemplo@correo.com"
                disabled={isLoading}
                {...register("email")}
              />
              {errors.email && (
                <p className="text-sm text-red-500">{errors.email.message}</p>
              )}
            </div>

            <div className="flex gap-4 pt-1">
              <Button type="submit" disabled={isLoading} className="flex-1">
                {isLoading ? "Creando..." : `Crear ${entitySingular}`}
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
