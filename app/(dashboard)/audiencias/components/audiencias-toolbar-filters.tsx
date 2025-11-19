import type { FilterConfig, ComboboxOption } from '@/components/ui/table-toolbar-filter-config';
import type { AudienciasFilters } from '@/lib/types/audiencias';
import type { Usuario } from '@/lib/types/usuarios';

// Lista de TRTs disponíveis
const TRTS = [
  'TRT1', 'TRT2', 'TRT3', 'TRT4', 'TRT5', 'TRT6', 'TRT7', 'TRT8', 'TRT9', 'TRT10',
  'TRT11', 'TRT12', 'TRT13', 'TRT14', 'TRT15', 'TRT16', 'TRT17', 'TRT18', 'TRT19', 'TRT20',
  'TRT21', 'TRT22', 'TRT23', 'TRT24',
] as const;

export const AUDIENCIAS_FILTER_CONFIGS: FilterConfig[] = [
  {
    id: 'trt',
    label: 'TRT',
    type: 'select',
    options: TRTS.map(trt => ({ value: trt, label: trt })),
  },
  {
    id: 'grau',
    label: 'Grau',
    type: 'select',
    options: [
      { value: 'primeiro_grau', label: 'Primeiro Grau' },
      { value: 'segundo_grau', label: 'Segundo Grau' },
    ],
  },
  {
    id: 'responsavel_id',
    label: 'Responsável',
    type: 'select',
    options: [], // Will be populated in buildAudienciasFilterOptions
  },
  {
    id: 'status',
    label: 'Status',
    type: 'select',
    options: [
      { value: 'M', label: 'Marcada' },
      { value: 'R', label: 'Realizada' },
      { value: 'C', label: 'Cancelada' },
    ],
  },
  {
    id: 'tipo_is_virtual',
    label: 'Apenas Audiências Virtuais',
    type: 'boolean',
  },
  {
    id: 'sem_responsavel',
    label: 'Sem Responsável',
    type: 'boolean',
  },
];

export function buildAudienciasFilterOptions(usuarios?: Usuario[]): ComboboxOption[] {
  const options: ComboboxOption[] = [];

  for (const config of AUDIENCIAS_FILTER_CONFIGS) {
    if (config.type === 'select') {
      if (config.id === 'responsavel_id' && usuarios) {
        // Build options for Responsável
        const responsavelOptions: ComboboxOption[] = [
          { value: 'null', label: 'Sem responsável' },
          ...usuarios.map(u => ({ value: u.id.toString(), label: u.nomeExibicao })),
        ];
        for (const opt of responsavelOptions) {
          options.push({
            value: `${config.id}_${opt.value}`,
            label: `${config.label}: ${opt.label}`,
            searchText: config.searchText || opt.searchText,
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

export function parseAudienciasFilters(selectedFilters: string[]): AudienciasFilters {
  const filters: AudienciasFilters = {};
  const configMap = new Map(AUDIENCIAS_FILTER_CONFIGS.map(c => [c.id, c]));

  for (const selected of selectedFilters) {
    if (selected.includes('_')) {
      const [id, value] = selected.split('_', 2);
      const config = configMap.get(id);
      if (config && config.type === 'select') {
        if (id === 'trt') {
          filters.trt = value;
        } else if (id === 'grau') {
          filters.grau = value as 'primeiro_grau' | 'segundo_grau';
        } else if (id === 'responsavel_id') {
          if (value === 'null') {
            filters.responsavel_id = 'null';
          } else {
            const num = parseInt(value, 10);
            if (!isNaN(num)) {
              filters.responsavel_id = num;
            }
          }
        } else if (id === 'status') {
          filters.status = value;
        }
      }
    } else {
      const config = configMap.get(selected);
      if (config && config.type === 'boolean') {
        if (selected === 'tipo_is_virtual') {
          filters.tipo_is_virtual = true;
        } else if (selected === 'sem_responsavel') {
          filters.sem_responsavel = true;
        }
      }
    }
  }

  return filters;
}