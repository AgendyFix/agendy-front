"use client";

// ============================================
// TEAMS PAGE - Lista de equipos (solo lectura para operators)
// ============================================

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Trash2, Search, Users, Shield } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { useTeams } from "@/lib/hooks/useTeams";
import { useAuth } from "@/lib/hooks/useAuth";

export default function TeamsPage() {
  const router = useRouter();
  const { user, currentCompany } = useAuth();
  const {
    teams,
    isLoading,
    totalCount,
    currentPage,
    hasNext,
    hasPrevious,
    fetchTeams,
    deleteTeam
  } = useTeams();
  const [searchTerm, setSearchTerm] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [teamToDelete, setTeamToDelete] = useState<{ id: string; name: string } | null>(null);
  const hasFetched = useRef(false);

  // Verificar si es admin
  const currentRole = user?.employee_profiles?.find(
    (profile) => profile.company === currentCompany?.id
  )?.role;

  const isAdmin = currentRole === "admin";

  useEffect(() => {
    if (!hasFetched.current) {
      fetchTeams({ page: 1 });
      hasFetched.current = true;
    }
  }, []);

  const handlePageChange = (page: number) => {
    fetchTeams({
      page,
      search: searchTerm || undefined
    });
  };

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    fetchTeams({
      page: 1,
      search: value || undefined
    });
  };

  const openDeleteDialog = (id: string, name: string) => {
    setTeamToDelete({ id, name });
    setDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!teamToDelete) return;

    try {
      await deleteTeam(teamToDelete.id);
      toast.success("Equipo eliminado exitosamente");
      setDeleteDialogOpen(false);
      setTeamToDelete(null);
    } catch (error) {
      toast.error("Error al eliminar el equipo");
    }
  };

  const filteredTeams = Array.isArray(teams) ? teams : [];

  const startItem = totalCount === 0 ? 0 : (currentPage - 1) * 10 + 1;
  const endItem = Math.min(currentPage * 10, totalCount);
  const totalPages = Math.ceil(totalCount / 10);



  if (isLoading && teams.length === 0) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4"></div>
          <p className="text-muted-foreground">Cargando equipos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Equipos</h1>
          <p className="text-muted-foreground">
            {isAdmin ? "Gestiona los equipos de trabajo de tu empresa" : "Listado de equipos de tu empresa"}
          </p>
        </div>
        {isAdmin ? (
          <Button onClick={() => router.push("/teams/new")}>
            <Plus className="mr-2 h-4 w-4" />
            Nuevo Equipo
          </Button>
        ) : (
          <div className="text-sm text-muted-foreground bg-muted px-3 py-1.5 rounded-md">
            <Shield className="inline h-4 w-4 mr-1" />
            Solo lectura
          </div>
        )}
      </div>

      <Card className="shadow-card">
        <CardHeader>
          <CardTitle>Lista de Equipos</CardTitle>
          <CardDescription>
            {totalCount > 0
              ? `Mostrando ${startItem}-${endItem} de ${totalCount} equipo${totalCount !== 1 ? "s" : ""}`
              : "No hay equipos registrados"
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar equipos..."
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>

          {filteredTeams.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground mb-2">
                {searchTerm
                  ? "No se encontraron equipos"
                  : "No hay equipos registrados"}
              </p>
              {!searchTerm && isAdmin && (
                <Button
                  onClick={() => router.push("/teams/new")}
                  className="mt-4"
                  variant="outline"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Crear primer equipo
                </Button>
              )}
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Equipo</TableHead>
                    <TableHead>Descripción</TableHead>
                    <TableHead>Miembros</TableHead>
                    {isAdmin && <TableHead className="text-right">Acciones</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTeams.map((team) => (
                    <TableRow
                      key={team.id}
                      className="cursor-pointer hover:bg-accent/50 transition-colors"
                      onClick={() => router.push(`/teams/${team.id}`)}
                    >
                      <TableCell className="font-medium">
                        <p className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          {team.name}
                        </p>
                      </TableCell>
                      <TableCell>
                        {team.description ? (
                          <p className="text-sm text-muted-foreground">
                            {team.description}
                          </p>
                        ) : (
                          <span className="text-muted-foreground italic text-sm">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {team.employee_count > 0 ? (
                          <span className="inline-flex items-center rounded-full bg-green-50 text-green-700 px-2 py-1 text-xs font-medium">
                            {team.employee_count} miembro{team.employee_count !== 1 ? "s" : ""}
                          </span>
                        ) : (
                          <span className="text-muted-foreground italic text-sm">
                            Sin miembros
                          </span>
                        )}
                      </TableCell>
                      {isAdmin && (
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => router.push(`/teams/${team.id}`)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => openDeleteDialog(team.id, team.name)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-2 py-4">
              <div className="text-sm text-muted-foreground">
                Página {currentPage} de {totalPages}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={!hasPrevious || isLoading}
                >
                  Anterior
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={!hasNext || isLoading}
                >
                  Siguiente
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar equipo?</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Estás seguro de que deseas eliminar el equipo <strong>&quot;{teamToDelete?.name}&quot;</strong>?
              Los empleados asignados perderán la asociación a este equipo.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}