'use client';

/**
 * TimelineSidebarHeader
 *
 * Barra de estatísticas e campo de busca localizado abaixo do card de contexto.
 * Exibe contagem de itens e permite filtrar por texto.
 */

import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Text } from '@/components/ui/typography';
import { cn } from '@/lib/utils';

interface TimelineSidebarHeaderProps {
  /** Total de itens na timeline (documentos + movimentos) */
  totalItems: number;
  /** Quantidade de documentos */
  totalDocumentos: number;
  /** Quantidade de movimentos */
  totalMovimentos: number;
  /** Texto atual de busca */
  searchTerm: string;
  /** Callback chamado quando o texto de busca muda */
  onSearchChange: (value: string) => void;
  /** Callback para abrir o modal de busca avançada (CMD+K) */
  onOpenSearch: () => void;
}

/**
 * Cabeçalho da sidebar de timeline com campo de busca e estatísticas.
 *
 * @example
 * <TimelineSidebarHeader
 *   totalItems={42}
 *   totalDocumentos={18}
 *   totalMovimentos={24}
 *   searchTerm=""
 *   onSearchChange={(v) => setSearch(v)}
 *   onOpenSearch={() => setSearchOpen(true)}
 * />
 */
export function TimelineSidebarHeader({
  totalItems,
  totalDocumentos,
  totalMovimentos,
  searchTerm,
  onSearchChange,
  onOpenSearch,
}: TimelineSidebarHeaderProps) {
  return (
    <div className={cn(/* design-system-escape: p-3 → usar <Inset> */ "flex-none p-3 border-b stack-tight")}>
      {/* Campo de busca com indicador CMD+K */}
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
        <Input
          placeholder="Buscar na timeline..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className={cn("h-8 pl-8 pr-16 text-caption")}
        />
        {/* Badge CMD+K para abrir busca avançada */}
        <button
          type="button"
          onClick={onOpenSearch}
          className={cn(
            'absolute right-2 top-1/2 -translate-y-1/2',
            'flex items-center inline-nano px-1.5 py-0.5 rounded',
            'bg-muted border border-border',
             'text-[10px] font-medium text-muted-foreground',
            'hover:bg-accent hover:text-accent-foreground transition-colors',
            'cursor-pointer'
          )}
          aria-label="Abrir busca avançada"
        >
          <span className="text-[9px]">⌘</span>
          <span>K</span>
        </button>
      </div>

      {/* Estatísticas */}
      <Text variant="caption" className="text-muted-foreground">
        {totalItems}{' '}
        {totalItems === 1 ? 'item' : 'itens'}
        {' · '}
        {totalDocumentos}{' '}
        {totalDocumentos === 1 ? 'documento' : 'documentos'}
        {' · '}
        {totalMovimentos}{' '}
        {totalMovimentos === 1 ? 'movimento' : 'movimentos'}
      </Text>
    </div>
  );
}
