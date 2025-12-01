"use client";

// ============================================
// SERVICES PAGE - Lista de servicios
// ============================================

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Trash2, Search } from "lucide-react";
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
import { useServices } from "@/lib/hooks/useServices";
import { ServiceCard } from "@/components/services/ServiceCard";

export default function ServicesPage() {
  const router = useRouter();
  const {
    services,
    isLoading,
    totalCount,
    currentPage,
    hasNext,
    hasPrevious,
    fetchServices,
    deleteService
  } = useServices();
  const [searchTerm, setSearchTerm] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [serviceToDelete, setServiceToDelete] = useState<{ id: string; name: string } | null>(null);
  const hasFetched = useRef(false);

  useEffect(() => {
    if (!hasFetched.current) {
      fetchServices({ page: 1 });
      hasFetched.current = true;
    }
  }, []);

  const handlePageChange = (page: number) => {
    fetchServices({
      page,
      search: searchTerm || undefined
    });
  };

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    // Reset to page 1 when searching
    fetchServices({
      page: 1,
      search: value || undefined
    });
  };

  const openDeleteDialog = (id: string, name: string) => {
    setServiceToDelete({ id, name });
    setDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!serviceToDelete) return;

    try {
      await deleteService(serviceToDelete.id);
      toast.success("Servicio eliminado exitosamente");
      setDeleteDialogOpen(false);
      setServiceToDelete(null);
    } catch (error) {
      toast.error("Error al eliminar el servicio");
    }
  };

  // Services are already filtered by backend search
  const filteredServices = Array.isArray(services) ? services : [];
  
  // Calculate pagination info
  const startItem = totalCount === 0 ? 0 : (currentPage - 1) * 10 + 1;
  const endItem = Math.min(currentPage * 10, totalCount);
  const totalPages = Math.ceil(totalCount / 10);

  if (isLoading && services.length === 0) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4"></div>
          <p className="text-muted-foreground">Cargando servicios...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Servicios</h1>
          <p className="text-muted-foreground">
            Gestiona los servicios de tu empresa
          </p>
        </div>
        <Button onClick={() => router.push("/services/new")}>
          <Plus className="mr-2 h-4 w-4" />
          Nuevo Servicio
        </Button>
      </div>

      <Card className="shadow-card">
        <CardHeader>
          <CardTitle>Lista de Servicios</CardTitle>
          <CardDescription>
            {totalCount > 0
              ? `Mostrando ${startItem}-${endItem} de ${totalCount} servicio${totalCount !== 1 ? "s" : ""}`
              : "No hay servicios registrados"
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar servicios..."
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>

          {filteredServices.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">
                {searchTerm
                  ? "No se encontraron servicios con ese nombre"
                  : "No hay servicios registrados"}
              </p>
              {!searchTerm && (
                <Button
                  onClick={() => router.push("/services/new")}
                  className="mt-4"
                  variant="outline"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Crear primer servicio
                </Button>
              )}
            </div>
          ) : (
            <>
              {/* Vista Desktop - Tabla */}
              <div className="hidden md:block rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Precio</TableHead>
                    <TableHead>Duración</TableHead>
                    <TableHead>Reservas Online</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredServices.map((service) => (
                    <TableRow key={service.id}>
                      <TableCell className="font-medium">
                        <div>
                          <p>{service.name}</p>
                          {service.description && (
                            <p className="text-sm text-muted-foreground">
                              {service.description}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {service.price ? (
                          `$${service.price}`
                        ) : (
                          <span className="text-muted-foreground italic text-sm">
                            Por Asignar
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        {service.duration_minutes ? (
                          `${service.duration_minutes} min`
                        ) : (
                          <span className="text-muted-foreground italic text-sm">
                            Variable
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                            service.is_bookable_online
                              ? "bg-blue-50 text-blue-700"
                              : "bg-gray-50 text-gray-700"
                          }`}
                        >
                          {service.is_bookable_online ? "Sí" : "No"}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => router.push(`/services/${service.id}`)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openDeleteDialog(service.id, service.name)}
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

              {/* Vista Móvil - Cards */}
              <div className="md:hidden space-y-3">
                {filteredServices.map((service) => (
                  <ServiceCard
                    key={service.id}
                    service={service}
                    onDelete={openDeleteDialog}
                  />
                ))}
              </div>
            </>
          )}

          {/* Pagination Controls - solo mostrar si hay más de una página */}
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
            <AlertDialogTitle>¿Eliminar servicio?</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Estás seguro de que deseas eliminar el servicio <strong>&quot;{serviceToDelete?.name}&quot;</strong>?
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