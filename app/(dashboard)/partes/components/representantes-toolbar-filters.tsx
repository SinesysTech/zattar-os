/**
 * Filtros para a tabela de representantes
 *
 * NOTA: Após a refatoração do modelo, representantes são sempre advogados
 * (pessoas físicas) com CPF único e podem ter múltiplas OABs (array JSONB).
 * Os filtros de situação OAB foram removidos pois cada advogado pode ter
 * múltiplas inscrições com situações diferentes.
 */

import type {
  FilterConfig,
  ComboboxOption,
} from '@/components/ui/table-toolbar-filter-config';
import type { FilterGroup } from '@/components/ui/table-toolbar';
import type { RepresentantesFilters } from '@/app/_lib/types/representantes';

// Filtros disponíveis para representantes
// Por enquanto, não há filtros específicos além da busca por texto
// O filtro de situação OAB foi removido porque representantes podem ter múltiplas OABs
export const REPRESENTANTES_FILTER_CONFIGS: FilterConfig[] = [];

export function buildRepresentantesFilterOptions(): ComboboxOption[] {
  const options: ComboboxOption[] = [];

  for (const config of REPRESENTANTES_FILTER_CONFIGS) {
    if (config.type === 'select' && config.options) {
      for (const opt of config.options) {
        options.push({
          value: `${config.id}_${opt.value}`,
          label: `${config.label}: ${opt.label}`,
          searchText: config.searchText || opt.searchText,
        });
      }
    }
  }

  return options;
}

export function buildRepresentantesFilterGroups(): FilterGroup[] {
  // Sem filtros de grupo por enquanto
  return [];
}

export function parseRepresentantesFilters(_selectedFilters: string[]): RepresentantesFilters {
  // Sem filtros específicos por enquanto
  return {};
}
