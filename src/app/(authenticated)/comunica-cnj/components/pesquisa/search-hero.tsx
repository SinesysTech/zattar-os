'use client';

import { useRef, type KeyboardEvent } from 'react';
import { Search, Scale } from 'lucide-react';
import { LoadingSpinner } from '@/components/ui/loading-state';
import { Heading, Text } from '@/components/ui/typography';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { usePesquisaStore } from '../hooks/use-pesquisa-store';

export interface SearchHeroProps {
  onBuscar: () => void;
}

/**
 * Hero central da página de busca do Diário Oficial.
 * Exibe título, subtítulo e o input principal de pesquisa.
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
    <div className="mx-auto flex max-w-3xl flex-col items-center gap-5 text-center">
      <div className="flex size-14 items-center justify-center rounded-2xl border border-primary/20 bg-primary/5 text-primary">
        <Scale className="size-7" aria-hidden />
      </div>

      <div className="space-y-2">
        <Heading level="page">Diário Oficial</Heading>
        <Text variant="caption" className="mx-auto max-w-xl text-muted-foreground">
          Consulte comunicações processuais na base pública do Comunica CNJ.
          Pesquise por número do processo, nome da parte, OAB ou tribunal.
        </Text>
      </div>

      <div
        className={cn(
          'flex w-full items-center gap-2 rounded-2xl border bg-card px-4 py-2.5 transition-all',
          'border-border/40 shadow-[0_4px_24px_rgba(0,0,0,0.04)]',
          'focus-within:border-primary/40 focus-within:shadow-[0_4px_24px_rgba(85,35,235,0.12)]',
        )}
      >
        <Search className="size-5 shrink-0 text-muted-foreground" aria-hidden />
        <input
          ref={inputRef}
          type="text"
          value={termo}
          onChange={(e) => setTermo(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Número do processo, nome da parte, OAB..."
          className="flex-1 bg-transparent text-base text-foreground outline-none placeholder:text-muted-foreground/60"
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
          className="gap-1.5 rounded-xl"
        >
          {isBuscando ? (
            <LoadingSpinner />
          ) : (
            <Search className="size-4" aria-hidden />
          )}
          {isBuscando ? 'Buscando' : 'Pesquisar'}
        </Button>
      </div>
    </div>
  );
}
