import type { FilterConfig, ComboboxOption } from '@/components/ui/table-toolbar-filter-config';
import type { FilterGroup } from '@/components/ui/table-toolbar';
import type { CodigoTRT } from '@/app/_lib/types/credenciais';

// Filtros para tribunais (interface usada na página)
export interface TribunaisFilters {
  tribunal_codigo?: CodigoTRT;
  tipo_acesso?: 'primeiro_grau' | 'segundo_grau' | 'unificado' | 'unico';
}

// Lista de TRTs disponíveis
const TRTS: CodigoTRT[] = [
  'TRT1', 'TRT2', 'TRT3', 'TRT4', 'TRT5', 'TRT6', 'TRT7', 'TRT8', 'TRT9', 'TRT10',
  'TRT11', 'TRT12', 'TRT13', 'TRT14', 'TRT15', 'TRT16', 'TRT17', 'TRT18', 'TRT19', 'TRT20',
  'TRT21', 'TRT22', 'TRT23', 'TRT24',
];

export const TRIBUNAIS_FILTER_CONFIGS: FilterConfig[] = [
  {
    id: 'tribunal_codigo',
    label: 'Tribunal',
    type: 'select',
    options: TRTS.map(trt => ({ value: trt, label: trt })),
  },
  {
    id: 'tipo_acesso',
    label: 'Tipo de Acesso',
    type: 'select',
    options: [
      { value: 'primeiro_grau', label: '1º Grau' },
      { value: 'segundo_grau', label: '2º Grau' },
      { value: 'unificado', label: 'Unificado' },
      { value: 'unico', label: 'Único' },
    ],
  },
];

export function buildTribunaisFilterOptions(): ComboboxOption[] {
  const options: ComboboxOption[] = [];

  for (const config of TRIBUNAIS_FILTER_CONFIGS) {
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

export function buildTribunaisFilterGroups(): FilterGroup[] {
  const configMap = new Map(TRIBUNAIS_FILTER_CONFIGS.map(c => [c.id, c]));

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
        configMap.get('tribunal_codigo')!,
      ]),
    },
    {
      label: 'Tipo de Acesso',
      options: buildOptionsWithoutPrefix([
        configMap.get('tipo_acesso')!,
      ]),
    },
  ];
}

export function parseTribunaisFilters(selectedFilters: string[]): TribunaisFilters {
  const filters: TribunaisFilters = {};
  const configMap = new Map(TRIBUNAIS_FILTER_CONFIGS.map(c => [c.id, c]));

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
        if (matchedId === 'tribunal_codigo') {
          filters.tribunal_codigo = value as CodigoTRT;
        } else if (matchedId === 'tipo_acesso') {
          filters.tipo_acesso = value as 'primeiro_grau' | 'segundo_grau' | 'unificado' | 'unico';
        }
      }
    }
  }

  return filters;
}

