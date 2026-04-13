// ============================================
// useEnrollments HOOK - Academy Module
// ============================================

import { useState, useCallback } from "react";
import { enrollmentsApi } from "../api/enrollments";
import type { Enrollment } from "../types/models";
import type {
  CreateEnrollmentRequest,
  UpdateEnrollmentRequest,
  EnrollmentListParams,
} from "../types/api";

export const useEnrollments = () => {
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasNext, setHasNext] = useState(false);
  const [hasPrevious, setHasPrevious] = useState(false);

  const fetchEnrollments = useCallback(
    async (params?: EnrollmentListParams & { page?: number }) => {
      try {
        setIsLoading(true);
        setError(null);

        const limit = 20;
        const page = params?.page || 1;
        const offset = (page - 1) * limit;
        const { page: _, ...restParams } = params || {};

        const response = await enrollmentsApi.getAll({
          ...restParams,
          limit,
          offset,
        });

        setEnrollments(response.results);
        setTotalCount(response.count);
        setHasNext(!!response.next);
        setHasPrevious(!!response.previous);
        setCurrentPage(page);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error al cargar inscripciones");
        setEnrollments([]);
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const createEnrollment = async (
    data: CreateEnrollmentRequest
  ): Promise<Enrollment> => {
    try {
      setIsLoading(true);
      setError(null);
      const created = await enrollmentsApi.create(data);
      return created;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al crear inscripción");
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const updateEnrollment = async (
    id: string,
    data: UpdateEnrollmentRequest
  ): Promise<Enrollment> => {
    try {
      setIsLoading(true);
      setError(null);
      const updated = await enrollmentsApi.update(id, data);
      setEnrollments((prev) => prev.map((e) => (e.id === id ? updated : e)));
      return updated;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al actualizar inscripción");
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const deleteEnrollment = async (id: string): Promise<void> => {
    try {
      setIsLoading(true);
      setError(null);
      await enrollmentsApi.delete(id);
      await fetchEnrollments({ page: currentPage });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al eliminar inscripción");
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    enrollments,
    isLoading,
    error,
    totalCount,
    currentPage,
    hasNext,
    hasPrevious,
    fetchEnrollments,
    createEnrollment,
    updateEnrollment,
    deleteEnrollment,
  };
};
