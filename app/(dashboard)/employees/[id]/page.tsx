"use client";

// ============================================
// EDIT EMPLOYEE PAGE - Editar equipos del empleado (Admin only)
// ============================================

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { toast } from "sonner";
import { ArrowLeft, Shield } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { employeesApi } from "@/lib/api/employees";
import { teamsApi } from "@/lib/api/teams";
import type { Employee, Team } from "@/lib/types/models";
import { useAuth } from "@/lib/hooks/useAuth";

export default function EditEmployeePage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const { user, currentCompany } = useAuth();

  const [employee, setEmployee] = useState<Employee | null>(null);
  const [availableTeams, setAvailableTeams] = useState<Team[]>([]);
  const [selectedTeams, setSelectedTeams] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);

  // Verificar si es admin
  const currentRole = user?.employee_profiles?.find(
    (profile) => profile.company === currentCompany?.id
  )?.role;
  
  const isAdmin = currentRole === "admin";

  useEffect(() => {
    if (!isAdmin) {
      toast.error("Solo administradores pueden editar empleados");
      router.push("/employees");
      return;
    }

    const loadData = async () => {
      try {
        setIsFetching(true);
        
        // Cargar empleado y teams disponibles
        const [employeeData, teamsResponse] = await Promise.all([
          employeesApi.getById(id),
          teamsApi.getAll({ limit: 100, offset: 0 }) // Traer todos los teams
        ]);
        
        setEmployee(employeeData);
        setAvailableTeams(teamsResponse.results);
        setSelectedTeams(employeeData.teams?.map(t => t.id) || []);
      } catch (error) {
        toast.error("Error al cargar datos");
        router.push("/employees");
      } finally {
        setIsFetching(false);
      }
    };

    loadData();
  }, [id, isAdmin, router]);

  const handleToggleTeam = (teamId: string) => {
    setSelectedTeams(prev => 
      prev.includes(teamId)
        ? prev.filter(id => id !== teamId)
        : [...prev, teamId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setIsLoading(true);
      await employeesApi.updateTeams(id, { teams: selectedTeams });
      toast.success("Equipos actualizados exitosamente");
      router.push("/employees");
    } catch (error) {
      toast.error("Error al actualizar equipos");
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
          <p className="text-muted-foreground">Cargando empleado...</p>
        </div>
      </div>
    );
  }

  if (!employee) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Editar Equipos</h1>
          <p className="text-muted-foreground">
            {employee.full_name} - {employee.role === "admin" ? "Administrador" : "Operador"}
          </p>
        </div>
      </div>

      <Card className="max-w-2xl shadow-card">
        <CardHeader>
          <CardTitle>Asignar Equipos</CardTitle>
          <CardDescription>
            Selecciona los equipos a los que pertenece este empleado
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <Label>Equipos Disponibles</Label>
              
              {availableTeams.length === 0 ? (
                <div className="text-center py-8 bg-muted/30 rounded-lg">
                  <p className="text-muted-foreground">
                    No hay equipos creados aún
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    className="mt-4"
                    onClick={() => router.push("/teams")}
                  >
                    Ir a Equipos
                  </Button>
                </div>
              ) : (
                <div className="grid gap-2">
                  {availableTeams.map((team) => (
                    <label
                      key={team.id}
                      className="flex items-center gap-3 p-3 rounded-lg border cursor-pointer hover:bg-accent/50 transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={selectedTeams.includes(team.id)}
                        onChange={() => handleToggleTeam(team.id)}
                        className="h-4 w-4 rounded border-gray-300"
                        disabled={isLoading}
                      />
                      <div className="flex-1">
                        <p className="font-medium">{team.name}</p>
                        {team.description && (
                          <p className="text-sm text-muted-foreground">
                            {team.description}
                          </p>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {team.employee_count} miembro{team.employee_count !== 1 ? "s" : ""}
                      </span>
                    </label>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-muted/30 p-4 rounded-lg">
              <p className="text-sm">
                <Shield className="inline h-4 w-4 mr-1 text-muted-foreground" />
                <strong>Rol del empleado:</strong>{" "}
                {employee.role === "admin" ? "Administrador" : "Operador"}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Los equipos determinan a qué recursos tiene acceso el empleado
              </p>
            </div>

            {availableTeams.length > 0 && (
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
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  );
}