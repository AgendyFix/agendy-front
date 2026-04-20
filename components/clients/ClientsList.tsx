"use client";

// ============================================
// CLIENTS LIST
// ============================================

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Trash2, Search, Phone, Mail } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription } from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useClients } from "@/lib/hooks/useClients";
import { Pagination } from "@/components/ui/Pagination";
import type { ClientEnrollmentStatus } from "@/lib/types/models";

// ── Types & constants ──────────────────────────────────────────────────────

interface ClientsListProps {
  entityName?: string;
}

type StatusFilter = 'all' | ClientEnrollmentStatus;

const STATUS_TABS: { value: StatusFilter; label: string }[] = [
  { value: "all",     label: "Todos"   },
  { value: "active",  label: "Activos" },
  { value: "paused",  label: "Pausados"},
  { value: "dropped", label: "Baja"    },
];

const STATUS_BADGE: Record<ClientEnrollmentStatus, { label: string; className: string }> = {
  active:  { label: "Activo",  className: "bg-green-100 text-green-700"  },
  paused:  { label: "Pausado", className: "bg-yellow-100 text-yellow-700" },
  dropped: { label: "Baja",    className: "bg-red-100 text-red-700"      },
};

// ── Component ──────────────────────────────────────────────────────────────

export function ClientsList({ entityName = "Clientes" }: ClientsListProps) {
  const router = useRouter();
  const {
    clients, isLoading, totalCount, currentPage, hasNext, hasPrevious,
    fetchClients, deleteClient,
  } = useClients();

  const [searchTerm, setSearchTerm]   = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [clientToDelete, setClientToDelete] = useState<{ id: string; name: string } | null>(null);
  const hasFetched = useRef(false);

  const entitySingular = entityName.endsWith("s") ? entityName.slice(0, -1) : entityName;

  // ── Fetch helpers ──────────────────────────────────────────────────────

  const doFetch = useCallback((page: number, search: string, status: StatusFilter) => {
    fetchClients({
      page,
      search:            search || undefined,
      enrollment_status: status === "all" ? undefined : status,
    });
  }, [fetchClients]);

  useEffect(() => {
    if (!hasFetched.current) {
      doFetch(1, "", "all");
      hasFetched.current = true;
    }
  }, [doFetch]);

  // ── Handlers ──────────────────────────────────────────────────────────

  const handlePageChange = (page: number) => {
    doFetch(page, searchTerm, statusFilter);
  };

  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleSearch = useCallback((value: string) => {
    setSearchTerm(value);
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    searchDebounceRef.current = setTimeout(() => {
      doFetch(1, value, statusFilter);
    }, 350);
  }, [doFetch, statusFilter]);

  const handleStatusFilter = (status: StatusFilter) => {
    setStatusFilter(status);
    doFetch(1, searchTerm, status);
  };

  const openDeleteDialog = (id: string, name: string) => {
    setClientToDelete({ id, name });
    setDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!clientToDelete) return;
    try {
      await deleteClient(clientToDelete.id);
      toast.success(`${entitySingular} eliminado exitosamente`);
      setDeleteDialogOpen(false);
      setClientToDelete(null);
    } catch {
      toast.error(`Error al eliminar el ${entitySingular.toLowerCase()}`);
    }
  };

  const filteredClients = Array.isArray(clients) ? clients : [];
  const totalPages = Math.ceil(totalCount / 10);

  // ── Loading inicial ────────────────────────────────────────────────────

  if (isLoading && clients.length === 0) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4" />
          <p className="text-muted-foreground">Cargando {entityName.toLowerCase()}...</p>
        </div>
      </div>
    );
  }

  // ── Render ─────────────────────────────────────────────────────────────

  return (
    <div className="space-y-4">

      {/* Contador + botón nuevo */}
      <div className="flex items-center justify-between">
        <CardDescription>
          {totalCount > 0
            ? `${totalCount} ${entityName.toLowerCase()} registrado${totalCount !== 1 ? "s" : ""}`
            : `No hay ${entityName.toLowerCase()} registrados`}
        </CardDescription>
        <Button onClick={() => router.push("/clients/new")}>
          <Plus className="mr-2 h-4 w-4" />
          Nuevo {entitySingular}
        </Button>
      </div>

      <Card>
        <CardContent className="pt-4 space-y-4">

          {/* Tabs de filtro por status */}
          <div className="flex items-center gap-1 border-b pb-0">
            {STATUS_TABS.map((tab) => (
              <button
                key={tab.value}
                type="button"
                onClick={() => handleStatusFilter(tab.value)}
                className={`px-3 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
                  statusFilter === tab.value
                    ? "border-primary text-foreground"
                    : "border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Buscador */}
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={`Buscar ${entityName.toLowerCase()}...`}
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-8"
            />
          </div>

          {/* Tabla / estado vacío */}
          {filteredClients.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">
                {searchTerm || statusFilter !== "all"
                  ? `No se encontraron ${entityName.toLowerCase()}`
                  : `No hay ${entityName.toLowerCase()} registrados`}
              </p>
              {!searchTerm && statusFilter === "all" && (
                <Button
                  onClick={() => router.push("/clients/new")}
                  className="mt-4"
                  variant="outline"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Crear primer {entitySingular.toLowerCase()}
                </Button>
              )}
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{entitySingular}</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Teléfono</TableHead>
                    <TableHead>Correo</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredClients.map((client) => {
                    const badge = client.enrollment_status
                      ? STATUS_BADGE[client.enrollment_status]
                      : null;

                    return (
                      <TableRow
                        key={client.id}
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => router.push(`/clients/${client.id}`)}
                      >
                        {/* Nombre */}
                        <TableCell className="font-medium">
                          <div className="flex flex-col">
                            <span>{client.full_name}</span>
                            {(client.active_enrollment_count ?? 0) > 0 && (
                              <span className="text-xs text-muted-foreground">
                                {client.active_enrollment_count} grupo{client.active_enrollment_count !== 1 ? "s" : ""} activo{client.active_enrollment_count !== 1 ? "s" : ""}
                              </span>
                            )}
                          </div>
                        </TableCell>

                        {/* Status */}
                        <TableCell>
                          {badge ? (
                            <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${badge.className}`}>
                              {badge.label}
                            </span>
                          ) : (
                            <span className="text-muted-foreground text-xs italic">—</span>
                          )}
                        </TableCell>

                        {/* Teléfono */}
                        <TableCell>
                          {(client.primary_contact_phone ?? client.phone) ? (
                            <div className="flex items-center gap-2 text-sm">
                              <Phone className="h-3 w-3 text-muted-foreground" />
                              <span>{client.primary_contact_phone ?? client.phone}</span>
                            </div>
                          ) : (
                            <span className="text-muted-foreground italic text-sm">—</span>
                          )}
                        </TableCell>

                        {/* Correo */}
                        <TableCell>
                          {client.email ? (
                            <div className="flex items-center gap-2 text-sm">
                              <Mail className="h-3 w-3 text-muted-foreground" />
                              <span>{client.email}</span>
                            </div>
                          ) : (
                            <span className="text-muted-foreground italic text-sm">—</span>
                          )}
                        </TableCell>

                        {/* Acciones */}
                        <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => router.push(`/clients/${client.id}`)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => openDeleteDialog(client.id, client.full_name)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Paginación */}
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            hasPrevious={hasPrevious}
            hasNext={hasNext}
            isLoading={isLoading}
            onPageChange={handlePageChange}
            info={`${totalCount} ${entityName.toLowerCase()} · Página ${currentPage} de ${totalPages}`}
          />

        </CardContent>
      </Card>

      {/* Confirmar eliminación */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar {entitySingular.toLowerCase()}?</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Estás seguro de que deseas eliminar a{" "}
              <strong>&quot;{clientToDelete?.name}&quot;</strong>?
              Esta acción no se puede deshacer.
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
