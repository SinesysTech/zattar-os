'use client';

import { useRef, type KeyboardEvent } from 'react';
import { Search } from 'lucide-react';
import { LoadingSpinner } from '@/components/ui/loading-state';
import { Text } from '@/components/ui/typography';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { usePesquisaStore } from '../hooks/use-pesquisa-store';

export interface SearchHeroProps {
  onBuscar: () => void;
}

/**
 * Bloco de busca da página de Pesquisa — minimalista.
 * Apenas instrução curta + input central. O título "Diário Oficial" e
 * a navegação ficam a cargo do header da página (acima deste componente).
 */
export function SearchHero({ onBuscar }: SearchHeroProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const termo = usePesquisaStore((s) => s.termo);
  const setTermo = usePesquisaStore((s) => s.setTermo);
  const isBuscando = usePesquisaStore((s) => s.isBuscando);

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      onBuscar();
    }
  };

  return (
    <div className={cn("mx-auto flex w-full max-w-3xl flex-col items-center inline-medium")}>
      <Text variant="caption" className="text-center text-muted-foreground/60">
        Consulte comunicações processuais na base pública do Comunica CNJ.
      </Text>

      <div
        className={cn(
          /* design-system-escape: px-4 padding direcional sem Inset equiv.; py-2.5 padding direcional sem Inset equiv. */ 'flex w-full items-center inline-tight rounded-2xl border bg-card px-4 py-2.5 transition-all',
          'border-border/20',
          'focus-within:border-primary/40 focus-within:shadow-[0_4px_24px_color-mix(in_oklch,var(--primary)_10%,transparent)]',
        )}
      >
        <Search className="size-4 shrink-0 text-muted-foreground" aria-hidden />
        <input
          ref={inputRef}
          type="text"
          value={termo}
          onChange={(e) => setTermo(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Número do processo, nome da parte, OAB..."
          className={cn("flex-1 bg-transparent text-body-sm text-foreground outline-none placeholder:text-muted-foreground/60")}
          autoComplete="off"
          spellCheck={false}
          aria-label="Termo de busca"
          data-pesquisa-input
        />
        <Button
          type="button"
          size="sm"
          onClick={onBuscar}
          disabled={isBuscando}
          className={cn("inline-snug rounded-xl")}
        >
          {isBuscando ? (
            <LoadingSpinner />
          ) : (
            <Search className="size-3.5" aria-hidden />
          )}
          {isBuscando ? 'Buscando' : 'Pesquisar'}
        </Button>
      </div>
    </div>
  );
}
