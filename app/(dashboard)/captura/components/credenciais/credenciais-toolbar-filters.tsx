import type { FilterConfig, ComboboxOption } from '@/components/ui/table-toolbar-filter-config';
import type { FilterGroup } from '@/components/ui/table-toolbar';
import type { CodigoTRT, GrauTRT } from '@/app/_lib/types/credenciais';

// Filtros para credenciais (interface usada na página)
export interface CredenciaisFilters {
  tribunal?: CodigoTRT;
  grau?: GrauTRT;
  active?: boolean;
}

// Lista de tribunais disponíveis (TRTs + TST)
const TRIBUNAIS: CodigoTRT[] = [
  'TRT1', 'TRT2', 'TRT3', 'TRT4', 'TRT5', 'TRT6', 'TRT7', 'TRT8', 'TRT9', 'TRT10',
  'TRT11', 'TRT12', 'TRT13', 'TRT14', 'TRT15', 'TRT16', 'TRT17', 'TRT18', 'TRT19', 'TRT20',
  'TRT21', 'TRT22', 'TRT23', 'TRT24', 'TST',
];

export const CREDENCIAIS_FILTER_CONFIGS: FilterConfig[] = [
  {
    id: 'tribunal',
    label: 'Tribunal',
    type: 'select',
    options: TRIBUNAIS.map(t => ({ value: t, label: t })),
  },
  {
    id: 'grau',
    label: 'Grau',
    type: 'select',
    options: [
      { value: 'primeiro_grau', label: '1º Grau' },
      { value: 'segundo_grau', label: '2º Grau' },
      { value: 'tribunal_superior', label: 'Tribunal Superior' },
    ],
  },
  {
    id: 'active',
    label: 'Status',
    type: 'select',
    options: [
      { value: 'true', label: 'Ativo' },
      { value: 'false', label: 'Inativo' },
    ],
  },
];

export function buildCredenciaisFilterOptions(): ComboboxOption[] {
  const options: ComboboxOption[] = [];

  for (const config of CREDENCIAIS_FILTER_CONFIGS) {
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

export function buildCredenciaisFilterGroups(): FilterGroup[] {
  const configMap = new Map(CREDENCIAIS_FILTER_CONFIGS.map(c => [c.id, c]));

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
      }
    }

    return options;
  };

  return [
    {
      label: 'Tribunal',
      options: buildOptionsWithoutPrefix([
        configMap.get('tribunal')!,
      ]),
    },
    {
      label: 'Grau',
      options: buildOptionsWithoutPrefix([
        configMap.get('grau')!,
      ]),
    },
    {
      label: 'Status',
      options: buildOptionsWithoutPrefix([
        configMap.get('active')!,
      ]),
    },
  ];
}

export function parseCredenciaisFilters(selectedFilters: string[]): CredenciaisFilters {
  const filters: CredenciaisFilters = {};
  const configMap = new Map(CREDENCIAIS_FILTER_CONFIGS.map(c => [c.id, c]));

  for (const selected of selectedFilters) {
    if (selected.includes('_')) {
      // Encontrar o config ID correto verificando quais IDs conhecidos são prefixo do filtro
      // Isso suporta valores com underscore (primeiro_grau, segundo_grau)
      let id: string | null = null;
      let value: string | null = null;
      for (const configId of configMap.keys()) {
        if (selected.startsWith(configId + '_')) {
          id = configId;
          value = selected.substring(configId.length + 1);
          break;
        }
      }
      if (!id || !value) continue;
      const config = configMap.get(id);
      if (config && config.type === 'select') {
        if (id === 'active') {
          filters.active = value === 'true';
        } else {
          filters[id as keyof CredenciaisFilters] = value as any;
        }
      }
    }
  }

  return filters;
}

