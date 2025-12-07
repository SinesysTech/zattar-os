'use client';

/**
 * CopilotKit Actions - Workflow
 *
 * Ações para atribuição de responsáveis, pagamentos e outras operações de workflow
 */

import { useCopilotAction } from '@copilotkit/react-core';

import type { TipoEntidade } from './types';

interface Usuario {
  id: number;
  nome: string;
  email: string;
}

interface UseWorkflowActionsProps {
  /** Lista de usuários disponíveis para atribuição */
  usuarios?: Usuario[];
  /** Função para atribuir responsável */
  onAtribuirResponsavel?: (tipo: TipoEntidade, id: number, usuarioId: number) => Promise<void>;
  /** Função para abrir dialog de pagamento */
  onAbrirDialogPagamento?: (obrigacaoId: number, parcelaId?: number) => void;
  /** Função para refetch dos dados */
  refetch?: () => void;
}

/**
 * Hook para registrar ações de workflow
 */
export function useWorkflowActions(props?: UseWorkflowActionsProps) {
  const { usuarios, onAtribuirResponsavel, onAbrirDialogPagamento, refetch } = props || {};

  // Ação: Atribuir responsável
  useCopilotAction({
    name: 'atribuirResponsavel',
    description:
      'Atribui um responsável (advogado/usuário) a um processo, audiência ou expediente',
    parameters: [
      {
        name: 'tipo',
        type: 'string',
        description: 'Tipo de entidade: processo, audiencia ou expediente',
        required: true,
      },
      {
        name: 'id',
        type: 'number',
        description: 'ID do registro (processo, audiência ou expediente)',
        required: true,
      },
      {
        name: 'responsavel',
        type: 'string',
        description: 'Nome ou email do usuário a ser atribuído como responsável',
        required: true,
      },
    ],
    handler: async ({
      tipo,
      id,
      responsavel,
    }: {
      tipo: string;
      id: number;
      responsavel: string;
    }) => {
      const tiposValidos: TipoEntidade[] = ['processo', 'audiencia', 'expediente'];

      if (!tiposValidos.includes(tipo as TipoEntidade)) {
        return `Tipo "${tipo}" inválido. Use: ${tiposValidos.join(', ')}`;
      }

      if (!id || id <= 0) {
        return 'ID inválido';
      }

      if (!responsavel || responsavel.trim().length < 2) {
        return 'Nome do responsável muito curto';
      }

      // Busca usuário na lista disponível
      if (usuarios && usuarios.length > 0) {
        const usuarioEncontrado = usuarios.find(
          (u) =>
            u.nome.toLowerCase().includes(responsavel.toLowerCase()) ||
            u.email.toLowerCase().includes(responsavel.toLowerCase())
        );

        if (!usuarioEncontrado) {
          const nomesDisponiveis = usuarios.slice(0, 5).map((u) => u.nome).join(', ');
          return `Usuário "${responsavel}" não encontrado. Alguns disponíveis: ${nomesDisponiveis}...`;
        }

        if (onAtribuirResponsavel) {
          await onAtribuirResponsavel(tipo as TipoEntidade, id, usuarioEncontrado.id);
          refetch?.();
          return `${tipo} #${id} atribuído para ${usuarioEncontrado.nome}`;
        }
      }

      // Fallback: tenta via API diretamente
      try {
        const endpoint = `/api/${tipo}s/${id}/responsavel`;
        const response = await fetch(endpoint, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ responsavel_nome: responsavel }),
        });

        if (!response.ok) {
          const error = await response.json();
          return `Erro ao atribuir: ${error.message || 'Falha na requisição'}`;
        }

        refetch?.();
        return `${tipo} #${id} atribuído para ${responsavel}`;
      } catch (error) {
        return `Erro ao atribuir responsável: ${error instanceof Error ? error.message : 'Erro desconhecido'}`;
      }
    },
  });

  // Ação: Registrar pagamento
  useCopilotAction({
    name: 'registrarPagamento',
    description:
      'Inicia o registro de pagamento/recebimento de uma obrigação (acordo ou condenação). Abre o diálogo de confirmação.',
    parameters: [
      {
        name: 'obrigacaoId',
        type: 'number',
        description: 'ID da obrigação (acordo/condenação)',
        required: true,
      },
      {
        name: 'parcelaId',
        type: 'number',
        description: 'ID da parcela específica (opcional, se for parcelado)',
        required: false,
      },
    ],
    handler: async ({
      obrigacaoId,
      parcelaId,
    }: {
      obrigacaoId: number;
      parcelaId?: number;
    }) => {
      if (!obrigacaoId || obrigacaoId <= 0) {
        return 'ID da obrigação inválido';
      }

      if (onAbrirDialogPagamento) {
        onAbrirDialogPagamento(obrigacaoId, parcelaId);
        return parcelaId
          ? `Abrindo registro de pagamento da parcela #${parcelaId} da obrigação #${obrigacaoId}`
          : `Abrindo registro de pagamento da obrigação #${obrigacaoId}`;
      }

      return 'Função de pagamento não disponível nesta página. Navegue para Acordos e Condenações.';
    },
  });

  // Ação: Remover responsável
  useCopilotAction({
    name: 'removerResponsavel',
    description: 'Remove o responsável atribuído a um processo, audiência ou expediente',
    parameters: [
      {
        name: 'tipo',
        type: 'string',
        description: 'Tipo de entidade: processo, audiencia ou expediente',
        required: true,
      },
      {
        name: 'id',
        type: 'number',
        description: 'ID do registro',
        required: true,
      },
    ],
    handler: async ({ tipo, id }: { tipo: string; id: number }) => {
      const tiposValidos: TipoEntidade[] = ['processo', 'audiencia', 'expediente'];

      if (!tiposValidos.includes(tipo as TipoEntidade)) {
        return `Tipo "${tipo}" inválido. Use: ${tiposValidos.join(', ')}`;
      }

      if (!id || id <= 0) {
        return 'ID inválido';
      }

      try {
        const endpoint = `/api/${tipo}s/${id}/responsavel`;
        const response = await fetch(endpoint, {
          method: 'DELETE',
        });

        if (!response.ok) {
          const error = await response.json();
          return `Erro ao remover responsável: ${error.message || 'Falha na requisição'}`;
        }

        refetch?.();
        return `Responsável removido do ${tipo} #${id}`;
      } catch (error) {
        return `Erro ao remover responsável: ${error instanceof Error ? error.message : 'Erro desconhecido'}`;
      }
    },
  });

  // Ação: Listar usuários disponíveis
  useCopilotAction({
    name: 'listarResponsaveisDisponiveis',
    description: 'Lista os usuários/advogados disponíveis para atribuição',
    parameters: [],
    handler: async () => {
      if (usuarios && usuarios.length > 0) {
        const lista = usuarios
          .slice(0, 10)
          .map((u) => `- ${u.nome} (${u.email})`)
          .join('\n');

        return `Usuários disponíveis:\n${lista}${usuarios.length > 10 ? `\n... e mais ${usuarios.length - 10}` : ''}`;
      }

      return 'Lista de usuários não disponível. Carregue a página de usuários primeiro.';
    },
  });
}
