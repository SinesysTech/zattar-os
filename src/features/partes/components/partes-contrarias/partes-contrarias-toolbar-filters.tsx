/**
 * Configuracao de filtros para toolbar de partes contrarias
 */

import type { FilterConfig, ComboboxOption } from '@/components/ui/table-toolbar-filter-config';
import type { FilterGroup } from '@/components/ui/table-toolbar';
import type { TipoPessoa, SituacaoPJE } from '@/core/partes';
import type { PartesContrariasFilters } from '../../types';

export const PARTES_CONTRARIAS_FILTER_CONFIGS: FilterConfig[] = [
  {
    id: 'tipo_pessoa',
    label: 'Tipo de Pessoa',
    type: 'select',
    options: [
      { value: 'pf', label: 'Pessoa Fisica' },
      { value: 'pj', label: 'Pessoa Juridica' },
    ],
  },
  {
    id: 'situacao',
    label: 'Situacao',
    type: 'select',
    options: [
      { value: 'A', label: 'Ativo' },
      { value: 'I', label: 'Inativo' },
    ],
  },
];

export function buildPartesContrariasFilterOptions(): ComboboxOption[] {
  const options: ComboboxOption[] = [];

  for (const config of PARTES_CONTRARIAS_FILTER_CONFIGS) {
    if (config.type === 'select' && config.options) {
      for (const opt of config.options) {
        options.push({
          value: `${config.id}_${opt.value}`,
          label: `${config.label}: ${opt.label}`,
          searchText: config.searchText || opt.searchText,
        });
      }
    } else if (config.type === 'boolean') {
      options.push({
        value: config.id,
        label: config.label,
        searchText: config.searchText,
      });
    }
  }

  return options;
}

export function buildPartesContrariasFilterGroups(): FilterGroup[] {
  const configMap = new Map(PARTES_CONTRARIAS_FILTER_CONFIGS.map(c => [c.id, c]));

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
      } else if (config.type === 'boolean') {
        options.push({
          value: config.id,
          label: config.label,
          searchText: config.searchText,
        });
      }
    }

    return options;
  };

  return [
    {
      label: 'Tipo de Pessoa',
      options: buildOptionsWithoutPrefix([
        configMap.get('tipo_pessoa')!,
      ]),
    },
    {
      label: 'Situacao',
      options: buildOptionsWithoutPrefix([
        configMap.get('situacao')!,
      ]),
    },
  ];
}

export function parsePartesContrariasFilters(selectedFilters: string[]): PartesContrariasFilters {
  const filters: PartesContrariasFilters = {};
  const configMap = new Map(PARTES_CONTRARIAS_FILTER_CONFIGS.map(c => [c.id, c]));

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
        if (matchedId === 'tipo_pessoa') {
          filters.tipo_pessoa = value as TipoPessoa;
        } else if (matchedId === 'situacao') {
          filters.situacao = value as SituacaoPJE;
        }
      }
    } else {
      const config = configMap.get(selected);
      if (config && config.type === 'boolean') {
        // Reservado para futura extensao
      }
    }
  }

  return filters;
}
