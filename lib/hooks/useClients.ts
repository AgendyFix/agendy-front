// ============================================
// useClients HOOK - Custom hook for clients
// ============================================

import { useState } from "react";
import { clientsApi } from "../api/clients";
import type { Client } from "../types/models";
import type { CreateClientRequest, UpdateClientRequest } from "../types/api";

export const useClients = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasNext, setHasNext] = useState(false);
  const [hasPrevious, setHasPrevious] = useState(false);

  const fetchClients = async (params?: { search?: string; page?: number }) => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Convertir page a offset/limit para Django REST Framework
      const limit = 10;
      const page = params?.page || 1;
      const offset = (page - 1) * limit;
      
      const { page: _, ...restParams } = params || {};
      
      const apiParams = {
        ...restParams,
        limit,
        offset,
      };
      
      const response = await clientsApi.getAll(apiParams);
      setClients(response.results);
      setTotalCount(response.count);
      setHasNext(!!response.next);
      setHasPrevious(!!response.previous);
      setCurrentPage(page);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar clientes");
      setClients([]);
    } finally {
      setIsLoading(false);
    }
  };

  const createClient = async (data: CreateClientRequest): Promise<Client> => {
    try {
      setIsLoading(true);
      setError(null);
      const newClient = await clientsApi.create(data);
      // Refetch para actualizar count y paginación
      await fetchClients({ page: 1 });
      return newClient;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al crear cliente");
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const updateClient = async (id: string, data: UpdateClientRequest): Promise<Client> => {
    try {
      setIsLoading(true);
      setError(null);
      const updated = await clientsApi.update(id, data);
      // Actualizar en la lista local
      setClients((prev) => prev.map((c) => (c.id === id ? updated : c)));
      return updated;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al actualizar cliente");
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const deleteClient = async (id: string): Promise<void> => {
    try {
      setIsLoading(true);
      setError(null);
      await clientsApi.delete(id);
      
      // Refetch la página actual para actualizar count correcto
      await fetchClients({ page: currentPage });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al eliminar cliente");
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    clients,
    isLoading,
    error,
    totalCount,
    currentPage,
    hasNext,
    hasPrevious,
    fetchClients,
    createClient,
    updateClient,
    deleteClient,
  };
};