import type {
  FilterConfig,
  ComboboxOption,
} from '@/components/ui/table-toolbar-filter-config';
import type { FilterGroup } from '@/components/ui/table-toolbar';

export interface RepresentantesFilters {
  parte_tipo?: 'cliente' | 'parte_contraria' | 'terceiro';
  tipo_pessoa?: 'pf' | 'pj';
  situacao_oab?: 'REGULAR' | 'SUSPENSO' | 'CANCELADO' | 'LICENCIADO' | 'FALECIDO';
}

export const REPRESENTANTES_FILTER_CONFIGS: FilterConfig[] = [
  {
    id: 'parte_tipo',
    label: 'Tipo de Parte',
    type: 'select',
    options: [
      { value: 'cliente', label: 'Cliente' },
      { value: 'parte_contraria', label: 'Parte Contrária' },
      { value: 'terceiro', label: 'Terceiro' },
    ],
  },
  {
    id: 'tipo_pessoa',
    label: 'Tipo de Pessoa',
    type: 'select',
    options: [
      { value: 'pf', label: 'Pessoa Física' },
      { value: 'pj', label: 'Pessoa Jurídica' },
    ],
  },
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
      label: 'Tipo de Parte',
      options: buildOptionsWithoutPrefix([configMap.get('parte_tipo')!]),
    },
    {
      label: 'Tipo de Pessoa',
      options: buildOptionsWithoutPrefix([configMap.get('tipo_pessoa')!]),
    },
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
      // Tenta encontrar o ID completo no configMap primeiro
      let matchedConfig: FilterConfig | undefined;
      let matchedId: string | undefined;
      let value: string | undefined;

      // Verifica todos os IDs possíveis do configMap
      for (const [configId] of configMap) {
        if (selected.startsWith(`${configId}_`)) {
          matchedId = configId;
          value = selected.slice(configId.length + 1); // Remove o ID e o underscore
          matchedConfig = configMap.get(configId);
          break;
        }
      }

      if (matchedConfig && matchedId && value && matchedConfig.type === 'select') {
        if (matchedId === 'parte_tipo') {
          filters.parte_tipo = value as 'cliente' | 'parte_contraria' | 'terceiro';
        } else if (matchedId === 'tipo_pessoa') {
          filters.tipo_pessoa = value as 'pf' | 'pj';
        } else if (matchedId === 'situacao_oab') {
          filters.situacao_oab = value as
            | 'REGULAR'
            | 'SUSPENSO'
            | 'CANCELADO'
            | 'LICENCIADO'
            | 'FALECIDO';
        }
      }
    } else {
      const config = configMap.get(selected);
      if (config && config.type === 'boolean') {
        // Não temos booleans ainda, mas deixo preparado
      }
    }
  }

  return filters;
}
