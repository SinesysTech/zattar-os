'use client';

/**
 * CopilotKit Actions - Expedientes
 *
 * Ações para busca, filtro e manipulação de expedientes/intimações
 */

import { useCopilotAction } from '@copilotkit/react-core';
import { useRouter } from 'next/navigation';

import type { FiltrosExpediente } from './types';

interface UseExpedientesActionsProps {
  /** Função para aplicar filtros na listagem */
  onFiltrar?: (filtros: FiltrosExpediente) => void;
  /** Função para limpar filtros */
  onLimparFiltros?: () => void;
  /** Função para abrir dialog de baixa */
  onAbrirDialogBaixa?: (expedienteId: number) => void;
  /** Função para refetch dos dados */
  refetch?: () => void;
}

/**
 * Hook para registrar ações de expedientes
 */
export function useExpedientesActions(props?: UseExpedientesActionsProps) {
  const router = useRouter();
  const { onFiltrar, onLimparFiltros, onAbrirDialogBaixa, refetch } = props || {};

  // Ação: Filtrar expedientes
  useCopilotAction({
    name: 'filtrarExpedientes',
    description:
      'Aplica filtros na listagem de expedientes/intimações. Pode filtrar por tipo, status, responsável ou período.',
    parameters: [
      {
        name: 'tipo',
        type: 'string',
        description: 'Tipo do expediente (intimação, citação, notificação, etc.)',
        required: false,
      },
      {
        name: 'status',
        type: 'string',
        description: 'Status: pendente, baixado, vencido',
        required: false,
      },
      {
        name: 'responsavel',
        type: 'string',
        description: 'Nome do responsável pelo expediente',
        required: false,
      },
      {
        name: 'dataInicio',
        type: 'string',
        description: 'Data inicial do período (formato: YYYY-MM-DD)',
        required: false,
      },
      {
        name: 'dataFim',
        type: 'string',
        description: 'Data final do período (formato: YYYY-MM-DD)',
        required: false,
      },
    ],
    handler: async (filtros: Record<string, string | undefined>) => {
      const filtrosLimpos: FiltrosExpediente = Object.fromEntries(
        Object.entries(filtros).filter(([, v]) => v !== undefined && v !== '')
      );

      if (Object.keys(filtrosLimpos).length === 0) {
        return 'Nenhum filtro especificado. Informe pelo menos um critério.';
      }

      if (onFiltrar) {
        onFiltrar(filtrosLimpos);
        refetch?.();
        return `Filtros de expedientes aplicados: ${Object.entries(filtrosLimpos)
          .map(([k, v]) => `${k}=${v}`)
          .join(', ')}`;
      }

      const params = new URLSearchParams();
      Object.entries(filtrosLimpos).forEach(([key, value]) => {
        if (value) params.set(key, String(value));
      });

      router.push(`/expedientes/lista?${params.toString()}`);
      return 'Navegando para expedientes com filtros';
    },
  });

  // Ação: Expedientes pendentes
  useCopilotAction({
    name: 'expedientesPendentes',
    description: 'Lista expedientes que estão pendentes de baixa/conclusão',
    parameters: [],
    handler: async () => {
      if (onFiltrar) {
        onFiltrar({ status: 'pendente' });
        refetch?.();
        return 'Filtrando expedientes pendentes';
      }

      router.push('/expedientes/lista?status=pendente');
      return 'Filtrando expedientes pendentes';
    },
  });

  // Ação: Expedientes vencidos
  useCopilotAction({
    name: 'expedientesVencidos',
    description: 'Lista expedientes com prazo vencido que precisam de atenção urgente',
    parameters: [],
    handler: async () => {
      if (onFiltrar) {
        onFiltrar({ status: 'vencido' });
        refetch?.();
        return 'Filtrando expedientes vencidos';
      }

      router.push('/expedientes/lista?status=vencido');
      return 'Filtrando expedientes vencidos - ATENÇÃO: prazos vencidos!';
    },
  });

  // Ação: Baixar expediente
  useCopilotAction({
    name: 'baixarExpediente',
    description:
      'Inicia o processo de baixa/conclusão de um expediente. Abre o diálogo de confirmação.',
    parameters: [
      {
        name: 'expedienteId',
        type: 'number',
        description: 'ID do expediente a ser baixado',
        required: true,
      },
    ],
    handler: async ({ expedienteId }: { expedienteId: number }) => {
      if (!expedienteId || expedienteId <= 0) {
        return 'ID do expediente inválido';
      }

      if (onAbrirDialogBaixa) {
        onAbrirDialogBaixa(expedienteId);
        return `Abrindo diálogo de baixa para expediente #${expedienteId}`;
      }

      // Se não tiver callback, navega para a página com o dialog aberto
      router.push(`/expedientes/lista?baixar=${expedienteId}`);
      return `Navegando para baixar expediente #${expedienteId}`;
    },
  });

  // Ação: Limpar filtros de expedientes
  useCopilotAction({
    name: 'limparFiltrosExpedientes',
    description: 'Remove todos os filtros aplicados na listagem de expedientes',
    parameters: [],
    handler: async () => {
      if (onLimparFiltros) {
        onLimparFiltros();
        refetch?.();
        return 'Filtros de expedientes removidos';
      }

      router.push('/expedientes/lista');
      return 'Filtros de expedientes removidos';
    },
  });

  // Ação: Ver detalhes do expediente
  useCopilotAction({
    name: 'verDetalheExpediente',
    description: 'Abre os detalhes de um expediente específico',
    parameters: [
      {
        name: 'expedienteId',
        type: 'number',
        description: 'ID do expediente no sistema',
        required: true,
      },
    ],
    handler: async ({ expedienteId }: { expedienteId: number }) => {
      if (!expedienteId || expedienteId <= 0) {
        return 'ID do expediente inválido';
      }

      router.push(`/expedientes/lista?detalhe=${expedienteId}`);
      return `Abrindo detalhes do expediente #${expedienteId}`;
    },
  });

  // Ação: Expedientes sem responsável
  useCopilotAction({
    name: 'expedientesSemResponsavel',
    description: 'Lista expedientes que não possuem responsável atribuído',
    parameters: [],
    handler: async () => {
      if (onFiltrar) {
        onFiltrar({ responsavel: 'sem_responsavel' });
        refetch?.();
        return 'Filtrando expedientes sem responsável';
      }

      router.push('/expedientes/lista?sem_responsavel=true');
      return 'Filtrando expedientes sem responsável';
    },
  });

  // Ação: Ver expedientes por período
  useCopilotAction({
    name: 'expedientesPeriodo',
    description: 'Mostra expedientes em uma visualização de período específica',
    parameters: [
      {
        name: 'visualizacao',
        type: 'string',
        description: 'Tipo de visualização: semana, mes, ano ou lista',
        required: true,
      },
    ],
    handler: async ({ visualizacao }: { visualizacao: string }) => {
      const visualizacoesValidas = ['semana', 'mes', 'ano', 'lista'];

      if (!visualizacoesValidas.includes(visualizacao)) {
        return `Visualização "${visualizacao}" inválida. Use: ${visualizacoesValidas.join(', ')}`;
      }

      router.push(`/expedientes/${visualizacao}`);
      return `Mostrando expedientes na visualização: ${visualizacao}`;
    },
  });
}
