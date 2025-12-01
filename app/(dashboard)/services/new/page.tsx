"use client";

// ============================================
// NEW SERVICE PAGE - Crear nuevo servicio
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useServices } from "@/lib/hooks/useServices";
import type { CreateServiceRequest } from "@/lib/types/api";

const serviceSchema = z.object({
  name: z.string().min(1, "El nombre es requerido"),
  description: z.string().optional(),
  price: z.string().optional(),
  duration_minutes: z.string().optional(),
  buffer_minutes: z.string().optional(),
  is_bookable_online: z.boolean(),
});

type ServiceFormData = z.infer<typeof serviceSchema>;

export default function NewServicePage() {
  const router = useRouter();
  const { createService, isLoading } = useServices();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(serviceSchema),
    defaultValues: {
      is_bookable_online: true,
    },
  });

  const onSubmit = async (data: ServiceFormData) => {
    try {
      // Limpiar campos vacíos y NaN antes de enviar
      const cleanData: Partial<CreateServiceRequest> = {
        name: data.name.trim(),
        is_bookable_online: data.is_bookable_online,
      };
      
      if (data.description?.trim()) cleanData.description = data.description.trim();
      if (data.price?.trim()) cleanData.price = data.price.trim();
      
      // Convertir strings a números solo si tienen valor
      if (data.duration_minutes?.trim()) {
        const duration = parseInt(data.duration_minutes);
        if (!isNaN(duration) && duration > 0) {
          cleanData.duration_minutes = duration;
        }
      }
      
      if (data.buffer_minutes?.trim()) {
        const buffer = parseInt(data.buffer_minutes);
        if (!isNaN(buffer) && buffer >= 0) {
          cleanData.buffer_minutes = buffer;
        }
      }
      
      await createService(cleanData as CreateServiceRequest);
      toast.success("Servicio creado exitosamente");
      router.push("/services");
    } catch (error) {
      toast.error("Error al crear el servicio");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Nuevo Servicio</h1>
          <p className="text-muted-foreground">
            Crea un nuevo servicio para tu empresa
          </p>
        </div>
      </div>

      <Card className="max-w-2xl shadow-card">
        <CardHeader>
          <CardTitle>Información del Servicio</CardTitle>
          <CardDescription>
            Completa los datos del servicio que deseas ofrecer
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">
                Nombre <span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                placeholder="Ej: Corte de cabello"
                disabled={isLoading}
                {...register("name")}
              />
              {errors.name && (
                <p className="text-sm text-red-500">{errors.name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descripción</Label>
              <Input
                id="description"
                placeholder="Descripción del servicio (opcional)"
                disabled={isLoading}
                {...register("description")}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="price">Precio (opcional)</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  placeholder="Ej: 300.00"
                  disabled={isLoading}
                  {...register("price")}
                />
                <p className="text-xs text-muted-foreground">
                  Deja vacío si no tiene precio fijo
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="duration_minutes">Duración (opcional)</Label>
                <Input
                  id="duration_minutes"
                  type="text"
                  inputMode="numeric"
                  placeholder="Ej: 60"
                  disabled={isLoading}
                  {...register("duration_minutes")}
                />
                <p className="text-xs text-muted-foreground">
                  En minutos
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="buffer_minutes">Tiempo de buffer (opcional)</Label>
              <Input
                id="buffer_minutes"
                type="text"
                inputMode="numeric"
                placeholder="Ej: 15"
                disabled={isLoading}
                {...register("buffer_minutes")}
              />
              <p className="text-xs text-muted-foreground">
                Tiempo adicional después del servicio (en minutos)
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="is_bookable_online"
                className="h-4 w-4 rounded border-gray-300"
                disabled={isLoading}
                {...register("is_bookable_online")}
              />
              <Label htmlFor="is_bookable_online" className="font-normal cursor-pointer">
                Permitir reservas en línea
              </Label>
            </div>

            <div className="flex gap-4">
              <Button
                type="submit"
                disabled={isLoading}
                className="flex-1"
              >
                {isLoading ? "Creando..." : "Crear Servicio"}
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