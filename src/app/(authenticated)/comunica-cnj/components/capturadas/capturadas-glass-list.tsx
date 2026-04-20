'use client';

import { MoreHorizontal, Link2, Unlink, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { GlassPanel } from '@/components/shared/glass-panel';
import { EmptyState } from '@/components/shared/empty-state';
import { Text } from '@/components/ui/typography';
import { TribunalBadge } from '@/components/ui/tribunal-badge';
import { FileSearch } from 'lucide-react';
import type { ComunicacaoCNJEnriquecida } from '@/app/(authenticated)/comunica-cnj/domain';

export interface CapturadasGlassListProps {
  comunicacoes: ComunicacaoCNJEnriquecida[];
  onSelect: (c: ComunicacaoCNJEnriquecida) => void;
  densidade?: 'compacto' | 'padrao' | 'confortavel';
  selectedId?: number | null;
}

const DENSITY_ROW: Record<string, string> = {
  compacto: 'py-2',
  padrao: 'py-3',
  confortavel: 'py-4',
};

const TIPO_BADGE_MAP: Record<string, { label: string; className: string }> = {
  intimacao: { label: 'INT', className: 'bg-info/10 text-info' },
  intimação: { label: 'INT', className: 'bg-info/10 text-info' },
  despacho: { label: 'DES', className: 'bg-warning/10 text-warning' },
  sentenca: { label: 'SEN', className: 'bg-chart-3/10 text-chart-3' },
  sentença: { label: 'SEN', className: 'bg-chart-3/10 text-chart-3' },
  edital: { label: 'EDIT', className: 'bg-success/10 text-success' },
  certidao: { label: 'CERT', className: 'bg-muted/40 text-muted-foreground' },
  certidão: { label: 'CERT', className: 'bg-muted/40 text-muted-foreground' },
};

function getTipoBadge(tipo: string | null) {
  if (!tipo) return { label: '—', className: 'bg-muted/40 text-muted-foreground' };
  const key = tipo.toLowerCase();
  return (
    TIPO_BADGE_MAP[key] ?? {
      label: tipo.slice(0, 4).toUpperCase(),
      className: 'bg-muted/40 text-muted-foreground',
    }
  );
}

function StatusCell({ status, diasParaPrazo }: { status: string; diasParaPrazo: number | null }) {
  if (status === 'vinculado') {
    return (
      <span className="inline-flex items-center gap-1.5">
        <Link2 className="size-3 text-success" aria-hidden />
        <Text variant="micro-caption" className="text-success">Vinculado</Text>
      </span>
    );
  }
  if (status === 'pendente') {
    return (
      <span className="inline-flex items-center gap-1.5">
        <span className="size-2 rounded-full bg-warning" aria-hidden />
        <Text variant="micro-caption" className="text-warning">Pendente</Text>
      </span>
    );
  }
  if (status === 'orfao') {
    const critico = diasParaPrazo !== null && diasParaPrazo <= 3;
    return (
      <span className="inline-flex items-center gap-1.5">
        {critico ? (
          <AlertTriangle className="size-3 text-destructive" aria-hidden />
        ) : (
          <Unlink className="size-3 text-warning" aria-hidden />
        )}
        <Text
          variant="micro-caption"
          className={critico ? 'text-destructive' : 'text-warning'}
        >
          Órfão
        </Text>
      </span>
    );
  }
  return (
    <Text variant="micro-caption" className="text-muted-foreground">
      —
    </Text>
  );
}

function PrazoBadge({ dias }: { dias: number | null }) {
  if (dias === null) {
    return <Text variant="micro-caption" className="text-muted-foreground/50">—</Text>;
  }
  const className =
    dias < 3
      ? 'bg-destructive/10 text-destructive'
      : dias < 7
        ? 'bg-warning/10 text-warning'
        : 'bg-success/10 text-success';
  return (
    <Text
      variant="micro-badge"
      className={cn('inline-flex items-center rounded px-1.5 py-0.5', className)}
    >
      {dias < 0 ? `${Math.abs(dias)}d atrás` : `${dias}d`}
    </Text>
  );
}

/**
 * Lista das comunicações capturadas no estilo glass row — padrão AudienciasGlassList.
 * Substitui o antigo GazetteDataTable (HTML table), corrige o problema de
 * largura comprimida e alinha ao DS.
 */
export function CapturadasGlassList({
  comunicacoes,
  onSelect,
  densidade = 'padrao',
  selectedId = null,
}: CapturadasGlassListProps) {
  const rowPy = DENSITY_ROW[densidade];

  if (comunicacoes.length === 0) {
    return (
      <EmptyState
        icon={FileSearch}
        title="Nenhuma comunicação nesta visualização"
        description="Ajuste filtros, mude de aba ou sincronize novas comunicações."
      />
    );
  }

  return (
    <GlassPanel className="overflow-hidden p-0">
      {/* Header */}
      <div
        className={cn(
          'grid items-center gap-3 border-b border-border/30 px-4 py-2',
          'grid-cols-[64px_minmax(0,1fr)_140px_76px_80px_80px_96px_32px]',
        )}
      >
        <Text variant="overline" className="text-muted-foreground/70">Tipo</Text>
        <Text variant="overline" className="text-muted-foreground/70">Processo / Partes</Text>
        <Text variant="overline" className="text-muted-foreground/70">Órgão</Text>
        <Text variant="overline" className="text-muted-foreground/70">Fonte</Text>
        <Text variant="overline" className="text-muted-foreground/70">Data</Text>
        <Text variant="overline" className="text-muted-foreground/70">Prazo</Text>
        <Text variant="overline" className="text-muted-foreground/70">Status</Text>
        <span aria-hidden />
      </div>

      {/* Rows */}
      {comunicacoes.map((c, idx) => {
        const tipo = getTipoBadge(c.tipoComunicacao);
        const partesAutor = c.partesAutor.join(', ');
        const partesReu = c.partesReu.join(', ');
        const partesLabel = [partesAutor, partesReu].filter(Boolean).join(' · ');
        const data = c.dataDisponibilizacao
          ? new Date(c.dataDisponibilizacao).toLocaleDateString('pt-BR', {
              day: '2-digit',
              month: '2-digit',
              year: '2-digit',
            })
          : '—';
        const isSelected = selectedId === c.id;
        const isLast = idx === comunicacoes.length - 1;

        return (
          <button
            key={c.id}
            type="button"
            onClick={() => onSelect(c)}
            className={cn(
              'grid w-full cursor-pointer items-center gap-3 px-4 text-left transition-colors duration-100',
              'grid-cols-[64px_minmax(0,1fr)_140px_76px_80px_80px_96px_32px]',
              rowPy,
              !isLast && 'border-b border-border/20',
              'hover:bg-muted/40',
              isSelected && 'border-l-2 border-l-primary bg-primary/5',
            )}
          >
            <Text
              variant="micro-badge"
              className={cn(
                'inline-flex items-center rounded px-2 py-0.5',
                tipo.className,
              )}
            >
              {tipo.label}
            </Text>

            <div className="flex min-w-0 flex-col gap-0.5">
              <span className="truncate text-sm font-medium tabular-nums text-foreground">
                {c.numeroProcessoMascara ?? c.numeroProcesso}
              </span>
              {partesLabel && (
                <Text variant="micro-caption" className="truncate">
                  {partesLabel}
                </Text>
              )}
            </div>

            <Text variant="micro-caption" className="truncate">
              {c.nomeOrgao ?? c.siglaTribunal ?? '—'}
            </Text>

            <TribunalBadge codigo={c.siglaTribunal} />

            <Text variant="micro-caption" className="whitespace-nowrap tabular-nums">
              {data}
            </Text>

            <PrazoBadge dias={c.diasParaPrazo} />

            <StatusCell status={c.statusVinculacao} diasParaPrazo={c.diasParaPrazo} />

            <span
              className="flex size-7 items-center justify-center rounded text-muted-foreground/60"
              aria-hidden
            >
              <MoreHorizontal className="size-3.5" />
            </span>
          </button>
        );
      })}
    </GlassPanel>
  );
}
