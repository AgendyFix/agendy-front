// ============================================
// useClassGroups HOOK - Academy Module
// ============================================

import { useState, useCallback } from "react";
import { classGroupsApi } from "../api/classGroups";
import type { ClassGroup } from "../types/models";
import type {
  CreateClassGroupRequest,
  UpdateClassGroupRequest,
  ClassGroupListParams,
} from "../types/api";

const PAGE_SIZE = 20;

export const useClassGroups = () => {
  const [classGroups, setClassGroups] = useState<ClassGroup[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasNext, setHasNext] = useState(false);
  const [hasPrevious, setHasPrevious] = useState(false);

  // Guarda los últimos params para reutilizarlos en loadMore / refresh
  const [lastParams, setLastParams] = useState<ClassGroupListParams>({});

  /**
   * Carga la primera página (reemplaza la lista).
   * Llamar al montar o cuando cambian filtros/búsqueda.
   */
  const fetchClassGroups = useCallback(async (
    params?: ClassGroupListParams & { page?: number }
  ) => {
    try {
      setIsLoading(true);
      setError(null);

      const { page: _, ...restParams } = params || {};
      setLastParams(restParams);

      const response = await classGroupsApi.getAll({
        ...restParams,
        limit: PAGE_SIZE,
        offset: 0,
      });

      setClassGroups(response.results);
      setTotalCount(response.count);
      setHasNext(!!response.next);
      setHasPrevious(false);
      setCurrentPage(1);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar grupos");
      setClassGroups([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Carga la siguiente página y la añade al final de la lista (scroll infinito).
   */
  const loadMore = useCallback(async () => {
    if (isLoadingMore || !hasNext) return;
    try {
      setIsLoadingMore(true);
      const nextPage = currentPage + 1;
      const response = await classGroupsApi.getAll({
        ...lastParams,
        limit: PAGE_SIZE,
        offset: (nextPage - 1) * PAGE_SIZE,
      });

      setClassGroups((prev) => [...prev, ...response.results]);
      setTotalCount(response.count);
      setHasNext(!!response.next);
      setHasPrevious(!!response.previous);
      setCurrentPage(nextPage);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar más grupos");
    } finally {
      setIsLoadingMore(false);
    }
  }, [isLoadingMore, hasNext, currentPage, lastParams]);

  const createClassGroup = async (
    data: CreateClassGroupRequest
  ): Promise<ClassGroup> => {
    try {
      setIsLoading(true);
      setError(null);
      const newGroup = await classGroupsApi.create(data);
      // Refrescar desde la primera página para mantener el orden correcto
      await fetchClassGroups(lastParams);
      return newGroup;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al crear grupo");
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const updateClassGroup = async (
    id: string,
    data: UpdateClassGroupRequest
  ): Promise<ClassGroup> => {
    try {
      setIsLoading(true);
      setError(null);
      const updated = await classGroupsApi.update(id, data);
      setClassGroups((prev) => prev.map((g) => (g.id === id ? updated : g)));
      return updated;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al actualizar grupo");
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const deleteClassGroup = async (id: string): Promise<void> => {
    try {
      setIsLoading(true);
      setError(null);
      await classGroupsApi.delete(id);
      // Refrescar para mantener el conteo correcto
      await fetchClassGroups(lastParams);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al eliminar grupo");
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    classGroups,
    isLoading,
    isLoadingMore,
    error,
    totalCount,
    currentPage,
    hasNext,
    hasPrevious,
    fetchClassGroups,
    loadMore,
    createClassGroup,
    updateClassGroup,
    deleteClassGroup,
  };
};
