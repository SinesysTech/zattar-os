'use client';

import * as React from 'react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { Text } from '@/components/ui/typography';

const GRAU_LABELS: Record<string, string> = {
  '1': '1º Grau',
  '2': '2º Grau',
  primeiro_grau: '1º Grau',
  segundo_grau: '2º Grau',
  unico: 'Único',
};

type CredencialInfo = { tribunal: string; grau: string };

export interface CapturaEscopoBadgeProps {
  credencialIds: number[] | undefined;
  credenciaisMap: Map<number, CredencialInfo>;
  className?: string;
}

function formatarGrau(grau: string): string {
  return GRAU_LABELS[grau] ?? grau;
}

function resumirTribunais(tribunais: string[]): string {
  if (tribunais.length === 0) return '—';
  if (tribunais.length === 1) return tribunais[0];
  return `${tribunais.length} tribunais`;
}

function resumirGraus(graus: string[]): string {
  if (graus.length === 0) return '';
  if (graus.length === 1) return formatarGrau(graus[0]);
  const ordenados = [...graus].sort();
  return `${ordenados.map((g) => formatarGrau(g).replace(' Grau', '')).join(' e ')} grau`;
}

export function CapturaEscopoBadge({
  credencialIds,
  credenciaisMap,
  className,
}: CapturaEscopoBadgeProps) {
  const { tribunais, graus, detalhes } = React.useMemo(() => {
    if (!credencialIds?.length) {
      return { tribunais: [] as string[], graus: [] as string[], detalhes: [] as CredencialInfo[] };
    }
    const tribunaisSet = new Set<string>();
    const grausSet = new Set<string>();
    const detalhesList: CredencialInfo[] = [];
    for (const id of credencialIds) {
      const info = credenciaisMap.get(id);
      if (!info) continue;
      tribunaisSet.add(info.tribunal);
      grausSet.add(info.grau);
      detalhesList.push(info);
    }
    return {
      tribunais: Array.from(tribunaisSet),
      graus: Array.from(grausSet),
      detalhes: detalhesList,
    };
  }, [credencialIds, credenciaisMap]);

  if (tribunais.length === 0) {
    return <Text variant="caption" className="text-muted-foreground/55">—</Text>;
  }

  const tribunaisLabel = resumirTribunais(tribunais);
  const grausLabel = resumirGraus(graus);

  return (
    <TooltipProvider>
    <Tooltip>
      <TooltipTrigger asChild>
        <span
          className={cn(
            'inline-flex items-baseline inline-micro text-caption text-muted-foreground/80 cursor-help',
            'hover:text-foreground transition-colors',
            className,
          )}
        >
          <span className={cn( "font-medium tabular-nums")}>{tribunaisLabel}</span>
          {grausLabel && (
            <>
              <span aria-hidden className="text-muted-foreground/65">·</span>
              <span className="text-muted-foreground/75">{grausLabel}</span>
            </>
          )}
        </span>
      </TooltipTrigger>
      <TooltipContent side="top" align="start" className={cn(/* design-system-escape: p-0 → usar <Inset> */ "max-w-xs p-0 overflow-hidden")}>
        <div className={cn(/* design-system-escape: px-3 padding direcional sem Inset equiv.; py-2 padding direcional sem Inset equiv. */ "px-3 py-2 border-b border-border/40")}>
          <p className={cn( "text-[11px] font-semibold text-foreground")}>Escopo da captura</p>
          <p className="text-[10px] text-muted-foreground/80">
            {tribunais.length} tribunal{tribunais.length === 1 ? '' : 'is'} ·{' '}
            {graus.length} grau{graus.length === 1 ? '' : 's'}
          </p>
        </div>
        <ul className={cn(/* design-system-escape: px-3 padding direcional sem Inset equiv.; py-2 padding direcional sem Inset equiv. */ "px-3 py-2 grid grid-cols-2 gap-x-3 gap-y-1 max-h-56 overflow-y-auto")}>
          {detalhes.map((d, idx) => (
            <li key={`${d.tribunal}-${d.grau}-${idx}`} className={cn("flex items-center inline-snug")}>
              <span className={cn(/* design-system-escape: px-1.5 padding direcional sem Inset equiv.; py-0.5 padding direcional sem Inset equiv.; tracking-wide sem token DS */ "inline-flex items-center px-1.5 py-0.5 rounded-lg text-[9px] font-semibold tabular-nums border border-border/15 bg-muted/20 text-muted-foreground tracking-wide")}>
                {d.tribunal}
              </span>
              <span className="text-[10px] text-muted-foreground/80">{formatarGrau(d.grau)}</span>
            </li>
          ))}
        </ul>
      </TooltipContent>
    </Tooltip>
    </TooltipProvider>
  );
}
