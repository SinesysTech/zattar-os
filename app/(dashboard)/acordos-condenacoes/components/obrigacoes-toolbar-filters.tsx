import type { FilterConfig, ComboboxOption } from '@/components/ui/table-toolbar-filter-config';
import type { FilterGroup } from '@/components/ui/table-toolbar';

export interface ObrigacoesFilters {
  tipo?: 'acordo' | 'condenacao' | 'custas_processuais';
  direcao?: 'recebimento' | 'pagamento';
  status?: 'pendente' | 'pago_parcial' | 'pago_total' | 'atrasado';
  processoId?: string;
}

export const OBRIGACOES_FILTER_CONFIGS: FilterConfig[] = [
  {
    id: 'tipo',
    label: 'Tipo',
    type: 'select',
    options: [
      { value: 'acordo', label: 'Acordo' },
      { value: 'condenacao', label: 'Condenação' },
      { value: 'custas_processuais', label: 'Custas Processuais' },
    ],
  },
  {
    id: 'direcao',
    label: 'Direção',
    type: 'select',
    options: [
      { value: 'recebimento', label: 'Recebimento' },
      { value: 'pagamento', label: 'Pagamento' },
    ],
  },
  {
    id: 'status',
    label: 'Status',
    type: 'select',
    options: [
      { value: 'pendente', label: 'Pendente' },
      { value: 'pago_parcial', label: 'Pago Parcial' },
      { value: 'pago_total', label: 'Pago Total' },
      { value: 'atrasado', label: 'Atrasado' },
    ],
  },
];

export function buildObrigacoesFilterOptions(): ComboboxOption[] {
  const options: ComboboxOption[] = [];

  for (const config of OBRIGACOES_FILTER_CONFIGS) {
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

export function buildObrigacoesFilterGroups(): FilterGroup[] {
  const configMap = new Map(OBRIGACOES_FILTER_CONFIGS.map(c => [c.id, c]));

  // Helper para construir opções sem prefixo do grupo
  const buildOptionsWithoutPrefix = (configs: FilterConfig[]): ComboboxOption[] => {
    const options: ComboboxOption[] = [];

    for (const config of configs) {
      if (config.type === 'select' && config.options) {
        for (const opt of config.options) {
          options.push({
            value: `${config.id}_${opt.value}`,
            label: opt.label, // Apenas o label da opção, sem prefixo
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
      label: 'Tipo',
      options: buildOptionsWithoutPrefix([
        configMap.get('tipo')!,
      ]),
    },
    {
      label: 'Direção',
      options: buildOptionsWithoutPrefix([
        configMap.get('direcao')!,
      ]),
    },
    {
      label: 'Status',
      options: buildOptionsWithoutPrefix([
        configMap.get('status')!,
      ]),
    },
  ];
}

export function parseObrigacoesFilters(selectedFilters: string[]): ObrigacoesFilters {
  const filters: ObrigacoesFilters = {};
  const configMap = new Map(OBRIGACOES_FILTER_CONFIGS.map(c => [c.id, c]));

  for (const selected of selectedFilters) {
    if (selected.includes('_')) {
      const [id, value] = selected.split('_', 2);
      const config = configMap.get(id);
      if (config && config.type === 'select') {
        if (id === 'tipo') {
          filters.tipo = value as 'acordo' | 'condenacao' | 'custas_processuais';
        } else if (id === 'direcao') {
          filters.direcao = value as 'recebimento' | 'pagamento';
        } else if (id === 'status') {
          filters.status = value as 'pendente' | 'pago_parcial' | 'pago_total' | 'atrasado';
        }
      }
    } else {
      const config = configMap.get(selected);
      if (config && config.type === 'boolean') {
        // Não há filtros booleanos por enquanto, mas pode adicionar no futuro
      }
    }
  }

  return filters;
}
