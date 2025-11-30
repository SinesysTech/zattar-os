/**
 * Filtros para a tabela de representantes
 * 
 * NOTA: Após a refatoração do modelo, representantes são sempre advogados
 * (pessoas físicas) com CPF único. O único filtro relevante é a situação OAB.
 */

import type {
  FilterConfig,
  ComboboxOption,
} from '@/components/ui/table-toolbar-filter-config';
import type { FilterGroup } from '@/components/ui/table-toolbar';
import type { SituacaoOAB } from '@/types/domain/representantes';
import type { RepresentantesFilters } from '@/app/_lib/types/representantes';

export const REPRESENTANTES_FILTER_CONFIGS: FilterConfig[] = [
  {
    id: 'situacao_oab',
    label: 'Situação OAB',
    type: 'select',
    options: [
      { value: 'REGULAR', label: 'Regular' },
      { value: 'SUSPENSO', label: 'Suspenso' },
      { value: 'CANCELADO', label: 'Cancelado' },
      { value: 'LICENCIADO', label: 'Licenciado' },
      { value: 'FALECIDO', label: 'Falecido' },
    ],
  },
];

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
  const configMap = new Map(REPRESENTANTES_FILTER_CONFIGS.map((c) => [c.id, c]));

  const buildOptionsWithoutPrefix = (configs: FilterConfig[]): ComboboxOption[] => {
    const options: ComboboxOption[] = [];

    for (const config of configs) {
      if (config.type === 'select' && config.options) {
        for (const opt of config.options) {
          options.push({
            value: `${config.id}_${opt.value}`,
            label: opt.label,
            searchText: config.searchText || opt.searchText,
          });
        }
      }
    }

    return options;
  };

  return [
    {
      label: 'Situação OAB',
      options: buildOptionsWithoutPrefix([configMap.get('situacao_oab')!]),
    },
  ];
}

export function parseRepresentantesFilters(selectedFilters: string[]): RepresentantesFilters {
  const filters: RepresentantesFilters = {};
  const configMap = new Map(REPRESENTANTES_FILTER_CONFIGS.map((c) => [c.id, c]));

  for (const selected of selectedFilters) {
    if (selected.includes('_')) {
      let matchedConfig: FilterConfig | undefined;
      let matchedId: string | undefined;
      let value: string | undefined;

      for (const [configId] of configMap) {
        if (selected.startsWith(`${configId}_`)) {
          matchedId = configId;
          value = selected.slice(configId.length + 1);
          matchedConfig = configMap.get(configId);
          break;
        }
      }

      if (matchedConfig && matchedId && value && matchedConfig.type === 'select') {
        if (matchedId === 'situacao_oab') {
          filters.situacao_oab = value as SituacaoOAB;
        }
      }
    }
  }

  return filters;
}
