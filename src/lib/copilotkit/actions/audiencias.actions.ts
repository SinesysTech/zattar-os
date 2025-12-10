'use client';

/**
 * CopilotKit Actions - Audiências
 *
 * Ações para busca, filtro e manipulação de audiências
 */

import { useCopilotAction } from '@copilotkit/react-core';
import { useRouter } from 'next/navigation';

import type {
  FiltrosAudiencia,
  ModalidadeAudiencia,
  StatusAudiencia,
  VisualizacaoPeriodo,
} from './types';

interface UseAudienciasActionsProps {
  /** Função para aplicar filtros na listagem */
  onFiltrar?: (filtros: FiltrosAudiencia) => void;
  /** Função para limpar filtros */
  onLimparFiltros?: () => void;
  /** Função para refetch dos dados */
  refetch?: () => void;
  /** Dados das próximas audiências (para exibição) */
  proximasAudiencias?: Array<{
    id: number;
    data: string;
    hora: string;
    tipo: string;
    processo: string;
    modalidade: string;
  }>;
}

/**
 * Hook para registrar ações de audiências
 */
export function useAudienciasActions(props?: UseAudienciasActionsProps) {
  const router = useRouter();
  const { onFiltrar, onLimparFiltros, refetch, proximasAudiencias } = props || {};

  // Ação: Filtrar audiências
  useCopilotAction({
    name: 'filtrarAudiencias',
    description:
      'Aplica filtros na listagem de audiências. Pode filtrar por período, tribunal, status, modalidade ou responsável.',
    parameters: [
      {
        name: 'periodo',
        type: 'string',
        description: 'Período: hoje, semana, mes ou ano',
        required: false,
      },
      {
        name: 'tribunal',
        type: 'string',
        description: 'Tribunal (TRT1 a TRT24 ou TST)',
        required: false,
      },
      {
        name: 'status',
        type: 'string',
        description: 'Status: marcada, realizada, cancelada ou adiada',
        required: false,
      },
      {
        name: 'modalidade',
        type: 'string',
        description: 'Modalidade: virtual, presencial ou hibrida',
        required: false,
      },
      {
        name: 'responsavel',
        type: 'string',
        description: 'Nome do responsável pela audiência',
        required: false,
      },
    ],
    handler: async (filtros: Record<string, string | undefined>) => {
      const filtrosLimpos: FiltrosAudiencia = Object.fromEntries(
        Object.entries(filtros).filter(([, v]) => v !== undefined && v !== '')
      );

      if (Object.keys(filtrosLimpos).length === 0) {
        return 'Nenhum filtro especificado. Informe pelo menos um critério.';
      }

      // Validar status
      if (filtrosLimpos.status) {
        const statusValidos: StatusAudiencia[] = ['marcada', 'realizada', 'cancelada', 'adiada'];
        if (!statusValidos.includes(filtrosLimpos.status)) {
          return `Status "${filtrosLimpos.status}" inválido. Use: ${statusValidos.join(', ')}`;
        }
      }

      // Validar modalidade
      if (filtrosLimpos.modalidade) {
        const modalidadesValidas: ModalidadeAudiencia[] = ['virtual', 'presencial', 'hibrida'];
        if (!modalidadesValidas.includes(filtrosLimpos.modalidade)) {
          return `Modalidade "${filtrosLimpos.modalidade}" inválida. Use: ${modalidadesValidas.join(', ')}`;
        }
      }

      if (onFiltrar) {
        onFiltrar(filtrosLimpos);
        refetch?.();
        return `Filtros de audiências aplicados: ${Object.entries(filtrosLimpos)
          .map(([k, v]) => `${k}=${v}`)
          .join(', ')}`;
      }

      // Navega com query params
      const params = new URLSearchParams();
      Object.entries(filtrosLimpos).forEach(([key, value]) => {
        if (value) params.set(key, String(value));
      });

      const visualizacao = filtrosLimpos.periodo || 'semana';
      router.push(`/audiencias/${visualizacao}?${params.toString()}`);
      return `Navegando para audiências com filtros`;
    },
  });

  // Ação: Ver audiências de hoje
  useCopilotAction({
    name: 'audienciasHoje',
    description: 'Mostra as audiências agendadas para hoje',
    parameters: [],
    handler: async () => {
      if (onFiltrar) {
        onFiltrar({ periodo: 'hoje' });
        refetch?.();
        return 'Filtrando audiências de hoje';
      }

      router.push('/audiencias/semana?periodo=hoje');
      return 'Mostrando audiências de hoje';
    },
  });

  // Ação: Ver audiências da semana
  useCopilotAction({
    name: 'audienciasSemana',
    description: 'Mostra as audiências agendadas para esta semana',
    parameters: [],
    handler: async () => {
      router.push('/audiencias/semana');
      return 'Mostrando audiências da semana';
    },
  });

  // Ação: Filtrar audiências virtuais
  useCopilotAction({
    name: 'audienciasVirtuais',
    description: 'Lista apenas audiências na modalidade virtual/telepresencial',
    parameters: [],
    handler: async () => {
      if (onFiltrar) {
        onFiltrar({ modalidade: 'virtual' });
        refetch?.();
        return 'Filtrando audiências virtuais';
      }

      router.push('/audiencias/semana?modalidade=virtual');
      return 'Filtrando audiências virtuais';
    },
  });

  // Ação: Filtrar audiências presenciais
  useCopilotAction({
    name: 'audienciasPresenciais',
    description: 'Lista apenas audiências na modalidade presencial',
    parameters: [],
    handler: async () => {
      if (onFiltrar) {
        onFiltrar({ modalidade: 'presencial' });
        refetch?.();
        return 'Filtrando audiências presenciais';
      }

      router.push('/audiencias/semana?modalidade=presencial');
      return 'Filtrando audiências presenciais';
    },
  });

  // Ação: Limpar filtros de audiências
  useCopilotAction({
    name: 'limparFiltrosAudiencias',
    description: 'Remove todos os filtros aplicados na listagem de audiências',
    parameters: [],
    handler: async () => {
      if (onLimparFiltros) {
        onLimparFiltros();
        refetch?.();
        return 'Filtros de audiências removidos';
      }

      router.push('/audiencias/semana');
      return 'Filtros de audiências removidos';
    },
  });

  // Ação: Ver detalhes da audiência
  useCopilotAction({
    name: 'verDetalheAudiencia',
    description: 'Abre os detalhes de uma audiência específica',
    parameters: [
      {
        name: 'audienciaId',
        type: 'number',
        description: 'ID da audiência no sistema',
        required: true,
      },
    ],
    handler: async ({ audienciaId }: { audienciaId: number }) => {
      if (!audienciaId || audienciaId <= 0) {
        return 'ID da audiência inválido';
      }

      // Audiências geralmente abrem em modal, mas podemos navegar
      router.push(`/audiencias/semana?detalhe=${audienciaId}`);
      return `Abrindo detalhes da audiência #${audienciaId}`;
    },
  });

  // Ação: Mostrar próximas audiências (com render)
  useCopilotAction({
    name: 'mostrarProximasAudiencias',
    description:
      'Lista as próximas audiências agendadas de forma resumida no chat',
    parameters: [
      {
        name: 'limite',
        type: 'number',
        description: 'Quantidade máxima de audiências a mostrar (padrão: 5)',
        required: false,
      },
    ],
    handler: async ({ limite = 5 }: { limite?: number }) => {
      // Se tiver dados disponíveis, retorna
      if (proximasAudiencias && proximasAudiencias.length > 0) {
        const audienciasLimitadas = proximasAudiencias.slice(0, limite);
        return {
          total: proximasAudiencias.length,
          exibindo: audienciasLimitadas.length,
          audiencias: audienciasLimitadas,
        };
      }

      // Se não tiver, navega para a página
      router.push('/audiencias/semana');
      return `Navegando para ver as próximas audiências`;
    },
  });

  // Ação: Audiências sem responsável
  useCopilotAction({
    name: 'audienciasSemResponsavel',
    description: 'Lista audiências que não possuem responsável atribuído',
    parameters: [],
    handler: async () => {
      if (onFiltrar) {
        onFiltrar({ responsavel: 'sem_responsavel' } as FiltrosAudiencia);
        refetch?.();
        return 'Filtrando audiências sem responsável';
      }

      router.push('/audiencias/semana?sem_responsavel=true');
      return 'Filtrando audiências sem responsável';
    },
  });
}
