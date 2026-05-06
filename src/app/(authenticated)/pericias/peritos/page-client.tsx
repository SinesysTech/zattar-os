'use client';

/**
 * PeritosPageClient — Vista focada de peritos dentro do contexto de perícias.
 * ============================================================================
 * Peritos são `terceiros` com `tipo_parte = 'PERITO'`. A gestão canônica
 * (criar/editar/desativar) vive em `/partes/terceiros`. Esta página serve
 * como atalho focado: mostra a lista dos peritos ativos com busca e CTA
 * pro módulo de Partes para edição completa.
 * ============================================================================
 */

import { cn } from '@/lib/utils';
import * as React from 'react';
import { ArrowLeft, ExternalLink, Search, User } from 'lucide-react';
import Link from 'next/link';

import { GlassPanel } from '@/components/shared/glass-panel';
import { Button } from '@/components/ui/button';
import { Heading, Text } from '@/components/ui/typography';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { IconContainer } from '@/components/ui/icon-container';

import { usePeritos } from '../hooks/use-peritos';

export function PeritosPageClient() {
  const { peritos, isLoading, error } = usePeritos();
  const [search, setSearch] = React.useState('');

  const filtered = React.useMemo(() => {
    if (!search.trim()) return peritos;
    const q = search.toLowerCase();
    return peritos.filter((p) => p.nome.toLowerCase().includes(q));
  }, [peritos, search]);

  const total = peritos.length;

  return (
    <div className={cn(/* design-system-escape: space-y-5 sem token DS */ "space-y-5")}>
      {/* ── Header ──────────────────────────────────────────── */}
      <div className={cn(/* design-system-escape: gap-4 → migrar para <Inline gap="default"> */ "flex items-end justify-between gap-4 flex-wrap")}>
        <div>
          <div className={cn(/* design-system-escape: gap-2 → migrar para <Inline gap="tight"> */ "flex items-center gap-2 mb-1")}>
            <Button
              asChild
              variant="ghost"
              size="sm"
              className={cn(/* design-system-escape: px-2 padding direcional sem Inset equiv. */ "h-7 px-2 text-muted-foreground/70")}
            >
              <Link href="/pericias">
                <ArrowLeft className="size-3.5" />
                Perícias
              </Link>
            </Button>
          </div>
          <Heading level="page">Peritos</Heading>
          {!isLoading && (
            <p className={cn("text-body-sm text-muted-foreground/70 mt-0.5")}>
              {total} perito{total !== 1 ? 's' : ''} ativo{total !== 1 ? 's' : ''}{' '}
              · gestão completa em Partes / Terceiros
            </p>
          )}
        </div>
        <div className={cn(/* design-system-escape: gap-2 → migrar para <Inline gap="tight"> */ "flex items-center gap-2 flex-wrap")}>
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground/50 pointer-events-none" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar perito..."
              className={cn(/* design-system-escape: pl-8 padding direcional sem Inset equiv. */ "h-9 w-64 pl-8 bg-card")}
            />
          </div>
          <Button asChild size="sm" variant="outline" className="rounded-xl">
            <Link href="/partes/terceiros?tipo=PERITO">
              <ExternalLink className="size-3.5" />
              Gerenciar em Terceiros
            </Link>
          </Button>
        </div>
      </div>

      {/* ── Info banner ───────────────────────────────────── */}
      <GlassPanel
        depth={1}
        className={cn(/* design-system-escape: px-4 padding direcional sem Inset equiv.; py-3 padding direcional sem Inset equiv.; gap-3 gap sem token DS */ "px-4 py-3 flex items-start gap-3 border-info/20")}
      >
        <IconContainer size="md" className="bg-info/10">
          <User className="size-4 text-info/70" />
        </IconContainer>
        <div className="flex-1 min-w-0">
          <p className={cn(/* design-system-escape: font-medium → className de <Text>/<Heading> */ "text-body-sm font-medium text-foreground/90")}>
            Peritos são cadastrados como Terceiros
          </p>
          <Text variant="caption" className="text-muted-foreground/70 mt-0.5">
            Esta página mostra a vista consolidada. Para criar, editar ou
            desativar peritos, acesse{' '}
            <Link
              href="/partes/terceiros?tipo=PERITO"
              className="underline underline-offset-2 hover:text-primary"
            >
              Partes / Terceiros
            </Link>
            .
          </Text>
        </div>
      </GlassPanel>

      {/* ── Lista ───────────────────────────────────────────── */}
      {isLoading ? (
        <div className={cn(/* design-system-escape: gap-3 gap sem token DS */ "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3")}>
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-2xl" />
          ))}
        </div>
      ) : error ? (
        <GlassPanel depth={1} className={cn(/* design-system-escape: p-12 → usar <Inset> */ "p-12 text-center")}>
          <p className={cn("text-body-sm text-destructive")}>{error}</p>
        </GlassPanel>
      ) : filtered.length === 0 ? (
        <GlassPanel depth={1} className={cn(/* design-system-escape: p-12 → usar <Inset> */ "p-12 text-center")}>
          <User className="size-10 text-muted-foreground/30 mx-auto mb-3" />
          <p className={cn("text-body-sm text-muted-foreground")}>
            {search
              ? 'Nenhum perito encontrado para esta busca.'
              : 'Nenhum perito ativo cadastrado.'}
          </p>
        </GlassPanel>
      ) : (
        <div className={cn(/* design-system-escape: gap-3 gap sem token DS */ "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3")}>
          {filtered.map((p) => (
            <GlassPanel
              key={p.id}
              depth={2}
              className={cn(/* design-system-escape: p-4 → migrar para <Inset variant="card-compact">; gap-3 gap sem token DS */ "p-4 flex items-center gap-3")}
            >
              <div className="size-9 rounded-full bg-muted/40 border border-border/30 flex items-center justify-center shrink-0">
                <User className="size-4 text-muted-foreground/60" />
              </div>
              <div className="min-w-0 flex-1">
                <p className={cn(/* design-system-escape: font-semibold → className de <Text>/<Heading> */ "text-body-sm font-semibold text-foreground/90 truncate")}>
                  {p.nome}
                </p>
                <p className={cn(/* design-system-escape: tracking-wider sem token DS */ "text-[10px] uppercase tracking-wider text-muted-foreground/55")}>
                  Perito Judicial
                </p>
              </div>
            </GlassPanel>
          ))}
        </div>
      )}
    </div>
  );
}
