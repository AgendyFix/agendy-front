"use client";

// ============================================
// NEW TEAM PAGE - Crear nuevo equipo (Admin only)
// ============================================

import { useEffect } from "react";
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
import { useTeams } from "@/lib/hooks/useTeams";
import { useAuth } from "@/lib/hooks/useAuth";
import type { CreateTeamRequest } from "@/lib/types/api";

const teamSchema = z.object({
  name: z.string().min(1, "El nombre es requerido"),
  description: z.string().optional(),
});

type TeamFormData = z.infer<typeof teamSchema>;

export default function NewTeamPage() {
  const router = useRouter();
  const { user, currentCompany } = useAuth();
  const { createTeam, isLoading } = useTeams();

  // Verificar si es admin
  const currentRole = user?.employee_profiles?.find(
    (profile) => profile.company === currentCompany?.id
  )?.role;
  
  const isAdmin = currentRole === "admin";

  useEffect(() => {
    if (!isAdmin) {
      toast.error("Solo administradores pueden crear equipos");
      router.push("/teams");
    }
  }, [isAdmin, router]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<TeamFormData>({
    resolver: zodResolver(teamSchema),
  });

  const onSubmit = async (data: TeamFormData) => {
    try {
      const cleanData: Partial<CreateTeamRequest> = {
        name: data.name.trim(),
      };
      
      if (data.description?.trim()) cleanData.description = data.description.trim();
      
      await createTeam(cleanData as CreateTeamRequest);
      toast.success("Equipo creado exitosamente");
      router.push("/teams");
    } catch (error) {
      toast.error("Error al crear el equipo");
    }
  };

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Nuevo Equipo</h1>
          <p className="text-muted-foreground">
            Crea un nuevo equipo de trabajo
          </p>
        </div>
      </div>

      <Card className="max-w-2xl shadow-card">
        <CardHeader>
          <CardTitle>Información del Equipo</CardTitle>
          <CardDescription>
            Completa los datos del equipo
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

            <div className="flex gap-4">
              <Button
                type="submit"
                disabled={isLoading}
                className="flex-1"
              >
                {isLoading ? "Creando..." : "Crear Equipo"}
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