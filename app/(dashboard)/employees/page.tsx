"use client";

// ============================================
// INSTRUCTORS PAGE - Lista de instructores/staff
// ============================================

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, UserCog, Shield, Pencil } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table, TableBody, TableCell,
  TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { useEmployees } from "@/lib/hooks/useEmployees";
import { useAuth } from "@/lib/hooks/useAuth";

const ROLE_STYLES: Record<string, string> = {
  admin:    "bg-purple-50 text-purple-700",
  operator: "bg-blue-50 text-blue-700",
};

const ROLE_LABELS: Record<string, string> = {
  admin:    "Admin",
  operator: "Operador",
};

export default function EmployeesPage() {
  const router = useRouter();
  const { user, currentCompany } = useAuth();
  const {
    employees, isLoading, totalCount,
    currentPage, hasNext, hasPrevious, fetchEmployees,
  } = useEmployees();

  const [searchTerm, setSearchTerm] = useState("");
  const hasFetched = useRef(false);

  const isAdmin = user?.employee_profiles?.find(
    (p) => p.company === currentCompany?.id
  )?.role === "admin";

  useEffect(() => {
    if (!hasFetched.current) {
      fetchEmployees({ page: 1 });
      hasFetched.current = true;
    }
  }, []);

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    fetchEmployees({ page: 1, search: value || undefined });
  };

  const handlePageChange = (page: number) => {
    fetchEmployees({ page, search: searchTerm || undefined });
  };

  const list = Array.isArray(employees) ? employees : [];
  const totalPages = Math.ceil(totalCount / 10);

  if (isLoading && list.length === 0) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto" />
      </div>
    );
  }

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Instructores</h1>
          <p className="text-muted-foreground">
            {totalCount > 0
              ? `${totalCount} instructor${totalCount !== 1 ? "es" : ""}`
              : "Staff de la academia"}
          </p>
        </div>
        {!isAdmin && (
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground bg-muted px-3 py-1.5 rounded-md">
            <Shield className="h-4 w-4" />
            Solo lectura
          </div>
        )}
      </div>

      {/* Buscador */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar instructores..."
          value={searchTerm}
          onChange={(e) => handleSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Tabla */}
      {list.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
          <UserCog className="h-12 w-12 text-muted-foreground/30" />
          <p className="text-muted-foreground font-medium">
            {searchTerm ? "Sin resultados" : "No hay instructores registrados"}
          </p>
        </div>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Especialidad</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Rol</TableHead>
                  {isAdmin && <TableHead className="text-right">Acciones</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {list.map((emp) => (
                  <TableRow
                    key={emp.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => router.push(`/employees/${emp.id}`)}
                  >
                    <TableCell className="font-medium">{emp.full_name}</TableCell>
                    <TableCell>
                      {emp.specialty
                        ? <span>{emp.specialty}</span>
                        : <span className="text-muted-foreground italic text-sm">—</span>}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{emp.email}</TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${ROLE_STYLES[emp.role]}`}>
                        {ROLE_LABELS[emp.role]}
                      </span>
                    </TableCell>
                    {isAdmin && (
                      <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => router.push(`/employees/${emp.id}?tab=info`)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Paginación */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">Página {currentPage} de {totalPages}</p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => handlePageChange(currentPage - 1)} disabled={!hasPrevious || isLoading}>
              Anterior
            </Button>
            <Button variant="outline" size="sm" onClick={() => handlePageChange(currentPage + 1)} disabled={!hasNext || isLoading}>
              Siguiente
            </Button>
          </div>
        </div>
      )}

    </div>
  );
}
