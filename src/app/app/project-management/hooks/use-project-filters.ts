"use client";

import { useState, useCallback, useMemo } from "react";
import type {
  StatusProjeto,
  Prioridade,
  ProjetoSortBy,
} from "../lib/domain";

export interface ProjectFilters {
  busca?: string;
  status?: StatusProjeto;
  prioridade?: Prioridade;
  responsavelId?: number;
  clienteId?: number;
  dataInicioDe?: string;
  dataInicioAte?: string;
  ordenarPor?: ProjetoSortBy;
  ordem?: "asc" | "desc";
  pagina?: number;
  limite?: number;
}

export function useProjectFilters(initial: ProjectFilters = {}) {
  const [filters, setFilters] = useState<ProjectFilters>(initial);

  const updateFilter = useCallback(
    <K extends keyof ProjectFilters>(
      key: K,
      value: ProjectFilters[K] | undefined
    ) => {
      setFilters((prev) => {
        if (value === undefined || value === "") {
          const next = { ...prev };
          delete next[key];
          // Voltar para página 1 quando filtro muda
          if (key !== "pagina") next.pagina = 1;
          return next;
        }
        return {
          ...prev,
          [key]: value,
          // Voltar para página 1 quando filtro muda (exceto paginação)
          ...(key !== "pagina" ? { pagina: 1 } : {}),
        };
      });
    },
    []
  );

  const resetFilters = useCallback(() => {
    setFilters(initial);
  }, [initial]);

  const clearFilter = useCallback((key: keyof ProjectFilters) => {
    setFilters((prev) => {
      const next = { ...prev };
      delete next[key];
      if (key !== "pagina") next.pagina = 1;
      return next;
    });
  }, []);

  const setPage = useCallback((page: number) => {
    setFilters((prev) => ({ ...prev, pagina: page }));
  }, []);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.busca) count++;
    if (filters.status) count++;
    if (filters.prioridade) count++;
    if (filters.responsavelId) count++;
    if (filters.clienteId) count++;
    if (filters.dataInicioDe || filters.dataInicioAte) count++;
    return count;
  }, [filters]);

  return {
    filters,
    updateFilter,
    resetFilters,
    clearFilter,
    setPage,
    activeFilterCount,
  };
}
