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
import { useClients } from "@/lib/hooks/useClients";

interface ClientsListProps {
  /** Nombre dinámico de la entidad, ej: "Alumnos", "Clientes" */
  entityName?: string;
}

export function ClientsList({ entityName = "Clientes" }: ClientsListProps) {
  const router = useRouter();
  const {
    clients,
    isLoading,
    totalCount,
    currentPage,
    hasNext,
    hasPrevious,
    fetchClients,
    deleteClient,
  } = useClients();

  const [searchTerm, setSearchTerm] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [clientToDelete, setClientToDelete] = useState<{ id: string; name: string } | null>(null);
  const hasFetched = useRef(false);

  // Singular/plural dinámico
  const entitySingular = entityName.endsWith("s")
    ? entityName.slice(0, -1)
    : entityName;

  useEffect(() => {
    if (!hasFetched.current) {
      fetchClients({ page: 1 });
      hasFetched.current = true;
    }
  }, []);

  const handlePageChange = (page: number) => {
    fetchClients({ page, search: searchTerm || undefined });
  };

  // Debounce para no disparar fetch en cada keystroke
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleSearch = useCallback((value: string) => {
    setSearchTerm(value);
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    searchDebounceRef.current = setTimeout(() => {
      fetchClients({ page: 1, search: value || undefined });
    }, 350);
  }, [fetchClients]);

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

  return (
    <div className="space-y-6">

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
        <CardContent className="pt-6">

          {/* Buscador */}
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={`Buscar ${entityName.toLowerCase()}...`}
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>

          {filteredClients.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">
                {searchTerm
                  ? `No se encontraron ${entityName.toLowerCase()}`
                  : `No hay ${entityName.toLowerCase()} registrados`}
              </p>
              {!searchTerm && (
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
                    <TableHead>Teléfono</TableHead>
                    <TableHead>Correo</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredClients.map((client) => (
                    <TableRow
                      key={client.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => router.push(`/clients/${client.id}`)}
                    >

                      {/* Nombre */}
                      <TableCell className="font-medium">
                        {client.full_name}
                      </TableCell>

                      {/* Teléfono */}
                      <TableCell>
                        {client.phone ? (
                          <div className="flex items-center gap-2 text-sm">
                            <Phone className="h-3 w-3 text-muted-foreground" />
                            <span>{client.phone}</span>
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
                          <span className="text-muted-foreground italic text-sm">Sin correo</span>
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
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Paginación */}
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
