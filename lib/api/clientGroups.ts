// ============================================
// CLIENT GROUPS API - AgendyFix
// ============================================

import apiClient from "./client";
import type { ClientGroup } from "@/lib/types/models";
import type {
  PaginatedResponse,
  CreateClientGroupRequest,
  UpdateClientGroupRequest,
  UpdateClientGroupMembersRequest,
  ClientGroupListParams,
} from "@/lib/types/api";

/**
 * Get paginated list of client groups
 */
export const getClientGroups = async (
  params: ClientGroupListParams = {}
): Promise<PaginatedResponse<ClientGroup>> => {
  const response = await apiClient.get<PaginatedResponse<ClientGroup>>(
    "/client-groups/",
    { params }
  );
  return response.data;
};

/**
 * Get client group by ID
 */
export const getClientGroupById = async (
  id: string
): Promise<ClientGroup> => {
  const response = await apiClient.get<ClientGroup>(
    `/client-groups/${id}/`
  );
  return response.data;
};

/**
 * Create new client group
 */
export const createClientGroup = async (
  data: CreateClientGroupRequest
): Promise<ClientGroup> => {
  const response = await apiClient.post<ClientGroup>(
    "/client-groups/",
    data
  );
  return response.data;
};

/**
 * Update client group
 */
export const updateClientGroup = async (
  id: string,
  data: UpdateClientGroupRequest
): Promise<ClientGroup> => {
  const response = await apiClient.patch<ClientGroup>(
    `/client-groups/${id}/`,
    data
  );
  return response.data;
};

/**
 * Add or remove members from client group
 */
export const updateClientGroupMembers = async (
  id: string,
  data: UpdateClientGroupMembersRequest
): Promise<{
  detail: string;
  group: ClientGroup;
  added: string[];
  removed: string[];
  skipped: string[];
}> => {
  const response = await apiClient.patch(
    `/client-groups/${id}/members/`,
    data
  );
  return response.data;
};

/**
 * Delete client group (soft delete)
 */
export const deleteClientGroup = async (id: string): Promise<void> => {
  await apiClient.delete(`/client-groups/${id}/`);
};

export const clientGroupsApi = {
  getAll: getClientGroups,
  getById: getClientGroupById,
  create: createClientGroup,
  update: updateClientGroup,
  updateMembers: updateClientGroupMembers,
  delete: deleteClientGroup,
};