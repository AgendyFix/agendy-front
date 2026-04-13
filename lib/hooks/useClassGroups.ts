// ============================================
// useClassGroups HOOK - Academy Module
// ============================================

import { useState } from "react";
import { classGroupsApi } from "../api/classGroups";
import type { ClassGroup } from "../types/models";
import type {
  CreateClassGroupRequest,
  UpdateClassGroupRequest,
  ClassGroupListParams,
} from "../types/api";

export const useClassGroups = () => {
  const [classGroups, setClassGroups] = useState<ClassGroup[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasNext, setHasNext] = useState(false);
  const [hasPrevious, setHasPrevious] = useState(false);

  const fetchClassGroups = async (
    params?: ClassGroupListParams & { page?: number }
  ) => {
    try {
      setIsLoading(true);
      setError(null);

      const limit = 20;
      const page = params?.page || 1;
      const offset = (page - 1) * limit;
      const { page: _, ...restParams } = params || {};

      const response = await classGroupsApi.getAll({
        ...restParams,
        limit,
        offset,
      });

      setClassGroups(response.results);
      setTotalCount(response.count);
      setHasNext(!!response.next);
      setHasPrevious(!!response.previous);
      setCurrentPage(page);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar grupos");
      setClassGroups([]);
    } finally {
      setIsLoading(false);
    }
  };

  const createClassGroup = async (
    data: CreateClassGroupRequest
  ): Promise<ClassGroup> => {
    try {
      setIsLoading(true);
      setError(null);
      const newGroup = await classGroupsApi.create(data);
      await fetchClassGroups({ page: 1 });
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
      await fetchClassGroups({ page: currentPage });
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
    error,
    totalCount,
    currentPage,
    hasNext,
    hasPrevious,
    fetchClassGroups,
    createClassGroup,
    updateClassGroup,
    deleteClassGroup,
  };
};
