'use client';

import Link from 'next/link';
import { Scale, ExternalLink, Plus } from 'lucide-react';

import {
  DetailSection,
  DetailSectionCard,
  DetailSectionAction,
} from '@/components/shared/detail-section';
import type { ContratoProcessoVinculo } from '@/app/(authenticated)/contratos';

// =============================================================================
// HELPERS
// =============================================================================

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '—';
  try {
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      timeZone: 'UTC',
    }).format(new Date(dateStr));
  } catch {
    return '—';
  }
}

const GRAU_LABELS: Record<string, string> = {
  primeiro_grau: '1º Grau',
  segundo_grau: '2º Grau',
  tribunal_superior: 'TST',
};

function formatGrau(grau: string | null): string {
  if (!grau) return '—';
  return GRAU_LABELS[grau] ?? grau;
}

// =============================================================================
// COMPONENT
// =============================================================================

interface ContratoProcessosCardProps {
  processos: ContratoProcessoVinculo[];
  onAddProcesso?: () => void;
}

export function ContratoProcessosCard({
  processos,
  onAddProcesso,
}: ContratoProcessosCardProps) {
  const isEmpty = processos.length === 0;

  return (
    <DetailSection
      icon={Scale}
      label="Processos vinculados"
      action={
        onAddProcesso ? (
          <DetailSectionAction icon={Plus} onClick={onAddProcesso}>
            Vincular
          </DetailSectionAction>
        ) : null
      }
    >
      <DetailSectionCard>
        {isEmpty ? (
          <p className="text-[12.5px] text-muted-foreground/70 italic">
            Nenhum processo vinculado
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            {processos.map((vinculo) => {
              const processo = vinculo.processo;
              if (!processo) return null;

              const numero = processo.numeroProcesso || `Processo #${processo.id}`;
              const meta = [
                processo.trt,
                formatGrau(processo.grau),
                processo.dataAutuacao
                  ? `Autuado em ${formatDate(processo.dataAutuacao)}`
                  : null,
              ]
                .filter(Boolean)
                .join(' · ');

              return (
                <Link
                  key={vinculo.id}
                  href={`/app/processos/${processo.id}`}
                  className="group flex items-center gap-3 px-3 py-2.5 rounded-[10px] bg-muted/40 border border-border/30 transition-colors hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] font-semibold text-foreground tabular-nums truncate">
                      {numero}
                    </div>
                    {meta && (
                      <div className="text-[10.5px] text-muted-foreground uppercase tracking-[0.04em] mt-0.5 truncate">
                        {meta}
                      </div>
                    )}
                  </div>
                  <ExternalLink className="size-3.5 text-muted-foreground/50 group-hover:text-primary transition-colors shrink-0" />
                </Link>
              );
            })}
          </div>
        )}
      </DetailSectionCard>
    </DetailSection>
  );
}
