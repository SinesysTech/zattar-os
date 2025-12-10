/**
 * Configuracao de filtros para toolbar de clientes
 */

import type { FilterConfig, ComboboxOption } from '@/components/ui/table-toolbar-filter-config';
import type { FilterGroup } from '@/components/ui/table-toolbar';
import type { ClientesFilters } from '../../types';

export const CLIENTES_FILTER_CONFIGS: FilterConfig[] = [
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

export function buildClientesFilterOptions(): ComboboxOption[] {
  const options: ComboboxOption[] = [];

  for (const config of CLIENTES_FILTER_CONFIGS) {
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

export function buildClientesFilterGroups(): FilterGroup[] {
  const configMap = new Map(CLIENTES_FILTER_CONFIGS.map(c => [c.id, c]));

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

export function parseClientesFilters(selectedFilters: string[]): ClientesFilters {
  const filters: ClientesFilters = {};
  const configMap = new Map(CLIENTES_FILTER_CONFIGS.map(c => [c.id, c]));

  for (const selected of selectedFilters) {
    if (selected.includes('_')) {
      // Tenta encontrar o ID completo no configMap primeiro
      let matchedConfig: FilterConfig | undefined;
      let matchedId: string | undefined;
      let value: string | undefined;

      // Verifica todos os IDs possiveis do configMap
      for (const [configId] of configMap) {
        if (selected.startsWith(`${configId}_`)) {
          matchedId = configId;
          value = selected.slice(configId.length + 1); // Remove o ID e o underscore
          matchedConfig = configMap.get(configId);
          break;
        }
      }

      if (matchedConfig && matchedId && value && matchedConfig.type === 'select') {
        if (matchedId === 'tipo_pessoa') {
          filters.tipo_pessoa = value as 'pf' | 'pj';
        } else if (matchedId === 'situacao') {
          filters.situacao = value as 'A' | 'I' | 'E' | 'H';
        }
      }
    } else {
      const config = configMap.get(selected);
      if (config && config.type === 'boolean') {
        // Nao temos booleans ainda, mas deixo preparado
      }
    }
  }

  return filters;
}
