import {
  FilterConfig,
  buildFilterOptions,
  parseFilterValues,
} from '@/components/ui/table-toolbar-filter-config';
import type { FilterGroup, ComboboxOption } from '@/components/ui/table-toolbar';
import type { PlanoContasFilters } from '@/backend/types/financeiro/plano-contas.types';

export const PLANO_CONTAS_FILTER_CONFIGS: FilterConfig[] = [
  {
    id: 'tipoConta',
    label: 'Tipo de Conta',
    type: 'select',
    options: [
      { value: 'ativo', label: 'Ativo' },
      { value: 'passivo', label: 'Passivo' },
      { value: 'receita', label: 'Receita' },
      { value: 'despesa', label: 'Despesa' },
      { value: 'patrimonio_liquido', label: 'Patrimônio Líquido' },
    ],
    searchText: 'tipo conta ativo passivo receita despesa patrimonio',
  },
  {
    id: 'nivel',
    label: 'Nível',
    type: 'select',
    options: [
      { value: 'sintetica', label: 'Sintética' },
      { value: 'analitica', label: 'Analítica' },
    ],
    searchText: 'nivel sintetica analitica',
  },
  {
    id: 'ativo',
    label: 'Status',
    type: 'select',
    options: [
      { value: 'true', label: 'Ativo' },
      { value: 'false', label: 'Inativo' },
    ],
    searchText: 'status ativo inativo situacao',
  },
];

export function buildPlanoContasFilterOptions(): ReturnType<typeof buildFilterOptions> {
  return buildFilterOptions(PLANO_CONTAS_FILTER_CONFIGS);
}

export function buildPlanoContasFilterGroups(): FilterGroup[] {
  // Criar mapeamento de configs por ID para fácil acesso
  const configMap = new Map(PLANO_CONTAS_FILTER_CONFIGS.map((c) => [c.id, c]));

  // Helper para construir opções sem prefixo do grupo
  const buildOptionsWithoutPrefix = (configs: FilterConfig[]): ComboboxOption[] => {
    const options: ComboboxOption[] = [];

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
      label: 'Tipo',
      options: buildOptionsWithoutPrefix([configMap.get('tipoConta')!]),
    },
    {
      label: 'Nível',
      options: buildOptionsWithoutPrefix([configMap.get('nivel')!]),
    },
    {
      label: 'Status',
      options: buildOptionsWithoutPrefix([configMap.get('ativo')!]),
    },
  ];
}

export function parsePlanoContasFilters(selectedFilters: string[]): PlanoContasFilters {
  return parseFilterValues(
    selectedFilters,
    PLANO_CONTAS_FILTER_CONFIGS
  ) as PlanoContasFilters;
}
