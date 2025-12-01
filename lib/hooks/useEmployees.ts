// ============================================
// useEmployees HOOK - Custom hook for employees
// ============================================

import { useState } from "react";
import { employeesApi } from "../api/employees";
import type { Employee } from "../types/models";
import type { UpdateEmployeeRequest } from "../types/api";

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
      
      const response = await employeesApi.getAll(apiParams);
      setEmployees(response.results);
      setTotalCount(response.count);
      setHasNext(!!response.next);
      setHasPrevious(!!response.previous);
      setCurrentPage(page);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar empleados");
      setEmployees([]);
    } finally {
      setIsLoading(false);
    }
  };

  const updateEmployeeTeams = async (id: string, teams: string[]): Promise<Employee> => {
    try {
      setIsLoading(true);
      setError(null);
      const updated = await employeesApi.updateTeams(id, { teams });
      // Actualizar en la lista local
      setEmployees((prev) => prev.map((e) => (e.id === id ? updated : e)));
      return updated;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al actualizar empleado");
      throw err;
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
    updateEmployeeTeams,
  };
};