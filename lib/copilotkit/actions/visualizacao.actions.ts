'use client';

/**
 * CopilotKit Actions - Visualização
 *
 * Ações para alternar modos de exibição, temas e preferências visuais
 */

import { useCopilotAction } from '@copilotkit/react-core';

import type { ModoExibicao } from './types';

interface UseVisualizacaoActionsProps {
  /** Modo de exibição atual */
  modoAtual?: ModoExibicao;
  /** Função para alterar modo de exibição */
  onMudarModo?: (modo: ModoExibicao) => void;
  /** Função para expandir/colapsar sidebar */
  onToggleSidebar?: () => void;
  /** Função para atualizar dados */
  onRefresh?: () => void;
}

/**
 * Hook para registrar ações de visualização
 */
export function useVisualizacaoActions(props?: UseVisualizacaoActionsProps) {
  const { modoAtual, onMudarModo, onToggleSidebar, onRefresh } = props || {};

  // Ação: Alternar modo de exibição
  useCopilotAction({
    name: 'alternarModoExibicao',
    description:
      'Alterna entre visualização em tabela e cards/grid. Útil para diferentes densidades de informação.',
    parameters: [
      {
        name: 'modo',
        type: 'string',
        description: 'Modo de exibição: tabela ou cards',
        required: true,
      },
    ],
    handler: async ({ modo }: { modo: string }) => {
      const modosValidos: ModoExibicao[] = ['tabela', 'cards'];

      if (!modosValidos.includes(modo as ModoExibicao)) {
        return `Modo "${modo}" inválido. Use: tabela ou cards`;
      }

      if (modo === modoAtual) {
        return `Já está no modo ${modo}`;
      }

      if (onMudarModo) {
        onMudarModo(modo as ModoExibicao);
        // Persiste preferência no localStorage
        if (typeof window !== 'undefined') {
          localStorage.setItem('view-mode', modo);
        }
        return `Modo alterado para ${modo}`;
      }

      // Fallback: apenas salva no localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem('view-mode', modo);
        return `Preferência salva: ${modo}. Recarregue a página para aplicar.`;
      }

      return 'Função de alteração de modo não disponível';
    },
  });

  // Ação: Ver em tabela
  useCopilotAction({
    name: 'verEmTabela',
    description: 'Muda a visualização para o modo tabela (lista detalhada)',
    parameters: [],
    handler: async () => {
      if (modoAtual === 'tabela') {
        return 'Já está no modo tabela';
      }

      if (onMudarModo) {
        onMudarModo('tabela');
        if (typeof window !== 'undefined') {
          localStorage.setItem('view-mode', 'tabela');
        }
        return 'Visualização alterada para tabela';
      }

      return 'Função não disponível nesta página';
    },
  });

  // Ação: Ver em cards
  useCopilotAction({
    name: 'verEmCards',
    description: 'Muda a visualização para o modo cards (grade visual)',
    parameters: [],
    handler: async () => {
      if (modoAtual === 'cards') {
        return 'Já está no modo cards';
      }

      if (onMudarModo) {
        onMudarModo('cards');
        if (typeof window !== 'undefined') {
          localStorage.setItem('view-mode', 'cards');
        }
        return 'Visualização alterada para cards';
      }

      return 'Função não disponível nesta página';
    },
  });

  // Ação: Toggle sidebar
  useCopilotAction({
    name: 'toggleSidebar',
    description: 'Expande ou colapsa a barra lateral de navegação',
    parameters: [],
    handler: async () => {
      if (onToggleSidebar) {
        onToggleSidebar();
        return 'Sidebar alternada';
      }

      return 'Função de toggle da sidebar não disponível';
    },
  });

  // Ação: Atualizar dados
  useCopilotAction({
    name: 'atualizarDados',
    description: 'Recarrega os dados da página atual (refresh)',
    parameters: [],
    handler: async () => {
      if (onRefresh) {
        onRefresh();
        return 'Dados atualizados';
      }

      // Fallback: recarrega a página
      if (typeof window !== 'undefined') {
        window.location.reload();
        return 'Recarregando página...';
      }

      return 'Função de atualização não disponível';
    },
  });

  // Ação: Informar modo atual
  useCopilotAction({
    name: 'qualModoAtual',
    description: 'Informa qual é o modo de visualização atual',
    parameters: [],
    handler: async () => {
      if (modoAtual) {
        return `O modo de visualização atual é: ${modoAtual}`;
      }

      // Tenta ler do localStorage
      if (typeof window !== 'undefined') {
        const modoSalvo = localStorage.getItem('view-mode');
        if (modoSalvo) {
          return `O modo de visualização salvo é: ${modoSalvo}`;
        }
      }

      return 'Modo de visualização: tabela (padrão)';
    },
  });
}
