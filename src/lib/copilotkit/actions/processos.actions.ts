'use client';

/**
 * CopilotKit Actions - Processos
 *
 * Ações para busca, filtro e manipulação de processos judiciais
 */

import { useCopilotAction } from '@copilotkit/react-core';
import { useRouter } from 'next/navigation';

import type { FiltrosProcesso, GrauProcessual } from './types';

interface UseProcessosActionsProps {
  /** Função para aplicar filtros na listagem */
  onFiltrar?: (filtros: FiltrosProcesso) => void;
  /** Função para limpar filtros */
  onLimparFiltros?: () => void;
  /** Função para buscar processo por número */
  onBuscar?: (termo: string) => void;
  /** Função para refetch dos dados */
  refetch?: () => void;
}

/**
 * Hook para registrar ações de processos
 */
export function useProcessosActions(props?: UseProcessosActionsProps) {
  const router = useRouter();
  const { onFiltrar, onLimparFiltros, onBuscar, refetch } = props || {};

  // Ação: Filtrar processos
  useCopilotAction({
    name: 'filtrarProcessos',
    description:
      'Aplica filtros na listagem de processos judiciais. Pode filtrar por tribunal, grau, status, partes envolvidas ou responsável.',
    parameters: [
      {
        name: 'tribunal',
        type: 'string',
        description:
          'Tribunal Regional do Trabalho (TRT1 a TRT24) ou TST. Exemplo: TRT3, TRT15, TST',
        required: false,
      },
      {
        name: 'grau',
        type: 'string',
        description: 'Grau processual: primeiro, segundo ou superior',
        required: false,
      },
      {
        name: 'status',
        type: 'string',
        description: 'Status do processo (ativo, arquivado, suspenso, etc.)',
        required: false,
      },
      {
        name: 'parteAutora',
        type: 'string',
        description: 'Nome ou parte do nome da parte autora (reclamante)',
        required: false,
      },
      {
        name: 'parteRe',
        type: 'string',
        description: 'Nome ou parte do nome da parte ré (reclamada)',
        required: false,
      },
      {
        name: 'responsavel',
        type: 'string',
        description: 'Nome do advogado/usuário responsável pelo processo',
        required: false,
      },
    ],
    handler: async (filtros: Record<string, string | undefined>) => {
      // Remove campos undefined/vazios
      const filtrosLimpos: FiltrosProcesso = Object.fromEntries(
        Object.entries(filtros).filter(([, v]) => v !== undefined && v !== '')
      );

      if (Object.keys(filtrosLimpos).length === 0) {
        return 'Nenhum filtro especificado. Informe pelo menos um critério de filtro.';
      }

      if (onFiltrar) {
        onFiltrar(filtrosLimpos);
        refetch?.();
        return `Filtros aplicados: ${Object.entries(filtrosLimpos)
          .map(([k, v]) => `${k}=${v}`)
          .join(', ')}`;
      }

      // Se não tiver callback, navega com query params
      const params = new URLSearchParams();
      Object.entries(filtrosLimpos).forEach(([key, value]) => {
        if (value) params.set(key, String(value));
      });

      router.push(`/processos?${params.toString()}`);
      return `Navegando para processos com filtros: ${params.toString()}`;
    },
  });

  // Ação: Buscar processo por número
  useCopilotAction({
    name: 'buscarProcesso',
    description:
      'Busca um processo específico pelo número do processo (CNJ). Formato: 0001234-56.2024.5.03.0001',
    parameters: [
      {
        name: 'numero',
        type: 'string',
        description:
          'Número do processo no formato CNJ (ex: 0001234-56.2024.5.03.0001) ou parcial',
        required: true,
      },
    ],
    handler: async ({ numero }: { numero: string }) => {
      if (!numero || numero.trim().length < 5) {
        return 'Número do processo muito curto. Informe pelo menos 5 caracteres.';
      }

      if (onBuscar) {
        onBuscar(numero.trim());
        return `Buscando processo: ${numero}`;
      }

      // Se não tiver callback, navega com busca
      router.push(`/processos?busca=${encodeURIComponent(numero.trim())}`);
      return `Buscando processo: ${numero}`;
    },
  });

  // Ação: Limpar filtros
  useCopilotAction({
    name: 'limparFiltrosProcessos',
    description: 'Remove todos os filtros aplicados na listagem de processos',
    parameters: [],
    handler: async () => {
      if (onLimparFiltros) {
        onLimparFiltros();
        refetch?.();
        return 'Filtros de processos removidos';
      }

      router.push('/processos');
      return 'Filtros de processos removidos';
    },
  });

  // Ação: Ver detalhes do processo
  useCopilotAction({
    name: 'verDetalheProcesso',
    description:
      'Abre a página de detalhes de um processo específico, mostrando timeline e informações completas',
    parameters: [
      {
        name: 'processoId',
        type: 'number',
        description: 'ID do processo no sistema',
        required: true,
      },
    ],
    handler: async ({ processoId }: { processoId: number }) => {
      if (!processoId || processoId <= 0) {
        return 'ID do processo inválido';
      }

      router.push(`/processos/${processoId}`);
      return `Abrindo detalhes do processo #${processoId}`;
    },
  });

  // Ação: Filtrar por tribunal específico
  useCopilotAction({
    name: 'filtrarPorTribunal',
    description:
      'Filtra processos de um tribunal específico (TRT1 a TRT24 ou TST)',
    parameters: [
      {
        name: 'tribunal',
        type: 'string',
        description: 'Código do tribunal: TRT1, TRT2, ..., TRT24 ou TST',
        required: true,
      },
    ],
    handler: async ({ tribunal }: { tribunal: string }) => {
      const tribunalUpper = tribunal.toUpperCase();
      const tribunaisValidos = [
        ...Array.from({ length: 24 }, (_, i) => `TRT${i + 1}`),
        'TST',
      ];

      if (!tribunaisValidos.includes(tribunalUpper)) {
        return `Tribunal "${tribunal}" inválido. Use TRT1 a TRT24 ou TST.`;
      }

      if (onFiltrar) {
        onFiltrar({ tribunal: tribunalUpper });
        refetch?.();
        return `Filtrando processos do ${tribunalUpper}`;
      }

      router.push(`/processos?tribunal=${tribunalUpper}`);
      return `Filtrando processos do ${tribunalUpper}`;
    },
  });

  // Ação: Filtrar processos sem responsável
  useCopilotAction({
    name: 'processsosSemResponsavel',
    description: 'Lista processos que não possuem responsável atribuído',
    parameters: [],
    handler: async () => {
      if (onFiltrar) {
        onFiltrar({ responsavel: 'sem_responsavel' });
        refetch?.();
        return 'Filtrando processos sem responsável';
      }

      router.push('/processos?sem_responsavel=true');
      return 'Filtrando processos sem responsável';
    },
  });
}
