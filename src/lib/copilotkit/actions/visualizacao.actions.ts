'use client';

/**
 * CopilotKit Actions - Visualização (v2)
 *
 * Ações para alternar modos de exibição, temas e preferências visuais.
 * Usa useFrontendTool com Zod schemas.
 */

import { useFrontendTool } from '@copilotkit/react-core/v2';
import { z } from 'zod';

import type { ModoExibicao } from './types';

interface UseVisualizacaoActionsProps {
  modoAtual?: ModoExibicao;
  onMudarModo?: (modo: ModoExibicao) => void;
  onToggleSidebar?: () => void;
  onRefresh?: () => void;
}

export function useVisualizacaoActions(props?: UseVisualizacaoActionsProps) {
  const { modoAtual, onMudarModo, onToggleSidebar, onRefresh } = props || {};

  useFrontendTool({
    name: 'alternarModoExibicao',
    description: 'Alterna entre visualização em tabela e cards/grid.',
    parameters: z.object({
      modo: z.string().describe('Modo de exibição: tabela ou cards'),
    }),
    handler: async ({ modo }) => {
      const modosValidos: ModoExibicao[] = ['tabela', 'cards'];
      if (!modosValidos.includes(modo as ModoExibicao)) {
        return `Modo "${modo}" inválido. Use: tabela ou cards`;
      }
      if (modo === modoAtual) return `Já está no modo ${modo}`;
      if (onMudarModo) {
        onMudarModo(modo as ModoExibicao);
        if (typeof window !== 'undefined') localStorage.setItem('view-mode', modo);
        return `Modo alterado para ${modo}`;
      }
      if (typeof window !== 'undefined') {
        localStorage.setItem('view-mode', modo);
        return `Preferência salva: ${modo}. Recarregue a página para aplicar.`;
      }
      return 'Função de alteração de modo não disponível';
    },
  });

  useFrontendTool({
    name: 'verEmTabela',
    description: 'Muda a visualização para o modo tabela (lista detalhada)',
    parameters: z.object({}),
    handler: async () => {
      if (modoAtual === 'tabela') return 'Já está no modo tabela';
      if (onMudarModo) {
        onMudarModo('tabela');
        if (typeof window !== 'undefined') localStorage.setItem('view-mode', 'tabela');
        return 'Visualização alterada para tabela';
      }
      return 'Função não disponível nesta página';
    },
  });

  useFrontendTool({
    name: 'verEmCards',
    description: 'Muda a visualização para o modo cards (grade visual)',
    parameters: z.object({}),
    handler: async () => {
      if (modoAtual === 'cards') return 'Já está no modo cards';
      if (onMudarModo) {
        onMudarModo('cards');
        if (typeof window !== 'undefined') localStorage.setItem('view-mode', 'cards');
        return 'Visualização alterada para cards';
      }
      return 'Função não disponível nesta página';
    },
  });

  useFrontendTool({
    name: 'toggleSidebar',
    description: 'Expande ou colapsa a barra lateral de navegação',
    parameters: z.object({}),
    handler: async () => {
      if (onToggleSidebar) { onToggleSidebar(); return 'Sidebar alternada'; }
      return 'Função de toggle da sidebar não disponível';
    },
  });

  useFrontendTool({
    name: 'atualizarDados',
    description: 'Recarrega os dados da página atual (refresh)',
    parameters: z.object({}),
    handler: async () => {
      if (onRefresh) { onRefresh(); return 'Dados atualizados'; }
      if (typeof window !== 'undefined') { window.location.reload(); return 'Recarregando página...'; }
      return 'Função de atualização não disponível';
    },
  });

  useFrontendTool({
    name: 'qualModoAtual',
    description: 'Informa qual é o modo de visualização atual',
    parameters: z.object({}),
    handler: async () => {
      if (modoAtual) return `O modo de visualização atual é: ${modoAtual}`;
      if (typeof window !== 'undefined') {
        const modoSalvo = localStorage.getItem('view-mode');
        if (modoSalvo) return `O modo de visualização salvo é: ${modoSalvo}`;
      }
      return 'Modo de visualização: tabela (padrão)';
    },
  });
}
