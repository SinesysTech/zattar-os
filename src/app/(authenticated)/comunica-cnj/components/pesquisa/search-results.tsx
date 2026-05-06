'use client';

import { useState } from 'react';
import { FileSearch, ExternalLink, Eye } from 'lucide-react';
import { GlassPanel } from '@/components/shared/glass-panel';
import { EmptyState } from '@/components/shared/empty-state';
import { LoadingSpinner } from '@/components/ui/loading-state';
import { Heading, Text } from '@/components/ui/typography';
import { Button } from '@/components/ui/button';
import { TribunalBadge } from '@/components/ui/tribunal-badge';
import { AppBadge as Badge } from '@/components/ui/app-badge';
import { cn } from '@/lib/utils';
import type { ComunicacaoItem } from '@/app/(authenticated)/comunica-cnj/domain';
import { usePesquisaStore } from '../hooks/use-pesquisa-store';
import { ComunicacaoDetalhesDialog } from '../detalhes-dialog';
import { PdfViewerDialog } from '../pdf-viewer-dialog';

function ResultadoCard({
  item,
  onOpen,
}: {
  item: ComunicacaoItem;
  onOpen: () => void;
}) {
  const partes = [
    ...(item.partesAutoras ?? []),
    ...(item.partesReus ?? []),
  ].join(' · ');

  const data = item.dataDisponibilizacao
    ? new Date(item.dataDisponibilizacao).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      })
    : '—';

  return (
    <button
      type="button"
      onClick={onOpen}
      className={cn(
        'group w-full text-left transition-all duration-200',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40',
      )}
    >
      <GlassPanel className={cn("flex inline-medium inset-card-compact group-hover:border-primary/30 group-hover:shadow-[0_4px_24px_color-mix(in_oklch,var(--primary)_6%,transparent)]")}>
        <div className={cn("flex items-start justify-between inline-medium")}>
          <div className={cn("flex min-w-0 flex-1 flex-col inline-snug")}>
            <div className={cn("flex flex-wrap items-center inline-tight")}>
              <TribunalBadge codigo={item.siglaTribunal} />
              {item.tipoComunicacao && (
                <Badge variant="outline" className={cn("text-caption")}>
                  {item.tipoComunicacao}
                </Badge>
              )}
              <Text variant="micro-caption" className="tabular-nums">
                {data}
              </Text>
            </div>
            <Heading level="widget" className="tabular-nums">
              {item.numeroProcessoComMascara || item.numeroProcesso}
            </Heading>
            {partes && (
              <Text variant="caption" className="line-clamp-1 text-muted-foreground">
                {partes}
              </Text>
            )}
            {item.nomeOrgao && (
              <Text variant="micro-caption" className="truncate">
                {item.nomeOrgao}
              </Text>
            )}
          </div>
          <div
            className="mt-1 inline-flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/5 text-primary opacity-0 transition-opacity group-hover:opacity-100"
            aria-hidden
          >
            <Eye className="size-4" />
          </div>
        </div>
        {item.texto && (
          <Text
            variant="micro-caption"
            className={cn("line-clamp-2 border-t border-border/30 pt-2 text-muted-foreground/80")}
          >
            {item.texto.replace(/<[^>]+>/g, '').slice(0, 240)}
          </Text>
        )}
      </GlassPanel>
    </button>
  );
}

/**
 * Lista de resultados da busca ao vivo na API CNJ.
 * Mostra skeleton durante a busca, empty state se sem resultado,
 * ou grid de cards de comunicações.
 */
export function SearchResults() {
  const isBuscando = usePesquisaStore((s) => s.isBuscando);
  const erro = usePesquisaStore((s) => s.erro);
  const resultados = usePesquisaStore((s) => s.resultados);
  const jaBuscou = usePesquisaStore((s) => s.jaBuscou);
  const total = usePesquisaStore((s) => s.total);

  const [itemAberto, setItemAberto] = useState<ComunicacaoItem | null>(null);
  const [hashPdf, setHashPdf] = useState<string | null>(null);

  if (isBuscando) {
    return (
      <div className={cn("mx-auto w-full max-w-3xl py-8")}>
        <div className={cn("flex flex-col items-center inline-medium")}>
          <LoadingSpinner className="size-6" />
          <Text variant="caption" className="text-muted-foreground">
            Consultando Comunica CNJ...
          </Text>
        </div>
      </div>
    );
  }

  if (erro) {
    return (
      <div className="mx-auto w-full max-w-3xl">
        <GlassPanel className={cn("flex inline-tight border-destructive/30 bg-destructive/5 inset-default-plus text-center")}>
          <Heading level="widget" className="text-destructive">
            Não foi possível consultar
          </Heading>
          <Text variant="caption" className="text-destructive/80">
            {erro}
          </Text>
        </GlassPanel>
      </div>
    );
  }

  if (!jaBuscou) {
    return null;
  }

  if (resultados.length === 0) {
    return (
      <div className="mx-auto w-full max-w-3xl">
        <EmptyState
          icon={FileSearch}
          title="Nenhuma comunicação encontrada"
          description="Tente outro termo, revise o período ou remova filtros."
        />
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col mx-auto w-full max-w-3xl stack-medium")}>
      <div className="flex items-center justify-between">
        <Text variant="overline" className="text-muted-foreground/70">
          {total.toLocaleString('pt-BR')} resultado{total === 1 ? '' : 's'}
        </Text>
        <Button variant="ghost" size="sm" asChild className={cn("text-caption")}>
          <a
            href="https://comunica.pje.jus.br/"
            target="_blank"
            rel="noopener noreferrer"
          >
            <ExternalLink className="mr-1 size-3" aria-hidden />
            Portal CNJ
          </a>
        </Button>
      </div>

      <div className={cn("flex flex-col inline-medium")}>
        {resultados.map((item) => (
          <ResultadoCard
            key={item.hash}
            item={item}
            onOpen={() => setItemAberto(item)}
          />
        ))}
      </div>

      <ComunicacaoDetalhesDialog
        comunicacao={itemAberto}
        open={itemAberto !== null}
        onOpenChange={(open) => {
          if (!open) setItemAberto(null);
        }}
        onViewPdf={(hash) => setHashPdf(hash)}
      />

      <PdfViewerDialog
        hash={hashPdf}
        open={hashPdf !== null}
        onOpenChange={(open) => {
          if (!open) setHashPdf(null);
        }}
      />
    </div>
  );
}
