/**
 * Filtros e opções para toolbar de Contas a Receber
 */

import {
  FilterConfig,
  buildFilterOptions,
} from '@/components/ui/table-toolbar-filter-config';
import type { FilterGroup, ComboboxOption } from '@/components/ui/table-toolbar';
import type { ContasReceberFilters, StatusContaReceber } from '@/backend/types/financeiro/contas-receber.types';

// ============================================================================
// Configuração de Filtros
// ============================================================================

export const CONTAS_RECEBER_FILTER_CONFIGS: FilterConfig[] = [
  {
    id: 'status',
    label: 'Status',
    type: 'select',
    options: [
      { value: 'pendente', label: 'Pendente' },
      { value: 'confirmado', label: 'Recebido' },
      { value: 'cancelado', label: 'Cancelado' },
      { value: 'estornado', label: 'Estornado' },
    ],
    searchText: 'status pendente recebido cancelado estornado',
  },
  {
    id: 'vencimento',
    label: 'Vencimento',
    type: 'select',
    options: [
      { value: 'vencidas', label: 'Vencidas' },
      { value: 'hoje', label: 'Vencem hoje' },
      { value: '7dias', label: 'Próximos 7 dias' },
      { value: '30dias', label: 'Próximos 30 dias' },
    ],
    searchText: 'vencimento vencidas hoje proximos dias inadimplencia',
  },
  {
    id: 'categoria',
    label: 'Categoria',
    type: 'select',
    options: [
      { value: 'honorarios_contratuais', label: 'Honorários Contratuais' },
      { value: 'honorarios_sucumbenciais', label: 'Honorários Sucumbenciais' },
      { value: 'honorarios_exito', label: 'Honorários de Êxito' },
      { value: 'consultoria', label: 'Consultoria' },
      { value: 'assessoria', label: 'Assessoria' },
      { value: 'outros', label: 'Outros' },
    ],
    searchText: 'categoria honorarios contratuais sucumbenciais exito consultoria assessoria outros',
  },
  {
    id: 'origem',
    label: 'Origem',
    type: 'select',
    options: [
      { value: 'manual', label: 'Manual' },
      { value: 'acordo_judicial', label: 'Acordo Judicial' },
      { value: 'contrato', label: 'Contrato' },
      { value: 'importacao_bancaria', label: 'Importação Bancária' },
      { value: 'recorrente', label: 'Recorrente' },
    ],
    searchText: 'origem manual acordo judicial contrato importacao bancaria recorrente',
  },
  {
    id: 'tipo',
    label: 'Tipo',
    type: 'select',
    options: [
      { value: 'recorrente', label: 'Recorrentes' },
      { value: 'avulsa', label: 'Avulsas' },
    ],
    searchText: 'tipo recorrente avulsa',
  },
];

// ============================================================================
// Funções de Construção
// ============================================================================

/**
 * Constrói as opções de filtro para combobox
 */
export function buildContasReceberFilterOptions(): ReturnType<typeof buildFilterOptions> {
  return buildFilterOptions(CONTAS_RECEBER_FILTER_CONFIGS);
}

/**
 * Constrói os grupos de filtros para exibição agrupada
 */
export function buildContasReceberFilterGroups(): FilterGroup[] {
  const configMap = new Map(CONTAS_RECEBER_FILTER_CONFIGS.map((c) => [c.id, c]));

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
      label: 'Status',
      options: buildOptionsWithoutPrefix([configMap.get('status')!]),
    },
    {
      label: 'Vencimento',
      options: buildOptionsWithoutPrefix([configMap.get('vencimento')!]),
    },
    {
      label: 'Categoria',
      options: buildOptionsWithoutPrefix([configMap.get('categoria')!]),
    },
    {
      label: 'Origem',
      options: buildOptionsWithoutPrefix([configMap.get('origem')!]),
    },
    {
      label: 'Tipo',
      options: buildOptionsWithoutPrefix([configMap.get('tipo')!]),
    },
  ];
}

// ============================================================================
// Parser de Filtros
// ============================================================================

/**
 * Converte IDs de filtro selecionados para objeto de filtros
 * Usa lógica customizada para tratar vencimentos e status combinados
 */
export function parseContasReceberFilters(selectedIds: string[]): ContasReceberFilters & {
  dataVencimentoInicio?: string;
  dataVencimentoFim?: string;
} {
  const filtros: ContasReceberFilters & {
    dataVencimentoInicio?: string;
    dataVencimentoFim?: string;
  } = {};

  const hoje = new Date();
  const hojeStr = hoje.toISOString().split('T')[0];

  // Coletar status selecionados
  const statusSelecionados: StatusContaReceber[] = [];

  for (const id of selectedIds) {
    // Status
    if (id === 'status_pendente') {
      statusSelecionados.push('pendente');
    } else if (id === 'status_confirmado') {
      statusSelecionados.push('confirmado');
    } else if (id === 'status_cancelado') {
      statusSelecionados.push('cancelado');
    } else if (id === 'status_estornado') {
      statusSelecionados.push('estornado');
    }

    // Vencimento
    if (id === 'vencimento_vencidas') {
      const ontem = new Date(hoje);
      ontem.setDate(ontem.getDate() - 1);
      filtros.dataVencimentoFim = ontem.toISOString().split('T')[0];
      // Se não tem status específico, filtra apenas pendentes
      if (!statusSelecionados.includes('pendente')) {
        statusSelecionados.push('pendente');
      }
    } else if (id === 'vencimento_hoje') {
      filtros.dataVencimentoInicio = hojeStr;
      filtros.dataVencimentoFim = hojeStr;
    } else if (id === 'vencimento_7dias') {
      const em7dias = new Date(hoje);
      em7dias.setDate(em7dias.getDate() + 7);
      filtros.dataVencimentoInicio = hojeStr;
      filtros.dataVencimentoFim = em7dias.toISOString().split('T')[0];
    } else if (id === 'vencimento_30dias') {
      const em30dias = new Date(hoje);
      em30dias.setDate(em30dias.getDate() + 30);
      filtros.dataVencimentoInicio = hojeStr;
      filtros.dataVencimentoFim = em30dias.toISOString().split('T')[0];
    }

    // Categoria
    if (id === 'categoria_honorarios_contratuais') {
      filtros.categoria = 'honorarios_contratuais';
    } else if (id === 'categoria_honorarios_sucumbenciais') {
      filtros.categoria = 'honorarios_sucumbenciais';
    } else if (id === 'categoria_honorarios_exito') {
      filtros.categoria = 'honorarios_exito';
    } else if (id === 'categoria_consultoria') {
      filtros.categoria = 'consultoria';
    } else if (id === 'categoria_assessoria') {
      filtros.categoria = 'assessoria';
    } else if (id === 'categoria_outros') {
      filtros.categoria = 'outros';
    }

    // Tipo (recorrente)
    if (id === 'tipo_recorrente') {
      filtros.recorrente = true;
    } else if (id === 'tipo_avulsa') {
      filtros.recorrente = false;
    }
  }

  // Atribuir status
  if (statusSelecionados.length === 1) {
    filtros.status = statusSelecionados[0];
  } else if (statusSelecionados.length > 1) {
    filtros.status = statusSelecionados;
  }

  return filtros;
}

/**
 * Converte filtros para IDs selecionados (inverso do parse)
 */
export function filtersToSelectedIds(filtros: ContasReceberFilters): string[] {
  const ids: string[] = [];

  // Status
  if (filtros.status) {
    if (Array.isArray(filtros.status)) {
      filtros.status.forEach((s) => ids.push(`status_${s}`));
    } else {
      ids.push(`status_${filtros.status}`);
    }
  }

  // Categoria
  if (filtros.categoria) {
    ids.push(`categoria_${filtros.categoria}`);
  }

  // Recorrência
  if (filtros.recorrente !== undefined) {
    ids.push(filtros.recorrente ? 'tipo_recorrente' : 'tipo_avulsa');
  }

  return ids;
}
