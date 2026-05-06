'use client';

import { cn } from '@/lib/utils';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Radar, X } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import type { ResumoUltimaCaptura } from '../domain';
import { Text } from '@/components/ui/typography';

// ─── Types ────────────────────────────────────────────────────────────────────

interface ExpedientesCapturaBannerProps {
  capturaId: number;
  resumo?: ResumoUltimaCaptura | null;
  onDismiss: () => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function ExpedientesCapturaBanner({
  capturaId,
  resumo,
  onDismiss,
}: ExpedientesCapturaBannerProps) {
  const dataFormatada = resumo?.concluidoEm
    ? format(parseISO(resumo.concluidoEm), "d 'de' MMM 'às' HH:mm", { locale: ptBR })
    : null;

  return (
    <div
      className={cn(/* design-system-escape: px-4 padding direcional sem Inset equiv.; py-3 padding direcional sem Inset equiv. */ "rounded-xl border border-info/20 bg-info/5 px-4 py-3 flex items-start inline-medium")}
      role="status"
      aria-label={`Filtrando expedientes da captura #${capturaId}`}
    >
      <Radar className="size-4 text-info mt-0.5 shrink-0" />

      <div className="flex-1 min-w-0">
        <p className={cn(/* design-system-escape: leading-tight sem token DS */ "text-body-sm font-semibold text-foreground/90 leading-tight")}>
          Expedientes da Captura #{capturaId}
        </p>
        {resumo ? (
          <Text variant="caption" className="text-muted-foreground/70 mt-0.5">
            {resumo.total} expediente{resumo.total !== 1 ? 's' : ''}
            {' · '}
            <span className="text-success/80">{resumo.totalCriados} novo{resumo.totalCriados !== 1 ? 's' : ''}</span>
            {' · '}
            <span className="text-info/80">{resumo.totalAtualizados} atualizado{resumo.totalAtualizados !== 1 ? 's' : ''}</span>
            {dataFormatada && ` · Concluída ${dataFormatada}`}
          </Text>
        ) : (
          <Text variant="caption" className="text-muted-foreground/60 mt-0.5">
            Mostrando expedientes vinculados a esta captura
          </Text>
        )}
        <Link
          href={`/app/captura/historico/${capturaId}`}
          className={cn("text-caption text-info/70 hover:text-info underline-offset-2 hover:underline mt-1 inline-block")}
        >
          ← Ver histórico de capturas
        </Link>
      </div>

      <Button
        variant="ghost"
        size="icon"
        className="ml-auto h-6 w-6 shrink-0 text-muted-foreground/70 hover:text-foreground"
        onClick={onDismiss}
        aria-label="Remover filtro de captura"
      >
        <X className="size-3" />
      </Button>
    </div>
  );
}
