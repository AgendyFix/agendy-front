"use client";

// ============================================
// EMPLOYEES PAGE - Lista de empleados (solo lectura)
// ============================================

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Search, Shield, User } from "lucide-react";

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
import { useEmployees } from "@/lib/hooks/useEmployees";
import { useAuth } from "@/lib/hooks/useAuth";

export default function EmployeesPage() {
  const router = useRouter();
  const { user, currentCompany } = useAuth();
  const {
    employees,
    isLoading,
    totalCount,
    currentPage,
    hasNext,
    hasPrevious,
    fetchEmployees
  } = useEmployees();
  const [searchTerm, setSearchTerm] = useState("");
  const hasFetched = useRef(false);

  // Obtener el rol del usuario actual
  const currentRole = user?.employee_profiles?.find(
    (profile) => profile.company === currentCompany?.id
  )?.role;
  
  const isAdmin = currentRole === "admin";

  useEffect(() => {
    if (!hasFetched.current) {
      fetchEmployees({ page: 1 });
      hasFetched.current = true;
    }
  }, []);

  const handlePageChange = (page: number) => {
    fetchEmployees({ 
      page, 
      search: searchTerm || undefined 
    });
  };

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    fetchEmployees({ 
      page: 1, 
      search: value || undefined 
    });
  };

  const filteredEmployees = Array.isArray(employees) ? employees : [];
  
  const startItem = totalCount === 0 ? 0 : (currentPage - 1) * 10 + 1;
  const endItem = Math.min(currentPage * 10, totalCount);
  const totalPages = Math.ceil(totalCount / 10);

  if (isLoading && employees.length === 0) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4"></div>
          <p className="text-muted-foreground">Cargando empleados...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Empleados</h1>
          <p className="text-muted-foreground">
            Listado de empleados de tu empresa
          </p>
        </div>
        {!isAdmin && (
          <div className="text-sm text-muted-foreground bg-muted px-3 py-1.5 rounded-md">
            <Shield className="inline h-4 w-4 mr-1" />
            Solo lectura
          </div>
        )}
      </div>

      <Card className="shadow-card">
        <CardHeader>
          <CardTitle>Lista de Empleados</CardTitle>
          <CardDescription>
            {totalCount > 0
              ? `Mostrando ${startItem}-${endItem} de ${totalCount} empleado${totalCount !== 1 ? "s" : ""}`
              : "No hay empleados registrados"
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar empleados..."
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>

          {filteredEmployees.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">
                {searchTerm
                  ? "No se encontraron empleados"
                  : "No hay empleados registrados"}
              </p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Empleado</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Rol</TableHead>
                    <TableHead>Equipos</TableHead>
                    {isAdmin && <TableHead className="text-right">Acciones</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredEmployees.map((employee) => (
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
                          className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                            employee.role === "admin"
                              ? "bg-purple-50 text-purple-700"
                              : "bg-blue-50 text-blue-700"
                          }`}
                        >
                          {employee.role === "admin" ? "Administrador" : "Operador"}
                        </span>
                      </TableCell>
                      <TableCell>
                        {employee.teams_count > 0 ? (
                          <span className="inline-flex items-center rounded-full bg-green-50 text-green-700 px-2 py-1 text-xs font-medium">
                            {employee.teams_count} equipo{employee.teams_count !== 1 ? "s" : ""}
                          </span>
                        ) : (
                          <span className="text-muted-foreground italic text-sm">
                            Sin equipos
                          </span>
                        )}
                      </TableCell>
                      {isAdmin && (
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => router.push(`/employees/${employee.id}`)}
                            title="Editar equipos"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
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
    </div>
  );
}