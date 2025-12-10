import type { FilterConfig, ComboboxOption } from '@/components/ui/table-toolbar-filter-config';
import type { FilterGroup } from '@/components/ui/table-toolbar';
import type { Usuario } from '@/app/_lib/types/usuarios';
import type { TipoExpediente } from '@/backend/types/tipos-expedientes/types';
import { CodigoTribunal, GrauTribunal } from '@/core/expedientes/domain';

// Filtros para expedientes (interface usada na página)
export interface ExpedientesFilters {
  trt?: CodigoTribunal;
  grau?: GrauTribunal;
  responsavelId?: number | 'null';
  baixado?: boolean;
  prazoVencido?: boolean;
  tipoExpedienteId?: number;
  semTipo?: boolean;
  segredoJustica?: boolean;
  juizoDigital?: boolean;
  semResponsavel?: boolean;
}

interface Usuario {
  id: number;
  nomeExibicao: string;
}

interface TipoExpediente {
  id: number;
  tipoExpediente: string;
}

// Lista de tribunais trabalhistas disponíveis (TRTs)
const TRIBUNAIS: CodigoTribunal[] = CodigoTribunal;

export const EXPEDIENTES_FILTER_CONFIGS: FilterConfig[] = [
  {
    id: 'trt',
    label: 'Tribunal',
    type: 'select',
    options: [{ value: 'all', label: 'Todos' }, ...TRIBUNAIS.map(trib => ({ value: trib, label: trib }))],
  },
  {
    id: 'grau',
    label: 'Grau',
    type: 'select',
    options: [
      { value: 'all', label: 'Todos' },
      { value: GrauTribunal.PRIMEIRO_GRAU, label: 'Primeiro Grau' },
      { value: GrauTribunal.SEGUNDO_GRAU, label: 'Segundo Grau' },
      { value: GrauTribunal.TRIBUNAL_SUPERIOR, label: 'Tribunal Superior' },
    ],
  },
  {
    id: 'responsavelId',
    label: 'Responsável',
    type: 'select',
    options: [], // Populated in buildExpedientesFilterOptions
  },
  {
    id: 'tipoExpedienteId',
    label: 'Tipo',
    type: 'select',
    options: [], // Populated in buildExpedientesFilterOptions
  },
  {
    id: 'semTipo',
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
    id: 'prazoVencido',
    label: 'Status de Prazo',
    type: 'select',
    options: [
      { value: 'all', label: 'Todos' },
      { value: 'false', label: 'No Prazo' },
      { value: 'true', label: 'Prazo Vencido' },
    ],
  },
  {
    id: 'segredoJustica',
    label: 'Segredo de Justiça',
    type: 'boolean',
  },
  {
    id: 'juizoDigital',
    label: 'Juízo Digital',
    type: 'boolean',
  },
  {
    id: 'semResponsavel',
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
      if (config.id === 'responsavelId' && usuarios) {
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
      } else if (config.id === 'tipoExpedienteId' && tiposExpedientes) {
        // Build options for Tipo de Expediente
        for (const tipo of tiposExpedientes) {
          options.push({
            value: `${config.id}_${tipo.id}`,
            label: `${config.label}: ${tipo.tipoExpediente}`,
            searchText: tipo.tipoExpediente,
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
        if (config.id === 'responsavelId' && usuariosList) {
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
        } else if (config.id === 'tipoExpedienteId' && tiposList) {
          for (const tipo of tiposList) {
            options.push({
              value: `${config.id}_${tipo.id}`,
              label: tipo.tipoExpediente, // Sem prefixo
              searchText: tipo.tipoExpediente,
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
        configMap.get('prazoVencido')!,
      ]),
    },
    {
      label: 'Responsável',
      options: buildOptionsWithoutPrefix([configMap.get('responsavelId')!], usuarios),
    },
    {
      label: 'Tipo',
      options: buildOptionsWithoutPrefix(
        [configMap.get('tipoExpedienteId')!, configMap.get('semTipo')!],
        undefined,
        tiposExpedientes
      ),
    },
    {
      label: 'Características',
      options: buildOptionsWithoutPrefix([
        configMap.get('segredoJustica')!,
        configMap.get('juizoDigital')!,
        configMap.get('semResponsavel')!,
      ]),
    },
  ];
}

export function parseExpedientesFilters(selectedFilters: string[]): ExpedientesFilters {
  const filters: ExpedientesFilters = {};
  const configMap = new Map(EXPEDIENTES_FILTER_CONFIGS.map(c => [c.id, c]));

  for (const selected of selectedFilters) {
    if (selected.includes('_')) {
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
        if (id === 'trt') {
          if (value !== 'all') {
            filters.trt = value as CodigoTribunal;
          }
        } else if (id === 'grau') {
          if (value !== 'all') {
            filters.grau = value as GrauTribunal;
          }
        } else if (id === 'responsavelId') {
          if (value === 'all') {
            // ignore
          } else if (value === 'null') {
            filters.responsavelId = 'null';
          } else {
            const num = parseInt(value, 10);
            if (!isNaN(num)) {
              filters.responsavelId = num;
            }
          }
        } else if (id === 'tipoExpedienteId') {
          const num = parseInt(value, 10);
          if (!isNaN(num)) {
            filters.tipoExpedienteId = num;
          }
        } else if (id === 'baixado') {
          if (value === 'all') {
            // ignore
          } else {
            filters.baixado = value === 'true';
          }
        } else if (id === 'prazoVencido') {
          if (value === 'all') {
            // ignore
          } else {
            filters.prazoVencido = value === 'true';
          }
        }
      }
    } else {
      const config = configMap.get(selected);
      if (config && config.type === 'boolean') {
        if (selected === 'segredoJustica') {
          filters.segredoJustica = true;
        } else if (selected === 'juizoDigital') {
          filters.juizoDigital = true;
        } else if (selected === 'semResponsavel') {
          filters.semResponsavel = true;
        } else if (selected === 'semTipo') {
          filters.semTipo = true;
        }
      }
    }
  }

  return filters;
}
