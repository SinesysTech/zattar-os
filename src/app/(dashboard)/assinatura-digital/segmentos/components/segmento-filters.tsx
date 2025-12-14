import { FilterConfig, buildFilterOptions, parseFilterValues } from '@/components/ui/table-toolbar-filter-config';
import type { FilterGroup } from '@/components/ui/table-toolbar';
import type { EscopoSegmento } from '@/features/assinatura-digital';

export interface SegmentosFilters {
  ativo?: boolean;
  escopo?: EscopoSegmento;
}

export const SEGMENTOS_FILTER_CONFIGS: FilterConfig[] = [
  {
    id: 'ativo',
    label: 'Disponibilidade',
    type: 'boolean',
    searchText: 'disponivel ativo inativo',
  },
  {
    id: 'escopo',
    label: 'Escopo',
    type: 'select',
    options: [
      { value: 'global', label: 'Global' },
      { value: 'contratos', label: 'Contratos' },
      { value: 'assinatura', label: 'Assinatura Digital' },
    ],
    searchText: 'escopo contexto',
  },
];

export function buildSegmentosFilterOptions(): ReturnType<typeof buildFilterOptions> {
  return buildFilterOptions(SEGMENTOS_FILTER_CONFIGS);
}

export function buildSegmentosFilterGroups(): FilterGroup[] {
  // Criar mapeamento de configs por ID para fácil acesso
  const configMap = new Map(SEGMENTOS_FILTER_CONFIGS.map(c => [c.id, c]));

  // Helper para construir opções sem prefixo do grupo
  const buildOptionsWithoutPrefix = (configs: FilterConfig[]): { value: string; label: string; searchText?: string }[] => {
    const options: { value: string; label: string; searchText?: string }[] = [];

    for (const config of configs) {
      if (config.type === 'select' || config.type === 'multiselect') {
        if (config.options) {
          for (const opt of config.options) {
            options.push({
              value: `${config.id}_${opt.value}`,
              label: opt.label,
              searchText: config.searchText || opt.searchText,
            });
          }
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
      label: 'Disponibilidade',
      options: buildOptionsWithoutPrefix([
        configMap.get('ativo')!,
      ]),
    },
    {
      label: 'Escopo',
      options: buildOptionsWithoutPrefix([
        configMap.get('escopo')!,
      ]),
    },
  ];
}

export function parseSegmentosFilters(selectedFilters: string[]): SegmentosFilters {
  return parseFilterValues(selectedFilters, SEGMENTOS_FILTER_CONFIGS) as SegmentosFilters;
}
