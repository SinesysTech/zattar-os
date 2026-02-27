"use client";

import { useState, useEffect, useCallback } from "react";
import type { Tarefa, ListarTarefasParams } from "../lib/domain";
import {
  actionListarTarefasPorProjeto,
  actionListarTarefasGlobal,
} from "../lib/actions";

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

/**
 * Hook para buscar tarefas de um projeto específico.
 * Retorna lista simples (sem paginação), ideal para Kanban e listas de projeto.
 */
export function useTasksByProject(projetoId: string, status?: string) {
  const [tarefas, setTarefas] = useState<Tarefa[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTarefas = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    const result = await actionListarTarefasPorProjeto(projetoId, status);

    if (result.success) {
      setTarefas(result.data);
    } else {
      setError(result.error.message);
      setTarefas([]);
    }

    setIsLoading(false);
  }, [projetoId, status]);

  useEffect(() => {
    fetchTarefas();
  }, [fetchTarefas]);

  return {
    tarefas,
    isLoading,
    error,
    refetch: fetchTarefas,
  };
}

/**
 * Hook para buscar tarefas globais (cross-projeto) com paginação e filtros.
 */
export function useTasksGlobal(params: ListarTarefasParams = {}) {
  const [tarefas, setTarefas] = useState<Tarefa[]>([]);
  const [pagination, setPagination] =
    useState<Pagination>(DEFAULT_PAGINATION);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const serializedParams = JSON.stringify(params);

  const fetchTarefas = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    const currentParams: ListarTarefasParams = JSON.parse(serializedParams);
    const result = await actionListarTarefasGlobal(currentParams);

    if (result.success) {
      setTarefas(result.data.data);
      setPagination(result.data.pagination);
    } else {
      setError(result.error.message);
      setTarefas([]);
    }

    setIsLoading(false);
  }, [serializedParams]);

  useEffect(() => {
    fetchTarefas();
  }, [fetchTarefas]);

  return {
    tarefas,
    pagination,
    isLoading,
    error,
    refetch: fetchTarefas,
  };
}
