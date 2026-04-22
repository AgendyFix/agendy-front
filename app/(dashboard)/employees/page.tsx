"use client";

// ============================================
// INSTRUCTORS PAGE - Lista de instructores/staff
// ============================================

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, UserCog, Shield, Pencil, UserMinus, GraduationCap, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table, TableBody, TableCell,
  TableHead, TableHeader, TableRow,
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
import { useEmployees } from "@/lib/hooks/useEmployees";
import { useAuth } from "@/lib/hooks/useAuth";
import { employeesApi } from "@/lib/api/employees";
import { classGroupsApi } from "@/lib/api/classGroups";
import { CreateEmployeeDialog } from "@/components/employees/CreateEmployeeDialog";
import type { Employee, ClassGroup } from "@/lib/types/models";

const ROLE_STYLES: Record<string, string> = {
  admin:      "bg-purple-50 text-purple-700",
  instructor: "bg-blue-50 text-blue-700",
};

const ROLE_LABELS: Record<string, string> = {
  admin:      "Admin",
  instructor: "Instructor",
};

export default function EmployeesPage() {
  const router = useRouter();
  const { user, currentCompany } = useAuth();
  const {
    employees, isLoading, totalCount,
    currentPage, hasNext, hasPrevious, fetchEmployees,
  } = useEmployees();

  const [searchTerm, setSearchTerm]                         = useState("");
  const [deactivating, setDeactivating]                     = useState(false);
  const [employeeToDeactivate, setEmployeeToDeactivate]     = useState<Employee | null>(null);
  const [employeeGroups, setEmployeeGroups]                 = useState<ClassGroup[]>([]);
  const [loadingGroups, setLoadingGroups]                   = useState(false);
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

  // Al abrir el dialog de baja, carga los grupos del instructor
  const openDeactivateDialog = async (emp: Employee) => {
    setEmployeeToDeactivate(emp);
    setEmployeeGroups([]);
    try {
      setLoadingGroups(true);
      const data = await classGroupsApi.getAll({ instructor: emp.id, limit: 50 });
      setEmployeeGroups(data.results);
    } catch {
      // no bloqueante — si falla, el dialog igual aparece vacío
    } finally {
      setLoadingGroups(false);
    }
  };

  const handleDeactivate = async () => {
    if (!employeeToDeactivate) return;
    try {
      setDeactivating(true);
      await employeesApi.delete(employeeToDeactivate.id);
      toast.success(`${employeeToDeactivate.full_name} eliminado`);
      fetchEmployees({ page: currentPage, search: searchTerm || undefined });
    } catch {
      toast.error("Error al eliminar el instructor");
    } finally {
      setDeactivating(false);
      setEmployeeToDeactivate(null);
      setEmployeeGroups([]);
    }
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
        <div className="flex items-center gap-2">
          {!isAdmin && (
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground bg-muted px-3 py-1.5 rounded-md">
              <Shield className="h-4 w-4" />
              Solo lectura
            </div>
          )}
          {isAdmin && (
            <CreateEmployeeDialog
              onCreated={() => fetchEmployees({ page: 1, search: searchTerm || undefined })}
            />
          )}
        </div>
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
          {isAdmin && !searchTerm && (
            <CreateEmployeeDialog
              onCreated={() => fetchEmployees({ page: 1 })}
            />
          )}
        </div>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                   <TableHead>Disciplinas</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Teléfono</TableHead>
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
                      {emp.disciplines && emp.disciplines.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {emp.disciplines.map((d) => (
                            <span
                              key={d.id}
                              className="inline-flex items-center rounded-md bg-secondary text-secondary-foreground px-1.5 py-0.5 text-xs font-medium"
                            >
                              {d.name}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-muted-foreground italic text-sm">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{emp.email || "—"}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{emp.phone || "—"}</TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${ROLE_STYLES[emp.role] ?? "bg-gray-50 text-gray-700"}`}>
                        {ROLE_LABELS[emp.role] ?? emp.role}
                      </span>
                    </TableCell>
                    {isAdmin && (
                      <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => router.push(`/employees/${emp.id}?tab=info`)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            title="Eliminar instructor"
                            className="text-red-500 hover:text-red-600 hover:bg-red-50 disabled:opacity-40 disabled:pointer-events-none"
                            disabled={emp.role === "admin"}
                            onClick={() => openDeactivateDialog(emp)}
                          >
                            <UserMinus className="h-4 w-4" />
                          </Button>
                        </div>
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

      {/* Confirmación de eliminación */}
      <AlertDialog
        open={!!employeeToDeactivate}
        onOpenChange={(v) => { if (!v) { setEmployeeToDeactivate(null); setEmployeeGroups([]); } }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar a {employeeToDeactivate?.full_name}?</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3 text-sm text-muted-foreground">
                {loadingGroups ? (
                  <div className="flex items-center gap-2 py-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Verificando grupos asignados...</span>
                  </div>
                ) : employeeGroups.length > 0 ? (
                  <>
                    <p>
                      Este instructor tiene{" "}
                      <strong className="text-foreground">
                        {employeeGroups.length} grupo{employeeGroups.length !== 1 ? "s" : ""} asignado{employeeGroups.length !== 1 ? "s" : ""}
                      </strong>.
                      Debes desasignarlo de todos los grupos antes de eliminarlo.
                    </p>
                    <ul className="space-y-1 border rounded-md p-3 bg-muted/40">
                      {employeeGroups.map((g) => (
                        <li key={g.id} className="flex items-center gap-2">
                          <GraduationCap className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                          <span className="font-medium text-foreground">{g.name}</span>
                          <span className="text-xs">— {g.schedule_display}</span>
                        </li>
                      ))}
                    </ul>
                  </>
                ) : (
                  <p>
                    El registro de{" "}
                    <strong className="text-foreground">{employeeToDeactivate?.full_name}</strong>{" "}
                    será eliminado permanentemente. Esta acción no se puede deshacer.
                  </p>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deactivating}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeactivate}
              disabled={deactivating || loadingGroups || employeeGroups.length > 0}
              className="bg-red-600 hover:bg-red-700 disabled:opacity-50"
            >
              {deactivating ? "Eliminando..." : "Eliminar instructor"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </div>
  );
}
