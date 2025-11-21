// Configuração de filtros da toolbar de clientes

import type { FilterConfig, ComboboxOption } from '@/components/ui/table-toolbar-filter-config';
import type { FilterGroup } from '@/components/ui/table-toolbar';
import type { ClientesFilters } from '@/app/_lib/types/clientes';

/**
 * Configuração de filtros para a página de clientes
 */
export const CLIENTES_FILTER_CONFIGS: FilterConfig[] = [
  {
    id: 'tipoPessoa',
    label: 'Tipo de Pessoa',
    type: 'select',
    options: [
      { value: 'pf', label: 'Pessoa Física' },
      { value: 'pj', label: 'Pessoa Jurídica' },
    ],
  },
  {
    id: 'ativo',
    label: 'Status',
    type: 'select',
    options: [
      { value: 'true', label: 'Ativo' },
      { value: 'false', label: 'Inativo' },
    ],
  },
];

/**
 * Constrói as opções de filtros para o combobox (lista flat)
 * Labels incluem o prefixo do grupo para facilitar a busca
 */
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

/**
 * Constrói grupos de filtros para interface hierárquica
 * Labels dentro dos grupos NÃO incluem o prefixo
 */
export function buildClientesFilterGroups(): FilterGroup[] {
  const configMap = new Map(CLIENTES_FILTER_CONFIGS.map(c => [c.id, c]));

  const buildOptionsWithoutPrefix = (configs: FilterConfig[]): ComboboxOption[] => {
    const options: ComboboxOption[] = [];

    for (const config of configs) {
      if (config.type === 'select' && config.options) {
        for (const opt of config.options) {
          options.push({
            value: `${config.id}_${opt.value}`,
            label: opt.label, // SEM prefixo do grupo
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
      options: buildOptionsWithoutPrefix([configMap.get('tipoPessoa')!]),
    },
    {
      label: 'Status',
      options: buildOptionsWithoutPrefix([configMap.get('ativo')!]),
    },
  ];
}

/**
 * Converte IDs de filtros selecionados em objeto de filtros para a API
 */
export function parseClientesFilters(selectedFilters: string[]): ClientesFilters {
  const filters: ClientesFilters = {};
  const configMap = new Map(CLIENTES_FILTER_CONFIGS.map(c => [c.id, c]));

  for (const selected of selectedFilters) {
    if (selected.includes('_')) {
      // Select: formato "id_value"
      const [id, value] = selected.split('_', 2);
      const config = configMap.get(id);

      if (config && config.type === 'select') {
        if (id === 'tipoPessoa') {
          filters.tipoPessoa = value as 'pf' | 'pj';
        } else if (id === 'ativo') {
          filters.ativo = value === 'true';
        }
      }
    }
    // Nota: não há filtros boolean em clientes, apenas select
  }

  return filters;
}
