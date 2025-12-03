import type { FilterConfig, ComboboxOption } from '@/components/ui/table-toolbar-filter-config';
import type { FilterGroup } from '@/components/ui/table-toolbar';
import type { Advogado } from '@/backend/types/advogados/types';
import type { TipoCaptura, StatusCaptura } from '@/backend/types/captura/capturas-log-types';

// Tipos de captura disponíveis
const TIPOS_CAPTURA: { value: TipoCaptura; label: string }[] = [
  { value: 'acervo_geral', label: 'Acervo Geral' },
  { value: 'arquivados', label: 'Arquivados' },
  { value: 'audiencias', label: 'Audiências' },
  { value: 'pendentes', label: 'Pendentes' },
  { value: 'partes', label: 'Partes' },
];

// Status de captura disponíveis
const STATUS_CAPTURA: { value: StatusCaptura; label: string }[] = [
  { value: 'pending', label: 'Pendente' },
  { value: 'in_progress', label: 'Em Progresso' },
  { value: 'completed', label: 'Concluída' },
  { value: 'failed', label: 'Falhou' },
];

export interface CapturasFilters {
  tipo_captura?: TipoCaptura;
  status?: StatusCaptura;
  advogado_id?: number;
}

export const CAPTURAS_FILTER_CONFIGS: FilterConfig[] = [
  {
    id: 'tipo_captura',
    label: 'Tipo',
    type: 'select',
    options: TIPOS_CAPTURA,
  },
  {
    id: 'status',
    label: 'Status',
    type: 'select',
    options: STATUS_CAPTURA,
  },
  {
    id: 'advogado_id',
    label: 'Advogado',
    type: 'select',
    options: [], // Will be populated in buildCapturasFilterOptions
  },
];

export function buildCapturasFilterOptions(advogados?: Advogado[]): ComboboxOption[] {
  const options: ComboboxOption[] = [];

  for (const config of CAPTURAS_FILTER_CONFIGS) {
    if (config.type === 'select') {
      if (config.id === 'advogado_id' && advogados) {
        // Build options for Advogado
        for (const advogado of advogados) {
          options.push({
            value: `${config.id}_${advogado.id}`,
            label: `${config.label}: ${advogado.nome_completo} - OAB ${advogado.oab}/${advogado.uf_oab}`,
            searchText: `${advogado.nome_completo} ${advogado.oab} ${advogado.uf_oab}`,
          });
        }
      } else if (config.options) {
        for (const opt of config.options) {
          options.push({
            value: `${config.id}_${opt.value}`,
            label: `${config.label}: ${opt.label}`,
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
}

export function buildCapturasFilterGroups(advogados?: Advogado[]): FilterGroup[] {
  const configMap = new Map(CAPTURAS_FILTER_CONFIGS.map(c => [c.id, c]));

  // Helper para construir opções sem prefixo do grupo
  const buildOptionsWithoutPrefix = (configs: FilterConfig[], advogadosList?: Advogado[]): ComboboxOption[] => {
    const options: ComboboxOption[] = [];

    for (const config of configs) {
      if (config.type === 'select') {
        if (config.id === 'advogado_id' && advogadosList) {
          // Build options for Advogado sem prefixo
          for (const advogado of advogadosList) {
            options.push({
              value: `${config.id}_${advogado.id}`,
              label: `${advogado.nome_completo} - OAB ${advogado.oab}/${advogado.uf_oab}`,
              searchText: `${advogado.nome_completo} ${advogado.oab} ${advogado.uf_oab}`,
            });
          }
        } else if (config.options) {
          for (const opt of config.options) {
            options.push({
              value: `${config.id}_${opt.value}`,
              label: opt.label, // Apenas o label da opção, sem prefixo
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
      label: 'Tipo de Captura',
      options: buildOptionsWithoutPrefix([
        configMap.get('tipo_captura')!,
      ]),
    },
    {
      label: 'Status',
      options: buildOptionsWithoutPrefix([
        configMap.get('status')!,
      ]),
    },
    {
      label: 'Advogado',
      options: buildOptionsWithoutPrefix([
        configMap.get('advogado_id')!,
      ], advogados),
    },
  ];
}

export function parseCapturasFilters(selectedFilters: string[]): CapturasFilters {
  const filters: CapturasFilters = {};

  for (const selected of selectedFilters) {
    if (selected.includes('_')) {
      // Handle multi-word IDs like tipo_captura
      if (selected.startsWith('tipo_captura_')) {
        const value = selected.replace('tipo_captura_', '');
        filters.tipo_captura = value as TipoCaptura;
      } else if (selected.startsWith('advogado_id_')) {
        const value = selected.replace('advogado_id_', '');
        const num = parseInt(value, 10);
        if (!isNaN(num)) {
          filters.advogado_id = num;
        }
      } else if (selected.startsWith('status_')) {
        const value = selected.replace('status_', '');
        filters.status = value as StatusCaptura;
      }
    }
  }

  return filters;
}
