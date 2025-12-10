import { useState, useEffect, useCallback } from 'react';
import { actionListarTemplates, actionUsarTemplate, actionCriarTemplate, actionDeletarTemplate } from '../actions/templates-actions';
import type { TemplateComUsuario, ListarTemplatesParams, CriarTemplateParams } from '../types';

export function useTemplates(initialParams?: ListarTemplatesParams) {
  const [templates, setTemplates] = useState<TemplateComUsuario[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [params, setParams] = useState<ListarTemplatesParams>(initialParams || {});

  const fetchTemplates = useCallback(async () => {
    setLoading(true);
    setError(null);
    const result = await actionListarTemplates(params);
    if (result.success) {
      setTemplates(result.data || []);
      setTotal(result.total || 0);
    } else {
      setError(result.error);
    }
    setLoading(false);
  }, [params]);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  const updateParams = useCallback((newParams: Partial<ListarTemplatesParams>) => {
    setParams((prevParams) => ({ ...prevParams, ...newParams }));
  }, []);

  const createTemplate = useCallback(async (templateParams: CriarTemplateParams) => {
    setError(null);
    const formData = new FormData();
    formData.append('titulo', templateParams.titulo);
    if (templateParams.descricao) formData.append('descricao', templateParams.descricao);
    formData.append('conteudo', JSON.stringify(templateParams.conteudo));
    formData.append('visibilidade', templateParams.visibilidade);
    if (templateParams.categoria) formData.append('categoria', templateParams.categoria);
    if (templateParams.thumbnail_url) formData.append('thumbnail_url', templateParams.thumbnail_url);

    const result = await actionCriarTemplate(formData);
    if (result.success) {
      fetchTemplates();
      return result.data;
    } else {
      setError(result.error);
      throw new Error(result.error);
    }
  }, [fetchTemplates]);

  const useTemplate = useCallback(async (templateId: number, options?: { titulo?: string; pasta_id?: number | null }) => {
    setError(null);
    const result = await actionUsarTemplate(templateId, options);
    if (result.success) {
      // Revalidate documents list or redirect to new document
      return result.data;
    } else {
      setError(result.error);
      throw new Error(result.error);
    }
  }, []);

  const deleteTemplate = useCallback(async (id: number) => {
    setError(null);
    const result = await actionDeletarTemplate(id);
    if (result.success) {
      fetchTemplates();
    } else {
      setError(result.error);
      throw new Error(result.error);
    }
  }, [fetchTemplates]);

  return {
    templates,
    total,
    loading,
    error,
    params,
    updateParams,
    fetchTemplates,
    createTemplate,
    useTemplate,
    deleteTemplate,
  };
}
