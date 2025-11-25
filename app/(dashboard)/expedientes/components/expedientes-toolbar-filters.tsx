import type { FilterConfig, ComboboxOption } from '@/components/ui/table-toolbar-filter-config';
import type { FilterGroup } from '@/components/ui/table-toolbar';
import type { Usuario } from '@/app/_lib/types/usuarios';
import type { TipoExpediente } from '@/backend/types/tipos-expedientes/types';

// Filtros para expedientes (interface usada na página)
export interface ExpedientesFilters {
  trt?: string;
  grau?: 'primeiro_grau' | 'segundo_grau';
  responsavel_id?: number | 'null';
  baixado?: boolean;
  prazo_vencido?: boolean;
  tipo_expediente_id?: number;
  sem_tipo?: boolean;
  segredo_justica?: boolean;
  juizo_digital?: boolean;
  sem_responsavel?: boolean;
}

// Lista de TRTs disponíveis
const TRTS = [
  'TRT1', 'TRT2', 'TRT3', 'TRT4', 'TRT5', 'TRT6', 'TRT7', 'TRT8', 'TRT9', 'TRT10',
  'TRT11', 'TRT12', 'TRT13', 'TRT14', 'TRT15', 'TRT16', 'TRT17', 'TRT18', 'TRT19', 'TRT20',
  'TRT21', 'TRT22', 'TRT23', 'TRT24',
] as const;

export const EXPEDIENTES_FILTER_CONFIGS: FilterConfig[] = [
  {
    id: 'trt',
    label: 'TRT',
    type: 'select',
    options: [{ value: 'all', label: 'Todos' }, ...TRTS.map(trt => ({ value: trt, label: trt }))],
  },
  {
    id: 'grau',
    label: 'Grau',
    type: 'select',
    options: [
      { value: 'all', label: 'Todos' },
      { value: 'primeiro_grau', label: 'Primeiro Grau' },
      { value: 'segundo_grau', label: 'Segundo Grau' },
    ],
  },
  {
    id: 'responsavel_id',
    label: 'Responsável',
    type: 'select',
    options: [], // Populated in buildExpedientesFilterOptions
  },
  {
    id: 'tipo_expediente_id',
    label: 'Tipo',
    type: 'select',
    options: [], // Populated in buildExpedientesFilterOptions
  },
  {
    id: 'sem_tipo',
    label: 'Sem Tipo',
    type: 'boolean',
  },
  {
    id: 'baixado',
    label: 'Status de Baixa',
    type: 'select',
    options: [
      { value: 'all', label: 'Todos' },
      { value: 'false', label: 'Pendentes' },
      { value: 'true', label: 'Baixados' },
    ],
  },
  {
    id: 'prazo_vencido',
    label: 'Status de Prazo',
    type: 'select',
    options: [
      { value: 'all', label: 'Todos' },
      { value: 'false', label: 'No Prazo' },
      { value: 'true', label: 'Prazo Vencido' },
    ],
  },
  {
    id: 'segredo_justica',
    label: 'Segredo de Justiça',
    type: 'boolean',
  },
  {
    id: 'juizo_digital',
    label: 'Juízo Digital',
    type: 'boolean',
  },
  {
    id: 'sem_responsavel',
    label: 'Sem Responsável',
    type: 'boolean',
  },
];

export function buildExpedientesFilterOptions(
  usuarios?: Usuario[],
  tiposExpedientes?: TipoExpediente[]
): ComboboxOption[] {
  const options: ComboboxOption[] = [];

  for (const config of EXPEDIENTES_FILTER_CONFIGS) {
    if (config.type === 'select') {
      if (config.id === 'responsavel_id' && usuarios) {
        // Build options for Responsável
        const responsavelOptions: ComboboxOption[] = [
          { value: 'all', label: 'Todos os responsáveis' },
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
      } else if (config.id === 'tipo_expediente_id' && tiposExpedientes) {
        // Build options for Tipo de Expediente
        for (const tipo of tiposExpedientes) {
          options.push({
            value: `${config.id}_${tipo.id}`,
            label: `${config.label}: ${tipo.tipo_expediente}`,
            searchText: tipo.tipo_expediente,
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

export function buildExpedientesFilterGroups(
  usuarios?: Usuario[],
  tiposExpedientes?: TipoExpediente[]
): FilterGroup[] {
  const configMap = new Map(EXPEDIENTES_FILTER_CONFIGS.map(c => [c.id, c]));

  // Helper para construir opções sem prefixo do grupo
  const buildOptionsWithoutPrefix = (
    configs: FilterConfig[],
    usuariosList?: Usuario[],
    tiposList?: TipoExpediente[]
  ): ComboboxOption[] => {
    const options: ComboboxOption[] = [];

    for (const config of configs) {
      if (config.type === 'select') {
        if (config.id === 'responsavel_id' && usuariosList) {
          // Build options for Responsável sem prefixo
          const responsavelOptions: ComboboxOption[] = [
            { value: 'null', label: 'Sem responsável' },
            ...usuariosList.map(u => ({ value: u.id.toString(), label: u.nomeExibicao })),
          ];
          for (const opt of responsavelOptions) {
            options.push({
              value: `${config.id}_${opt.value}`,
              label: opt.label, // Sem prefixo
              searchText: config.searchText || opt.searchText,
            });
          }
        } else if (config.id === 'tipo_expediente_id' && tiposList) {
          for (const tipo of tiposList) {
            options.push({
              value: `${config.id}_${tipo.id}`,
              label: tipo.tipo_expediente, // Sem prefixo
              searchText: tipo.tipo_expediente,
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
      label: 'Tribunal',
      options: buildOptionsWithoutPrefix([configMap.get('trt')!]),
    },
    {
      label: 'Grau',
      options: buildOptionsWithoutPrefix([configMap.get('grau')!]),
    },
    {
      label: 'Status',
      options: buildOptionsWithoutPrefix([
        configMap.get('baixado')!,
        configMap.get('prazo_vencido')!,
      ]),
    },
    {
      label: 'Responsável',
      options: buildOptionsWithoutPrefix([configMap.get('responsavel_id')!], usuarios),
    },
    {
      label: 'Tipo',
      options: buildOptionsWithoutPrefix(
        [configMap.get('tipo_expediente_id')!, configMap.get('sem_tipo')!],
        undefined,
        tiposExpedientes
      ),
    },
    {
      label: 'Características',
      options: buildOptionsWithoutPrefix([
        configMap.get('segredo_justica')!,
        configMap.get('juizo_digital')!,
        configMap.get('sem_responsavel')!,
      ]),
    },
  ];
}

export function parseExpedientesFilters(selectedFilters: string[]): ExpedientesFilters {
  const filters: ExpedientesFilters = {};
  const configMap = new Map(EXPEDIENTES_FILTER_CONFIGS.map(c => [c.id, c]));

  for (const selected of selectedFilters) {
    if (selected.includes('_')) {
      const [id, value] = selected.split('_', 2);
      const config = configMap.get(id);
      if (config && config.type === 'select') {
        if (id === 'trt') {
          if (value !== 'all') {
            filters.trt = value;
          }
        } else if (id === 'grau') {
          if (value !== 'all') {
            filters.grau = value as 'primeiro_grau' | 'segundo_grau';
          }
        } else if (id === 'responsavel_id') {
          if (value === 'all') {
            // ignore
          } else if (value === 'null') {
            filters.responsavel_id = 'null';
          } else {
            const num = parseInt(value, 10);
            if (!isNaN(num)) {
              filters.responsavel_id = num;
            }
          }
        } else if (id === 'tipo_expediente_id') {
          const num = parseInt(value, 10);
          if (!isNaN(num)) {
            filters.tipo_expediente_id = num;
          }
        } else if (id === 'baixado') {
          if (value === 'all') {
            // ignore
          } else {
            filters.baixado = value === 'true';
          }
        } else if (id === 'prazo_vencido') {
          if (value === 'all') {
            // ignore
          } else {
            filters.prazo_vencido = value === 'true';
          }
        }
      }
    } else {
      const config = configMap.get(selected);
      if (config && config.type === 'boolean') {
        if (selected === 'segredo_justica') {
          filters.segredo_justica = true;
        } else if (selected === 'juizo_digital') {
          filters.juizo_digital = true;
        } else if (selected === 'sem_responsavel') {
          filters.sem_responsavel = true;
        } else if (selected === 'sem_tipo') {
          filters.sem_tipo = true;
        }
      }
    }
  }

  return filters;
}
