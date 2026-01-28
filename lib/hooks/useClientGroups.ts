// ============================================
// USE CLIENT GROUPS HOOK - AgendyFix
// ============================================

import { useState, useCallback } from "react";
import { clientGroupsApi } from "@/lib/api/clientGroups";
import type { ClientGroup } from "@/lib/types/models";
import type {
  CreateClientGroupRequest,
  UpdateClientGroupRequest,
  UpdateClientGroupMembersRequest,
  ClientGroupListParams,
} from "@/lib/types/api";

export const useClientGroups = () => {
  const [groups, setGroups] = useState<ClientGroup[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasNext, setHasNext] = useState(false);
  const [hasPrevious, setHasPrevious] = useState(false);

  const fetchGroups = useCallback(async (params: ClientGroupListParams & { page?: number } = {}) => {
    try {
      setIsLoading(true);
      const { page = 1, ...restParams } = params;
      
      const offset = (page - 1) * 10;
      const response = await clientGroupsApi.getAll({
        ...restParams,
        limit: 10,
        offset,
      });

      setGroups(response.results);
      setTotalCount(response.count);
      setCurrentPage(page);
      setHasNext(!!response.next);
      setHasPrevious(!!response.previous);
    } catch (error) {
      console.error("[ClientGroups] Failed to fetch:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createGroup = useCallback(async (data: CreateClientGroupRequest) => {
    try {
      setIsLoading(true);
      const newGroup = await clientGroupsApi.create(data);
      // Refresh list after creation
      await fetchGroups({ page: 1 });
      return newGroup;
    } catch (error) {
      console.error("[ClientGroups] Failed to create:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [fetchGroups]);

  const updateGroup = useCallback(async (id: string, data: UpdateClientGroupRequest) => {
    try {
      setIsLoading(true);
      const updated = await clientGroupsApi.update(id, data);
      // Update in local state
      setGroups(prev => prev.map(g => g.id === id ? updated : g));
      return updated;
    } catch (error) {
      console.error("[ClientGroups] Failed to update:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updateMembers = useCallback(async (
    id: string,
    data: UpdateClientGroupMembersRequest
  ) => {
    try {
      setIsLoading(true);
      const result = await clientGroupsApi.updateMembers(id, data);
      // Update in local state
      setGroups(prev => prev.map(g => g.id === id ? result.group : g));
      return result;
    } catch (error) {
      console.error("[ClientGroups] Failed to update members:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const deleteGroup = useCallback(async (id: string) => {
    try {
      setIsLoading(true);
      await clientGroupsApi.delete(id);
      // Remove from local state
      setGroups(prev => prev.filter(g => g.id !== id));
      setTotalCount(prev => prev - 1);
    } catch (error) {
      console.error("[ClientGroups] Failed to delete:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    groups,
    isLoading,
    totalCount,
    currentPage,
    hasNext,
    hasPrevious,
    fetchGroups,
    createGroup,
    updateGroup,
    updateMembers,
    deleteGroup,
  };
};

export const useClientGroup = (id: string) => {
  const [group, setGroup] = useState<ClientGroup | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchGroup = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await clientGroupsApi.getById(id);
      setGroup(data);
    } catch (error) {
      console.error("[ClientGroup] Failed to fetch:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  const updateGroup = useCallback(async (data: UpdateClientGroupRequest) => {
    try {
      setIsLoading(true);
      const updated = await clientGroupsApi.update(id, data);
      setGroup(updated);
      return updated;
    } catch (error) {
      console.error("[ClientGroup] Failed to update:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  const updateMembers = useCallback(async (data: UpdateClientGroupMembersRequest) => {
    try {
      setIsLoading(true);
      const result = await clientGroupsApi.updateMembers(id, data);
      setGroup(result.group);
      return result;
    } catch (error) {
      console.error("[ClientGroup] Failed to update members:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  return {
    group,
    isLoading,
    fetchGroup,
    updateGroup,
    updateMembers,
  };
};