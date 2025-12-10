/**
 * Filtros para a tabela de representantes
 *
 * NOTA: Apos a refatoracao do modelo, representantes sao sempre advogados
 * (pessoas fisicas) com CPF unico e podem ter multiplas OABs (array JSONB).
 * Os filtros de situacao OAB foram removidos pois cada advogado pode ter
 * multiplas inscricoes com situacoes diferentes.
 */

import type {
  FilterConfig,
  ComboboxOption,
} from '@/components/ui/table-toolbar-filter-config';
import type { FilterGroup } from '@/components/ui/table-toolbar';
import type { RepresentantesFilters } from '../../types';

// Filtros disponiveis para representantes
// Por enquanto, nao ha filtros especificos alem da busca por texto
// O filtro de situacao OAB foi removido porque representantes podem ter multiplas OABs
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

// eslint-disable-next-line @typescript-eslint/no-unused-vars -- parametro placeholder para interface futura
export function parseRepresentantesFilters(_selectedFilters: string[]): RepresentantesFilters {
  // Sem filtros especificos por enquanto
  return {};
}
