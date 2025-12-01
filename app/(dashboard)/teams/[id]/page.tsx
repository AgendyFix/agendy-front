"use client";

// ============================================
// EDIT TEAM PAGE - Editar equipo (Admin only)
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
import { teamsApi } from "@/lib/api/teams";
import type { Team } from "@/lib/types/models";
import type { CreateTeamRequest } from "@/lib/types/api";
import { useAuth } from "@/lib/hooks/useAuth";

const teamSchema = z.object({
  name: z.string().min(1, "El nombre es requerido"),
  description: z.string().optional(),
});

type TeamFormData = z.infer<typeof teamSchema>;

export default function EditTeamPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const { user, currentCompany } = useAuth();

  const [team, setTeam] = useState<Team | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);

  // Verificar si es admin
  const currentRole = user?.employee_profiles?.find(
    (profile) => profile.company === currentCompany?.id
  )?.role;
  
  const isAdmin = currentRole === "admin";

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<TeamFormData>({
    resolver: zodResolver(teamSchema),
  });

  useEffect(() => {
    if (!isAdmin) {
      toast.error("Solo administradores pueden editar equipos");
      router.push("/teams");
      return;
    }

    const loadTeam = async () => {
      try {
        setIsFetching(true);
        const data = await teamsApi.getById(id);
        setTeam(data);
        reset({
          name: data.name,
          description: data.description || "",
        });
      } catch (error) {
        toast.error("Error al cargar el equipo");
        router.push("/teams");
      } finally {
        setIsFetching(false);
      }
    };

    loadTeam();
  }, [id, reset, router, isAdmin]);

  const onSubmit = async (data: TeamFormData) => {
    try {
      setIsLoading(true);
      
      const cleanData: Partial<CreateTeamRequest> = {
        name: data.name.trim(),
      };
      
      if (data.description?.trim()) cleanData.description = data.description.trim();
      
      await teamsApi.update(id, cleanData);
      toast.success("Equipo actualizado exitosamente");
      router.push("/teams");
    } catch (error) {
      toast.error("Error al actualizar el equipo");
    } finally {
      setIsLoading(false);
    }
  };

  if (!isAdmin) {
    return null;
  }

  if (isFetching) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4"></div>
          <p className="text-muted-foreground">Cargando equipo...</p>
        </div>
      </div>
    );
  }

  if (!team) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Editar Equipo</h1>
          <p className="text-muted-foreground">
            Actualiza la información del equipo
          </p>
        </div>
      </div>

      <Card className="max-w-2xl shadow-card">
        <CardHeader>
          <CardTitle>Información del Equipo</CardTitle>
          <CardDescription>
            Modifica los datos del equipo. Los empleados asignados se gestionan desde el módulo de Empleados.
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
                placeholder="Ej: Equipo de Estilistas"
                disabled={isLoading}
                {...register("name")}
              />
              {errors.name && (
                <p className="text-sm text-red-500">{errors.name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descripción (opcional)</Label>
              <Input
                id="description"
                placeholder="Descripción del equipo"
                disabled={isLoading}
                {...register("description")}
              />
              <p className="text-xs text-muted-foreground">
                Información adicional sobre el equipo
              </p>
            </div>

            <div className="bg-muted/30 p-4 rounded-lg">
              <p className="text-sm font-medium mb-2">
                Miembros actuales: {team.employee_count}
              </p>
              <p className="text-xs text-muted-foreground">
                Para asignar o quitar empleados de este equipo, ve al módulo de Empleados
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