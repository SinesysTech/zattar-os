"use client";

import { useState, useEffect, useCallback } from "react";
import type { Projeto, ListarProjetosParams } from "../lib/domain";
import { actionListarProjetos } from "../lib/actions";

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasMore: boolean;
}

const DEFAULT_PAGINATION: Pagination = {
  page: 1,
  limit: 20,
  total: 0,
  totalPages: 0,
  hasMore: false,
};

export function useProjects(params: ListarProjetosParams = {}) {
  const [projetos, setProjetos] = useState<Projeto[]>([]);
  const [pagination, setPagination] =
    useState<Pagination>(DEFAULT_PAGINATION);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const serializedParams = JSON.stringify(params);

  const fetchProjetos = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    const currentParams: ListarProjetosParams = JSON.parse(serializedParams);
    const result = await actionListarProjetos(currentParams);

    if (result.success) {
      setProjetos(result.data.data);
      setPagination(result.data.pagination);
    } else {
      setError(result.error.message);
      setProjetos([]);
    }

    setIsLoading(false);
  }, [serializedParams]);

  useEffect(() => {
    fetchProjetos();
  }, [fetchProjetos]);

  return {
    projetos,
    pagination,
    isLoading,
    error,
    refetch: fetchProjetos,
  };
}
