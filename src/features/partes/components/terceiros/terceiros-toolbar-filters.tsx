/**
 * Configuracao de filtros para toolbar de terceiros
 */

import type { FilterConfig, ComboboxOption } from '@/components/ui/table-toolbar-filter-config';
import type { FilterGroup } from '@/components/ui/table-toolbar';
import type { TerceirosFilters } from '../../types';

export const TERCEIROS_FILTER_CONFIGS: FilterConfig[] = [
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
    id: 'tipo_parte',
    label: 'Tipo de Parte',
    type: 'select',
    options: [
      { value: 'perito', label: 'Perito' },
      { value: 'ministerio_publico', label: 'Ministerio Publico' },
      { value: 'assistente', label: 'Assistente' },
      { value: 'testemunha', label: 'Testemunha' },
      { value: 'custos_legis', label: 'Custos Legis' },
      { value: 'amicus_curiae', label: 'Amicus Curiae' },
      { value: 'outro', label: 'Outro' },
    ],
  },
  {
    id: 'polo',
    label: 'Polo',
    type: 'select',
    options: [
      { value: 'ativo', label: 'Polo Ativo' },
      { value: 'passivo', label: 'Polo Passivo' },
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

export function buildTerceirosFilterOptions(): ComboboxOption[] {
  const options: ComboboxOption[] = [];

  for (const config of TERCEIROS_FILTER_CONFIGS) {
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

export function buildTerceirosFilterGroups(): FilterGroup[] {
  const configMap = new Map(TERCEIROS_FILTER_CONFIGS.map(c => [c.id, c]));

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
      label: 'Tipo de Parte',
      options: buildOptionsWithoutPrefix([
        configMap.get('tipo_parte')!,
      ]),
    },
    {
      label: 'Polo',
      options: buildOptionsWithoutPrefix([
        configMap.get('polo')!,
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

export function parseTerceirosFilters(selectedFilters: string[]): TerceirosFilters {
  const filters: TerceirosFilters = {};
  const configMap = new Map(TERCEIROS_FILTER_CONFIGS.map(c => [c.id, c]));

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
          filters.tipo_pessoa = value as 'pf' | 'pj';
        } else if (matchedId === 'tipo_parte') {
          filters.tipo_parte = value;
        } else if (matchedId === 'polo') {
          filters.polo = value;
        } else if (matchedId === 'situacao') {
          filters.situacao = value as 'A' | 'I';
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
