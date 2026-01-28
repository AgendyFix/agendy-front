// ============================================
// TEMPLATES API - AgendyFix
// ============================================

import apiClient from "./client";
import type { WhatsAppTemplate, TemplateCategoryOption } from "@/lib/types/models";
import type {
  PaginatedResponse,
  TemplateListParams,
  TemplatePreviewRequest,
  TemplatePreviewResponse,
} from "@/lib/types/api";

/**
 * Get paginated list of available templates
 */
export const getTemplates = async (
  params: TemplateListParams = {}
): Promise<PaginatedResponse<WhatsAppTemplate>> => {
  const response = await apiClient.get<PaginatedResponse<WhatsAppTemplate>>(
    "/templates/",
    { params }
  );
  return response.data;
};

/**
 * Get template by ID
 */
export const getTemplateById = async (
  id: string
): Promise<WhatsAppTemplate> => {
  const response = await apiClient.get<WhatsAppTemplate>(
    `/templates/${id}/`
  );
  return response.data;
};

/**
 * Preview template with variables
 */
export const previewTemplate = async (
  id: string,
  data: TemplatePreviewRequest
): Promise<TemplatePreviewResponse> => {
  const response = await apiClient.post<TemplatePreviewResponse>(
    `/templates/${id}/preview/`,
    data
  );
  return response.data;
};

/**
 * Get template categories
 */
export const getTemplateCategories = async (): Promise<TemplateCategoryOption[]> => {
  const response = await apiClient.get<TemplateCategoryOption[]>(
    "/templates/categories/"
  );
  return response.data;
};

export const templatesApi = {
  getAll: getTemplates,
  getById: getTemplateById,
  preview: previewTemplate,
  getCategories: getTemplateCategories,
};