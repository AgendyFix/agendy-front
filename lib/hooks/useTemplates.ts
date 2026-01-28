// ============================================
// USE TEMPLATES HOOKS - AgendyFix
// ============================================

import { useState, useCallback } from "react";
import { templatesApi } from "@/lib/api/templates";
import type { WhatsAppTemplate, TemplateCategoryOption } from "@/lib/types/models";
import type {
  TemplateListParams,
  TemplatePreviewRequest,
  TemplatePreviewResponse,
} from "@/lib/types/api";

/**
 * Hook for managing templates list
 */
export const useTemplates = () => {
  const [templates, setTemplates] = useState<WhatsAppTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasNext, setHasNext] = useState(false);
  const [hasPrevious, setHasPrevious] = useState(false);

  const fetchTemplates = useCallback(async (params: TemplateListParams & { page?: number } = {}) => {
    try {
      setIsLoading(true);
      const { page = 1, ...restParams } = params;
      
      const offset = (page - 1) * 10;
      const response = await templatesApi.getAll({
        ...restParams,
        limit: 10,
        offset,
      });

      setTemplates(response.results);
      setTotalCount(response.count);
      setCurrentPage(page);
      setHasNext(!!response.next);
      setHasPrevious(!!response.previous);
    } catch (error) {
      console.error("[Templates] Failed to fetch:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    templates,
    isLoading,
    totalCount,
    currentPage,
    hasNext,
    hasPrevious,
    fetchTemplates,
  };
};

/**
 * Hook for single template details
 */
export const useTemplate = (id: string) => {
  const [template, setTemplate] = useState<WhatsAppTemplate | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchTemplate = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await templatesApi.getById(id);
      setTemplate(data);
    } catch (error) {
      console.error("[Template] Failed to fetch:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  return {
    template,
    isLoading,
    fetchTemplate,
  };
};

/**
 * Hook for template preview
 */
export const useTemplatePreview = () => {
  const [preview, setPreview] = useState<TemplatePreviewResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const generatePreview = useCallback(async (
    templateId: string,
    variables: TemplatePreviewRequest
  ) => {
    try {
      setIsLoading(true);
      const data = await templatesApi.preview(templateId, variables);
      setPreview(data);
      return data;
    } catch (error) {
      console.error("[TemplatePreview] Failed to generate:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clearPreview = useCallback(() => {
    setPreview(null);
  }, []);

  return {
    preview,
    isLoading,
    generatePreview,
    clearPreview,
  };
};

/**
 * Hook for template categories
 */
export const useTemplateCategories = () => {
  const [categories, setCategories] = useState<TemplateCategoryOption[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchCategories = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await templatesApi.getCategories();
      setCategories(data);
    } catch (error) {
      console.error("[TemplateCategories] Failed to fetch:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    categories,
    isLoading,
    fetchCategories,
  };
};