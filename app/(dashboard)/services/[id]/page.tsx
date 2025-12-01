"use client";

// ============================================
// EDIT SERVICE PAGE - Editar servicio existente
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
import { servicesApi } from "@/lib/api/services";
import type { Service } from "@/lib/types/models";

const serviceSchema = z.object({
  name: z.string().min(1, "El nombre es requerido"),
  description: z.string().optional(),
  price: z.string().min(1, "El precio es requerido"),
  duration_minutes: z.number().min(1, "La duración debe ser al menos 1 minuto"),
  buffer_minutes: z.number().min(0, "El buffer no puede ser negativo").default(0),
  is_bookable_online: z.boolean(),
});

export default function EditServicePage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [service, setService] = useState<Service | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(serviceSchema),
  });

  useEffect(() => {
    const loadService = async () => {
      try {
        setIsFetching(true);
        const data = await servicesApi.getById(id);
        setService(data);
        reset({
          name: data.name,
          description: data.description || "",
          price: data.price,
          duration_minutes: data.duration_minutes,
          buffer_minutes: data.buffer_minutes,
          is_bookable_online: data.is_bookable_online,
        });
      } catch (error) {
        toast.error("Error al cargar el servicio");
        router.push("/services");
      } finally {
        setIsFetching(false);
      }
    };

    loadService();
  }, [id, reset, router]);

  const onSubmit = async (data: z.infer<typeof serviceSchema>) => {
    try {
      setIsLoading(true);
      await servicesApi.update(id, data);
      toast.success("Servicio actualizado exitosamente");
      router.push("/services");
    } catch (error) {
      toast.error("Error al actualizar el servicio");
    } finally {
      setIsLoading(false);
    }
  };

  if (isFetching) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4"></div>
          <p className="text-muted-foreground">Cargando servicio...</p>
        </div>
      </div>
    );
  }

  if (!service) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Editar Servicio</h1>
          <p className="text-muted-foreground">
            Actualiza la información del servicio
          </p>
        </div>
      </div>

      <Card className="max-w-2xl shadow-card">
        <CardHeader>
          <CardTitle>Información del Servicio</CardTitle>
          <CardDescription>
            Modifica los datos del servicio
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">Nombre *</Label>
              <Input
                id="name"
                placeholder="Ej: Corte de cabello"
                disabled={isLoading}
                {...register("name")}
              />
              {errors.name && (
                <p className="text-sm text-red-500">{errors.name?.message as string}</p>
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
                <Label htmlFor="price">Precio</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  disabled={isLoading}
                  {...register("price")}
                />
                {errors.price && (
                  <p className="text-sm text-red-500">{errors.price?.message as string}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="duration_minutes">Duración (minutos)</Label>
                <Input
                  id="duration_minutes"
                  type="number"
                  placeholder="60"
                  disabled={isLoading}
                  {...register("duration_minutes", { valueAsNumber: true })}
                />
                {errors.duration_minutes && (
                  <p className="text-sm text-red-500">{errors.duration_minutes?.message as string}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="buffer_minutes">Tiempo de buffer (minutos)</Label>
              <Input
                id="buffer_minutes"
                type="number"
                placeholder="0"
                disabled={isLoading}
                {...register("buffer_minutes", { valueAsNumber: true })}
              />
              <p className="text-sm text-muted-foreground">
                Tiempo adicional después del servicio para preparación
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