'use client';

import { cn } from '@/lib/utils';
import * as React from 'react';
import Link from 'next/link';
import { ArrowUpRight, Briefcase, Building2 } from 'lucide-react';

import { GlassPanel } from '@/components/shared/glass-panel';
import { IconContainer } from '@/components/ui/icon-container';
import { SemanticBadge } from '@/components/ui/semantic-badge';
import { Text } from '@/components/ui/typography';
import { Button } from '@/components/ui/button';
import { GRAU_LABELS } from '@/lib/design-system';

import type { ProcessoInfo } from '../../domain';

interface ProcessoVinculadoCardProps {
  processo: ProcessoInfo | null | undefined;
}

export function ProcessoVinculadoCard({ processo }: ProcessoVinculadoCardProps) {
  if (!processo) {
    return (
      <GlassPanel depth={1} className={cn(/* design-system-escape: p-5 → usar <Inset> */ "p-5 flex items-center justify-center min-h-[180px]")}>
        <Text variant="caption" className="text-muted-foreground/60 text-center">
          Este acordo não está vinculado a um processo.
        </Text>
      </GlassPanel>
    );
  }

  const grauLabel = processo.grau
    ? GRAU_LABELS[processo.grau] || processo.grau
    : null;

  const parteAutora = processo.nome_parte_autora?.trim() || null;
  const parteRe = processo.nome_parte_re?.trim() || null;

  return (
    <GlassPanel depth={1} className={cn(/* design-system-escape: p-5 → usar <Inset> */ "p-5")}>
      <div className={cn("flex items-start justify-between inline-medium mb-4")}>
        <div className="min-w-0">
          <Text variant="meta-label" className="text-muted-foreground/60">
            Processo vinculado
          </Text>
          <Text
            variant="caption"
            className={cn( "font-semibold text-foreground/90 tabular-nums mt-1 block truncate")}
          >
            {processo.numero_processo}
          </Text>
        </div>
        <IconContainer size="md" className="bg-info/8 shrink-0">
          <Briefcase className="size-4 text-info/70" />
        </IconContainer>
      </div>

      <div className={cn("flex flex-wrap items-center inline-snug mb-4")}>
        {processo.trt && (
          <SemanticBadge
            category="tribunal"
            value={processo.trt}
            className="text-[10px]"
          >
            {processo.trt}
          </SemanticBadge>
        )}
        {grauLabel && processo.grau && (
          <SemanticBadge
            category="grau"
            value={processo.grau}
            className="text-[10px]"
          >
            {grauLabel}
          </SemanticBadge>
        )}
        {processo.classe_judicial && (
          <Text
            variant="meta-label"
            className="text-muted-foreground/70"
          >
            {processo.classe_judicial}
          </Text>
        )}
      </div>

      <div className={cn("stack-medium mb-5")}>
        {processo.descricao_orgao_julgador && (
          <div className={cn("flex items-start inline-tight")}>
            <Building2 className="size-3.5 text-muted-foreground/50 mt-0.5 shrink-0" />
            <Text
              variant="caption"
              className={cn(/* design-system-escape: leading-snug sem token DS */ "text-foreground/80 leading-snug")}
            >
              {processo.descricao_orgao_julgador}
            </Text>
          </div>
        )}

        {(parteAutora || parteRe) && (
          <div className={cn(/* design-system-escape: pt-3 padding direcional sem Inset equiv. */ "pt-3 border-t border-border/15 stack-snug")}>
            {parteAutora && (
              <PartesRow polo="Autor" nome={parteAutora} />
            )}
            {parteRe && (
              <PartesRow polo="Réu" nome={parteRe} />
            )}
          </div>
        )}
      </div>

      <Button variant="outline" size="sm" asChild className="rounded-xl w-full">
        <Link href={`/processos/${processo.id}`}>
          <span>Abrir processo</span>
          <ArrowUpRight className="size-3.5 ml-1" />
        </Link>
      </Button>
    </GlassPanel>
  );
}

function PartesRow({ polo, nome }: { polo: string; nome: string }) {
  return (
    <div className={cn("flex items-baseline inline-tight min-w-0")}>
      <Text
        variant="meta-label"
        className="text-muted-foreground/55 shrink-0 w-12"
      >
        {polo}
      </Text>
      <Text
        variant="caption"
        className={cn( "font-medium text-foreground/85 truncate flex-1 min-w-0")}
      >
        {nome}
      </Text>
    </div>
  );
}
