import type { FilterConfig, ComboboxOption } from '@/components/ui/table-toolbar-filter-config';
import type { FilterGroup } from '@/components/ui/table-toolbar';

export interface ClientesFilters {
  tipo_pessoa?: 'pf' | 'pj';
  situacao?: 'A' | 'I';
}

export const CLIENTES_FILTER_CONFIGS: FilterConfig[] = [
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
    id: 'situacao',
    label: 'Situação',
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
      label: 'Situação',
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
      const [id, value] = selected.split('_', 2);
      const config = configMap.get(id);
      if (config && config.type === 'select') {
        if (id === 'tipo' || id === 'pessoa') {
          // Skip - é parte do tipo_pessoa
          continue;
        } else if (selected.startsWith('tipo_pessoa_')) {
          const tipoPessoaValue = selected.replace('tipo_pessoa_', '');
          filters.tipo_pessoa = tipoPessoaValue as 'pf' | 'pj';
        } else if (id === 'situacao') {
          filters.situacao = value as 'A' | 'I';
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
