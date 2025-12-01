// ============================================
// useServices HOOK - Custom hook for services
// ============================================

import { useState } from "react";
import { servicesApi } from "../api/services";
import type { Service } from "../types/models";
import type { CreateServiceRequest, UpdateServiceRequest, ServiceListParams } from "../types/api";

export const useServices = () => {
  const [services, setServices] = useState<Service[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasNext, setHasNext] = useState(false);
  const [hasPrevious, setHasPrevious] = useState(false);

  const fetchServices = async (params?: ServiceListParams & { page?: number }) => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Convertir page a offset/limit para Django REST Framework
      const limit = 10;
      const page = params?.page || 1;
      const offset = (page - 1) * limit;
      
      const apiParams = {
        ...params,
        limit,
        offset,
      };
      
      // Remover page ya que no es soportado por el backend
      delete apiParams.page;
      
      const response = await servicesApi.getAll(apiParams);
      setServices(response.results);
      setTotalCount(response.count);
      setHasNext(!!response.next);
      setHasPrevious(!!response.previous);
      setCurrentPage(page);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar servicios");
      setServices([]);
    } finally {
      setIsLoading(false);
    }
  };

  const createService = async (data: CreateServiceRequest): Promise<Service> => {
    try {
      setIsLoading(true);
      setError(null);
      const newService = await servicesApi.create(data);
      // Refetch para actualizar count y paginación
      await fetchServices({ page: 1 });
      return newService;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al crear servicio");
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const updateService = async (id: string, data: UpdateServiceRequest): Promise<Service> => {
    try {
      setIsLoading(true);
      setError(null);
      const updated = await servicesApi.update(id, data);
      // Actualizar en la lista local
      setServices((prev) => prev.map((s) => (s.id === id ? updated : s)));
      return updated;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al actualizar servicio");
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const deleteService = async (id: string): Promise<void> => {
    try {
      setIsLoading(true);
      setError(null);
      await servicesApi.delete(id);
      
      // Refetch la página actual para actualizar count correcto
      const currentPageToFetch = currentPage;
      await fetchServices({ page: currentPageToFetch });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al eliminar servicio");
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    services,
    isLoading,
    error,
    totalCount,
    currentPage,
    hasNext,
    hasPrevious,
    fetchServices,
    createService,
    updateService,
    deleteService,
  };
};