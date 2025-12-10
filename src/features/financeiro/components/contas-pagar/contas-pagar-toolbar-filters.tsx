/**
 * Filtros e opções para toolbar de Contas a Pagar
 */

import {
  FilterConfig,
  buildFilterOptions,
} from '@/components/ui/table-toolbar-filter-config';
import type { FilterGroup, ComboboxOption } from '@/components/ui/table-toolbar';
import type { ContasPagarFilters, StatusContaPagar } from '../../types/lancamentos';

// ============================================================================
// Configuração de Filtros
// ============================================================================

export const CONTAS_PAGAR_FILTER_CONFIGS: FilterConfig[] = [
  {
    id: 'status',
    label: 'Status',
    type: 'select',
    options: [
      { value: 'pendente', label: 'Pendente' },
      { value: 'confirmado', label: 'Pago' },
      { value: 'cancelado', label: 'Cancelado' },
      { value: 'estornado', label: 'Estornado' },
    ],
    searchText: 'status pendente pago cancelado estornado',
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
    searchText: 'vencimento vencidas hoje proximos dias',
  },
  {
    id: 'categoria',
    label: 'Categoria',
    type: 'select',
    options: [
      { value: 'aluguel', label: 'Aluguel' },
      { value: 'salarios', label: 'Salários' },
      { value: 'impostos', label: 'Impostos' },
      { value: 'custas_processuais', label: 'Custas Processuais' },
      { value: 'servicos', label: 'Serviços' },
      { value: 'outros', label: 'Outros' },
    ],
    searchText: 'categoria aluguel salarios impostos custas servicos outros',
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
export function buildContasPagarFilterOptions(): ReturnType<typeof buildFilterOptions> {
  return buildFilterOptions(CONTAS_PAGAR_FILTER_CONFIGS);
}

/**
 * Constrói os grupos de filtros para exibição agrupada
 */
export function buildContasPagarFilterGroups(): FilterGroup[] {
  const configMap = new Map(CONTAS_PAGAR_FILTER_CONFIGS.map((c) => [c.id, c]));

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
export function parseContasPagarFilters(selectedIds: string[]): ContasPagarFilters & {
  dataVencimentoInicio?: string;
  dataVencimentoFim?: string;
} {
  const filtros: ContasPagarFilters & {
    dataVencimentoInicio?: string;
    dataVencimentoFim?: string;
  } = {};

  const hoje = new Date();
  const hojeStr = hoje.toISOString().split('T')[0];

  // Coletar status selecionados
  const statusSelecionados: StatusContaPagar[] = [];

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
    if (id === 'categoria_aluguel') {
      filtros.categoria = 'aluguel';
    } else if (id === 'categoria_salarios') {
      filtros.categoria = 'salarios';
    } else if (id === 'categoria_impostos') {
      filtros.categoria = 'impostos';
    } else if (id === 'categoria_custas_processuais') {
      filtros.categoria = 'custas_processuais';
    } else if (id === 'categoria_servicos') {
      filtros.categoria = 'servicos';
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
export function filtersToSelectedIds(filtros: ContasPagarFilters): string[] {
  const ids: string[] = [];

  // Status
  // @ts-ignore
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
