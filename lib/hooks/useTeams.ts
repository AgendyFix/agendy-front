// ============================================
// useTeams HOOK - Custom hook for teams
// ============================================

import { useState } from "react";
import { teamsApi } from "../api/teams";
import type { Team } from "../types/models";
import type { CreateTeamRequest, UpdateTeamRequest } from "../types/api";

export const useTeams = () => {
  const [teams, setTeams] = useState<Team[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasNext, setHasNext] = useState(false);
  const [hasPrevious, setHasPrevious] = useState(false);

  const fetchTeams = async (params?: { search?: string; page?: number }) => {
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
      
      const response = await teamsApi.getAll(apiParams);
      setTeams(response.results);
      setTotalCount(response.count);
      setHasNext(!!response.next);
      setHasPrevious(!!response.previous);
      setCurrentPage(page);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar equipos");
      setTeams([]);
    } finally {
      setIsLoading(false);
    }
  };

  const createTeam = async (data: CreateTeamRequest): Promise<Team> => {
    try {
      setIsLoading(true);
      setError(null);
      const newTeam = await teamsApi.create(data);
      // Refetch para actualizar count y paginación
      await fetchTeams({ page: 1 });
      return newTeam;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al crear equipo");
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const updateTeam = async (id: string, data: UpdateTeamRequest): Promise<Team> => {
    try {
      setIsLoading(true);
      setError(null);
      const updated = await teamsApi.update(id, data);
      // Actualizar en la lista local
      setTeams((prev) => prev.map((t) => (t.id === id ? updated : t)));
      return updated;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al actualizar equipo");
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const deleteTeam = async (id: string): Promise<void> => {
    try {
      setIsLoading(true);
      setError(null);
      await teamsApi.delete(id);
      
      // Refetch la página actual para actualizar count correcto
      await fetchTeams({ page: currentPage });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al eliminar equipo");
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    teams,
    isLoading,
    error,
    totalCount,
    currentPage,
    hasNext,
    hasPrevious,
    fetchTeams,
    createTeam,
    updateTeam,
    deleteTeam,
  };
};