import { useState, useCallback, useMemo } from 'react';

/**
 * Hook customizado para gerenciar estado de múltiplos filtros
 * Criado como parte da refatoração TableToolbar → DataTableToolbar
 */

interface UseFiltrosFinanceirosOptions<T> {
  initialFilters?: Partial<T>;
  onFilterChange?: (filters: Partial<T>) => void;
}

interface UseFiltrosFinanceirosReturn<T> {
  filters: Partial<T>;
  updateFilter: (key: keyof T, value: unknown) => void;
  resetFilters: () => void;
  clearFilter: (key: keyof T) => void;
  setFilters: React.Dispatch<React.SetStateAction<Partial<T>>>;
}

export function useFiltrosFinanceiros<T extends Record<string, unknown>>(
  options: UseFiltrosFinanceirosOptions<T> = {}
): UseFiltrosFinanceirosReturn<T> {
  const { initialFilters = {}, onFilterChange } = options;

  const [filters, setFilters] = useState<Partial<T>>(initialFilters);

  const updateFilter = useCallback(
    (key: keyof T, value: unknown) => {
      setFilters((prev) => {
        const next = { ...prev, [key]: value };
        onFilterChange?.(next);
        return next;
      });
    },
    [onFilterChange]
  );

  const resetFilters = useCallback(() => {
    setFilters(initialFilters);
    onFilterChange?.(initialFilters);
  }, [initialFilters, onFilterChange]);

  const clearFilter = useCallback(
    (key: keyof T) => {
      setFilters((prev) => {
        const next = { ...prev };
        delete next[key];
        onFilterChange?.(next);
        return next;
      });
    },
    [onFilterChange]
  );

  // Retornar filtros memoizados para evitar re-renders desnecessários
  const memoizedFilters = useMemo(() => filters, [filters]);

  return {
    filters: memoizedFilters,
    updateFilter,
    resetFilters,
    clearFilter,
    setFilters,
  };
}
