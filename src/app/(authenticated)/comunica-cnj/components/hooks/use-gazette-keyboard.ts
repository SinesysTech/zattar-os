'use client';

import { useEffect } from 'react';
import { useGazetteStore } from './use-gazette-store';

export function useGazetteKeyboard() {
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const target = e.target as HTMLElement;
      // Skip when typing in inputs/textareas
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) return;

      const { comunicacoes, comunicacaoSelecionada, detailPanelAberto, modoVisualizacao } = useGazetteStore.getState();

      switch (e.key) {
        case '/': {
          e.preventDefault();
          const searchInput = document.querySelector<HTMLInputElement>('[data-gazette-search]');
          searchInput?.focus();
          break;
        }
        case 'Escape': {
          if (detailPanelAberto) {
            useGazetteStore.getState().toggleDetailPanel(false);
          }
          break;
        }
        case 'ArrowDown': {
          e.preventDefault();
          navigateRow(comunicacoes, comunicacaoSelecionada, 1);
          break;
        }
        case 'ArrowUp': {
          e.preventDefault();
          navigateRow(comunicacoes, comunicacaoSelecionada, -1);
          break;
        }
        case 'Enter': {
          if (comunicacaoSelecionada && !detailPanelAberto) {
            useGazetteStore.getState().toggleDetailPanel(true);
          }
          break;
        }
        case 't': {
          useGazetteStore.getState().setModoVisualizacao(
            modoVisualizacao === 'tabela' ? 'cards' : 'tabela'
          );
          break;
        }
        case '?': {
          e.preventDefault();
          document.dispatchEvent(new CustomEvent('gazette:toggle-keyboard-help'));
          break;
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);
}

function navigateRow(
  comunicacoes: ReturnType<typeof useGazetteStore.getState>['comunicacoes'],
  current: ReturnType<typeof useGazetteStore.getState>['comunicacaoSelecionada'],
  delta: number
) {
  if (comunicacoes.length === 0) return;
  const currentIndex = current
    ? comunicacoes.findIndex((c) => c.id === current.id)
    : -1;
  const nextIndex = Math.max(0, Math.min(comunicacoes.length - 1, currentIndex + delta));
  useGazetteStore.getState().selecionarComunicacao(comunicacoes[nextIndex]);
}
