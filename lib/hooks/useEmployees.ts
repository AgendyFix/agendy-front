// ============================================
// useEmployees HOOK
// ============================================

import { useState } from "react";
import { employeesApi } from "../api/employees";
import type { Employee } from "../types/models";

export const useEmployees = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasNext, setHasNext] = useState(false);
  const [hasPrevious, setHasPrevious] = useState(false);

  const fetchEmployees = async (params?: { search?: string; page?: number }) => {
    try {
      setIsLoading(true);
      setError(null);
      const limit = 10;
      const page = params?.page || 1;
      const offset = (page - 1) * limit;
      const { page: _, ...restParams } = params || {};
      const response = await employeesApi.getAll({ ...restParams, limit, offset });
      setEmployees(response.results);
      setTotalCount(response.count);
      setHasNext(!!response.next);
      setHasPrevious(!!response.previous);
      setCurrentPage(page);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar instructores");
      setEmployees([]);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    employees,
    isLoading,
    error,
    totalCount,
    currentPage,
    hasNext,
    hasPrevious,
    fetchEmployees,
  };
};
