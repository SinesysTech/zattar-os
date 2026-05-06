/**
 * TimelineSearchModal
 *
 * Modal de busca avançada para a timeline (estilo CMD+K / Command Palette).
 * Exibe campo de busca, filtros rápidos, lista de resultados com destaque
 * do termo e navegação completa por teclado.
 *
 * Atalho global: Cmd+K (macOS) ou Ctrl+K (Windows/Linux).
 */

'use client';

import { cn } from '@/lib/utils';
import { useEffect, useRef } from 'react';
import { Search, ArrowUp, ArrowDown, CornerDownLeft } from 'lucide-react';
import { Text } from '@/components/ui/typography';
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog';
import { TimelineSearchFilters } from './timeline-search-filters';
import { TimelineSearchResult } from './timeline-search-result';
import { useTimelineSearch } from './use-timeline-search';
import type { TimelineItemUnificado } from '../timeline/types';

// ---------------------------------------------------------------------------
// Tipos
// ---------------------------------------------------------------------------

interface TimelineSearchModalProps {
  /** Lista completa de itens da timeline */
  items: TimelineItemUnificado[];
  /** Controla se o modal está aberto */
  open: boolean;
  /** Callback para alterar o estado de abertura */
  onOpenChange: (open: boolean) => void;
  /** Callback chamado quando o usuário seleciona um resultado */
  onSelectItem: (item: TimelineItemUnificado) => void;
}

// ---------------------------------------------------------------------------
// Componente
// ---------------------------------------------------------------------------

/**
 * Modal de busca da timeline com filtros rápidos e navegação por teclado.
 *
 * @example
 * <TimelineSearchModal
 *   items={timelineItems}
 *   open={isSearchOpen}
 *   onOpenChange={setIsSearchOpen}
 *   onSelectItem={(item) => handleSelect(item)}
 * />
 */
export function TimelineSearchModal({
  items,
  open,
  onOpenChange,
  onSelectItem,
}: TimelineSearchModalProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  const {
    query,
    setQuery,
    activeFilters,
    toggleFilter,
    results,
    selectedIndex,
    setSelectedIndex: _setSelectedIndex,
    handleKeyDown,
  } = useTimelineSearch({ items });

  // Foca o input quando o modal abre
  useEffect(() => {
    if (open) {
      // Pequeno delay para garantir que o DOM já renderizou
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
      return () => clearTimeout(timer);
    }
    // Limpa busca ao fechar
    setQuery('');
  }, [open, setQuery]);

  // Scroll automático para o item selecionado via teclado
  useEffect(() => {
    if (!resultsRef.current) return;
    const selected = resultsRef.current.querySelector('[aria-selected="true"]');
    selected?.scrollIntoView({ block: 'nearest' });
  }, [selectedIndex]);

  // Atalho global Cmd+K / Ctrl+K
  useEffect(() => {
    function handleGlobalKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        onOpenChange(!open);
      }
    }

    document.addEventListener('keydown', handleGlobalKeyDown);
    return () => document.removeEventListener('keydown', handleGlobalKeyDown);
  }, [open, onOpenChange]);

  /**
   * Seleciona um item e fecha o modal.
   */
  function handleSelect(item: TimelineItemUnificado) {
    onSelectItem(item);
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={cn(/* design-system-escape: p-0 → usar <Inset> */ "flex max-w-120 p-0 inline-none overflow-hidden")}>
        {/* Campo de busca */}
        <div
          className={cn("flex items-center px-4 border-b h-16")}
          onKeyDown={(e) =>
            handleKeyDown(
              e,
              (item) => handleSelect(item),
              () => onOpenChange(false)
            )
          }
        >
          <Search
            className="text-muted-foreground mr-3 size-5 shrink-0"
            aria-hidden="true"
          />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar na linha do tempo..."
            className={cn(/* design-system-escape: p-0 → usar <Inset> */ "flex-1 bg-transparent border-none text-body-lg placeholder:text-muted-foreground p-0 outline-none focus:ring-0")}
          />
          <kbd className={cn("hidden sm:flex items-center ml-3 px-1.5 py-0.5 rounded border bg-muted text-caption text-muted-foreground font-mono tracking-tight")}>
            ESC
          </kbd>
        </div>

        {/* Filtros rápidos */}
        <TimelineSearchFilters
          activeFilters={activeFilters}
          onToggleFilter={toggleFilter}
        />

        {/* Lista de resultados */}
        <div
          ref={resultsRef}
          className={cn(/* design-system-escape: p-2 → usar <Inset> */ "flex flex-col max-h-[70vh] overflow-y-auto p-2 stack-micro")}
          role="listbox"
          aria-label="Resultados da busca"
        >
          {results.length === 0 ? (
            <div className={cn("py-8 text-center")}>
              <Text variant="caption" className="text-muted-foreground">
                {query.trim() || activeFilters.size > 0
                  ? 'Nenhum resultado encontrado'
                  : 'Digite para buscar na timeline'}
              </Text>
            </div>
          ) : (
            results.map((item, index) => (
              <TimelineSearchResult
                key={item.id}
                item={item}
                query={query}
                isSelected={index === selectedIndex}
                onClick={() => handleSelect(item)}
              />
            ))
          )}
        </div>

        {/* Rodapé com contagem e atalhos */}
        <div className={cn("px-4 py-2 border-t bg-muted/30 flex justify-between items-center text-[12px] text-muted-foreground")}>
          <span>
            <strong className="text-foreground">{results.length}</strong>{' '}
            {results.length === 1 ? 'resultado' : 'resultados'}
          </span>
          <div className={cn("flex items-center inline-medium")}>
            <span className={cn("inline-flex items-center inline-nano")}>
              <ArrowUp className="size-3" />
              <ArrowDown className="size-3" />
              <span className="ml-0.5">Navegar</span>
            </span>
            <span className={cn("inline-flex items-center inline-nano")}>
              <CornerDownLeft className="size-3" />
              <span className="ml-0.5">Selecionar</span>
            </span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
