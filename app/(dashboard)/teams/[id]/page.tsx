"use client";

// ============================================
// TEAM DETAIL PAGE - Ver/Editar equipo (solo lectura para operators)
// ============================================

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { ArrowLeft, Shield, User } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
  }, [id, reset, router]);

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
        <div className="flex-1">
          <h1 className="text-3xl font-bold tracking-tight">
            {isAdmin ? "Editar Equipo" : "Detalle del Equipo"}
          </h1>
          <p className="text-muted-foreground">
            {isAdmin ? "Actualiza la información del equipo" : "Información del equipo y sus miembros"}
          </p>
        </div>
        {!isAdmin && (
          <div className="text-sm text-muted-foreground bg-muted px-3 py-1.5 rounded-md">
            <Shield className="inline h-4 w-4 mr-1" />
            Solo lectura
          </div>
        )}
      </div>

      <div className="max-w-4xl space-y-6">
        {/* Información Básica */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>Información del Equipo</CardTitle>
            <CardDescription>
              {isAdmin
                ? "Modifica los datos del equipo. Los empleados asignados se gestionan desde el módulo de Empleados."
                : "Datos generales del equipo"
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isAdmin ? (
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
            ) : (
              <div className="space-y-4">
                <div>
                  <Label className="text-muted-foreground">Nombre</Label>
                  <p className="text-lg font-medium mt-1">{team.name}</p>
                </div>
                {team.description && (
                  <div>
                    <Label className="text-muted-foreground">Descripción</Label>
                    <p className="mt-1">{team.description}</p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Lista de Miembros */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>Miembros del Equipo</CardTitle>
            <CardDescription>
              {team.employee_count > 0
                ? `${team.employee_count} miembro${team.employee_count !== 1 ? "s" : ""} en este equipo`
                : "No hay miembros asignados a este equipo"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {team.employees_list && team.employees_list.length > 0 ? (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Empleado</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Rol</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {team.employees_list.map((employee) => (
                      <TableRow key={employee.id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-muted-foreground" />
                            <p>{employee.full_name}</p>
                          </div>
                        </TableCell>
                        <TableCell>{employee.email}</TableCell>
                        <TableCell>
                          <span
                            className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${employee.role === "admin"
                              ? "bg-purple-50 text-purple-700"
                              : "bg-blue-50 text-blue-700"
                              }`}
                          >
                            {employee.role === "admin" ? "Administrador" : "Operador"}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <p>No hay miembros asignados a este equipo</p>
                {isAdmin && (
                  <p className="text-xs mt-2">
                    Para asignar empleados, ve al módulo de Empleados
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}