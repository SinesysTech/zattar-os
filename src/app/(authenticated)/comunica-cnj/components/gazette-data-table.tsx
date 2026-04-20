'use client';

import { MoreHorizontal, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Text } from '@/components/ui/typography';
import { useGazetteStore } from './hooks/use-gazette-store';
import type { ComunicacaoCNJEnriquecida } from '@/app/(authenticated)/comunica-cnj/domain';

// ─── Badge Maps ────────────────────────────────────────────────────────────────

const TIPO_BADGE_MAP: Record<string, { label: string; className: string }> = {
  intimacao: { label: 'INT', className: 'bg-info/10 text-info' },
  intimação: { label: 'INT', className: 'bg-info/10 text-info' },
  despacho: { label: 'DES', className: 'bg-warning/10 text-warning' },
  sentenca: { label: 'SEN', className: 'bg-chart-3/10 text-chart-3' },
  sentença: { label: 'SEN', className: 'bg-chart-3/10 text-chart-3' },
  edital: { label: 'EDIT', className: 'bg-success/10 text-success' },
  certidao: { label: 'CERT', className: 'bg-muted/30 text-muted-foreground' },
  certidão: { label: 'CERT', className: 'bg-muted/30 text-muted-foreground' },
};

function getTipoBadge(tipo: string | null): { label: string; className: string } {
  if (!tipo) return { label: '—', className: 'bg-muted/30 text-muted-foreground' };
  const key = tipo.toLowerCase();
  return (
    TIPO_BADGE_MAP[key] ?? { label: tipo.slice(0, 4).toUpperCase(), className: 'bg-muted/30 text-muted-foreground' }
  );
}

// ─── Density Padding Map ───────────────────────────────────────────────────────

const DENSITY_TD_CLASS: Record<string, string> = {
  compacto: 'py-1.5',
  padrao: 'py-2.5',
  confortavel: 'py-3',
};

// ─── Prazo Badge ──────────────────────────────────────────────────────────────

function PrazoBadge({ dias }: { dias: number | null }) {
  if (dias === null) {
    return <Text variant="micro-caption" className="text-muted-foreground/40">—</Text>;
  }

  const className =
    dias < 3
      ? 'bg-destructive/10 text-destructive'
      : dias < 7
        ? 'bg-warning/10 text-warning'
        : 'bg-success/10 text-success';

  const label = dias < 0 ? `${Math.abs(dias)}d atrás` : `${dias}d`;

  return (
    <Text
      variant="micro-badge"
      className={cn('inline-flex items-center rounded px-1.5 py-0.5', className)}
    >
      {label}
    </Text>
  );
}

// ─── Status Dot ───────────────────────────────────────────────────────────────

function StatusCell({ item }: { item: ComunicacaoCNJEnriquecida }) {
  const { statusVinculacao, matchSugestao } = item;

  if (statusVinculacao === 'vinculado') {
    return (
      <div className="flex items-center gap-1.5">
        <span className="size-2 shrink-0 rounded-full bg-success" aria-hidden />
        <Text variant="micro-caption" className="text-success">Vinculado</Text>
      </div>
    );
  }

  if (statusVinculacao === 'pendente') {
    return (
      <div className="flex items-center gap-1.5">
        <span className="size-2 shrink-0 rounded-full bg-warning" aria-hidden />
        <Text variant="micro-caption" className="text-warning">Pendente</Text>
      </div>
    );
  }

  if (statusVinculacao === 'orfao') {
    return (
      <div className="flex items-center gap-1.5">
        <span
          className="size-2 shrink-0 rounded-full border-2 border-warning"
          aria-hidden
        />
        <Text variant="micro-caption" className="text-warning">Órfão</Text>
        {matchSugestao && (
          <Text
            variant="micro-badge"
            className="inline-flex items-center rounded bg-info/10 px-1 py-0.5 uppercase tracking-wide text-info"
          >
            AI
          </Text>
        )}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1.5">
      <span className="size-2 shrink-0 rounded-full bg-muted-foreground/30" aria-hidden />
      <Text variant="micro-caption">—</Text>
    </div>
  );
}

// ─── Pagination Footer ────────────────────────────────────────────────────────

interface PaginationFooterProps {
  total: number;
  page: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
}

function PaginationFooter({
  total,
  page,
  pageSize,
  onPageChange,
  onPageSizeChange,
}: PaginationFooterProps) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const start = (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, total);

  return (
    <div className="flex shrink-0 items-center justify-between border-t border-border/50 px-4 py-2">
      {/* Left: range info */}
      <Text variant="micro-caption">
        {total > 0 ? `${start}–${end} de ${total}` : '0 resultados'}
      </Text>

      {/* Center: page buttons */}
      <div className="flex items-center gap-1">
        <button
          type="button"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          className={cn(
            'flex size-7 items-center justify-center rounded border border-border/50 transition-colors',
            page <= 1
              ? 'cursor-not-allowed opacity-30'
              : 'cursor-pointer hover:bg-muted/30',
          )}
          aria-label="Página anterior"
        >
          <ChevronLeft className="size-3.5" aria-hidden />
        </button>
        {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
          const pageNum = i + 1;
          return (
            <button
              key={pageNum}
              type="button"
              onClick={() => onPageChange(pageNum)}
              className={cn(
                'size-7 rounded border text-xs transition-colors',
                page === pageNum
                  ? 'border-primary bg-primary/10 font-medium text-primary'
                  : 'cursor-pointer border-border/50 hover:bg-muted/30',
              )}
            >
              {pageNum}
            </button>
          );
        })}
        {totalPages > 5 && (
          <Text variant="micro-caption" className="px-1 text-muted-foreground/50">…</Text>
        )}
        <button
          type="button"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
          className={cn(
            'flex size-7 items-center justify-center rounded border border-border/50 transition-colors',
            page >= totalPages
              ? 'cursor-not-allowed opacity-30'
              : 'cursor-pointer hover:bg-muted/30',
          )}
          aria-label="Próxima página"
        >
          <ChevronRight className="size-3.5" aria-hidden />
        </button>
      </div>

      {/* Right: page size selector */}
      <div className="flex items-center gap-1.5">
        <Text variant="micro-caption">Por página</Text>
        <select
          value={pageSize}
          onChange={(e) => onPageSizeChange(Number(e.target.value))}
          className="cursor-pointer rounded border border-border/50 bg-background px-1.5 py-0.5 text-xs focus:outline-none focus:ring-1 focus:ring-primary/50"
        >
          {[25, 50, 100].map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>
    </div>
  );
}

// ─── GazetteDataTable ─────────────────────────────────────────────────────────

export interface GazetteDataTableProps {
  /** Total items for pagination (defaults to comunicacoes.length) */
  total?: number;
  page?: number;
  pageSize?: number;
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
}

export function GazetteDataTable({
  total,
  page = 1,
  pageSize = 50,
  onPageChange,
  onPageSizeChange,
}: GazetteDataTableProps) {
  const { comunicacoes, comunicacaoSelecionada, selecionarComunicacao, densidade } =
    useGazetteStore();

  const tdPy = DENSITY_TD_CLASS[densidade] ?? 'py-2.5';
  const effectiveTotal = total ?? comunicacoes.length;

  return (
    <div className="flex flex-col h-full min-h-0 overflow-hidden">
      {/* Scrollable table area */}
      <div className="flex-1 overflow-auto min-h-0">
        <table className="w-full border-collapse text-left">
          {/* ── Header ── */}
          <thead className="sticky top-0 z-10 bg-background">
            <tr className="border-b border-border/60">
              {/* Tipo */}
              <th
                scope="col"
                style={{ width: 72, minWidth: 72 }}
                className="px-3 py-2 text-overline text-muted-foreground/60"
              >
                Tipo
              </th>
              {/* Processo / Partes */}
              <th
                scope="col"
                className="px-3 py-2 text-overline text-muted-foreground/60"
              >
                Processo / Partes
              </th>
              {/* Órgão */}
              <th
                scope="col"
                style={{ width: 160, minWidth: 120 }}
                className="px-3 py-2 text-overline text-muted-foreground/60"
              >
                Órgão
              </th>
              {/* Fonte */}
              <th
                scope="col"
                style={{ width: 80, minWidth: 80 }}
                className="px-3 py-2 text-overline text-muted-foreground/60"
              >
                Fonte
              </th>
              {/* Data */}
              <th
                scope="col"
                style={{ width: 70, minWidth: 70 }}
                className="px-3 py-2 text-overline text-muted-foreground/60"
              >
                Data
              </th>
              {/* Prazo */}
              <th
                scope="col"
                style={{ width: 80, minWidth: 80 }}
                className="px-3 py-2 text-overline text-muted-foreground/60"
              >
                Prazo
              </th>
              {/* Status */}
              <th
                scope="col"
                style={{ width: 100, minWidth: 100 }}
                className="px-3 py-2 text-overline text-muted-foreground/60"
              >
                Status
              </th>
              {/* Actions */}
              <th
                scope="col"
                style={{ width: 40, minWidth: 40 }}
                className="px-3 py-2 text-overline text-muted-foreground/60"
              >
                <span className="sr-only">Ações</span>
              </th>
            </tr>
          </thead>

          {/* ── Body ── */}
          <tbody>
            {comunicacoes.length === 0 && (
              <tr>
                <td colSpan={8} className="px-3 py-10 text-center">
                  <Text variant="caption" className="text-muted-foreground">
                    Nenhuma comunicação encontrada
                  </Text>
                </td>
              </tr>
            )}

            {comunicacoes.map((item) => {
              const isSelected = comunicacaoSelecionada?.id === item.id;
              const tipoBadge = getTipoBadge(item.tipoComunicacao);

              // Partes string
              const partesAutor = item.partesAutor?.join(', ') ?? '';
              const partesReu = item.partesReu?.join(', ') ?? '';
              const partesLabel = [partesAutor, partesReu].filter(Boolean).join(' • ');

              return (
                <tr
                  key={item.id}
                  onClick={() => selecionarComunicacao(item)}
                  className={cn(
                    'cursor-pointer border-b border-border/40 transition-colors duration-100',
                    'hover:bg-muted/40',
                    isSelected && 'border-l-2 border-l-primary bg-primary/5',
                  )}
                >
                  {/* Tipo */}
                  <td className={cn('px-3', tdPy)} style={{ width: 72 }}>
                    <Text
                      variant="micro-badge"
                      className={cn(
                        'inline-flex items-center rounded px-2 py-0.5',
                        tipoBadge.className,
                      )}
                    >
                      {tipoBadge.label}
                    </Text>
                  </td>

                  {/* Processo / Partes */}
                  <td className={cn('px-3', tdPy)}>
                    <div className="flex min-w-0 flex-col gap-0.5">
                      <span className="truncate text-sm font-medium tabular-nums text-foreground">
                        {item.numeroProcessoMascara ?? item.numeroProcesso}
                      </span>
                      {partesLabel && (
                        <Text variant="micro-caption" className="truncate">
                          {partesLabel}
                        </Text>
                      )}
                    </div>
                  </td>

                  {/* Órgão */}
                  <td className={cn('px-3', tdPy)} style={{ width: 160 }}>
                    <Text variant="micro-caption" className="block max-w-40 truncate">
                      {item.nomeOrgao ?? item.siglaTribunal ?? '—'}
                    </Text>
                  </td>

                  {/* Fonte */}
                  <td className={cn('px-3', tdPy)} style={{ width: 80 }}>
                    <Text
                      variant="micro-badge"
                      className="inline-flex items-center rounded border border-border bg-muted/30 px-1.5 py-0.5 text-muted-foreground"
                    >
                      {item.siglaTribunal ?? '—'}
                    </Text>
                  </td>

                  {/* Data */}
                  <td className={cn('px-3', tdPy)} style={{ width: 70 }}>
                    <Text variant="micro-caption" className="whitespace-nowrap tabular-nums">
                      {item.dataDisponibilizacao
                        ? new Date(item.dataDisponibilizacao).toLocaleDateString('pt-BR', {
                            day: '2-digit',
                            month: '2-digit',
                            year: '2-digit',
                          })
                        : '—'}
                    </Text>
                  </td>

                  {/* Prazo */}
                  <td className={cn('px-3', tdPy)} style={{ width: 80 }}>
                    <PrazoBadge dias={item.diasParaPrazo} />
                  </td>

                  {/* Status */}
                  <td className={cn('px-3', tdPy)} style={{ width: 100 }}>
                    <StatusCell item={item} />
                  </td>

                  {/* Actions */}
                  <td className={cn('px-3', tdPy)} style={{ width: 40 }}>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        selecionarComunicacao(item);
                      }}
                      className="flex size-7 cursor-pointer items-center justify-center rounded text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
                      aria-label="Mais opções"
                    >
                      <MoreHorizontal className="size-3.5" aria-hidden />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* ── Pagination Footer ── */}
      {(onPageChange || onPageSizeChange) && (
        <PaginationFooter
          total={effectiveTotal}
          page={page}
          pageSize={pageSize}
          onPageChange={onPageChange ?? (() => {})}
          onPageSizeChange={onPageSizeChange ?? (() => {})}
        />
      )}
    </div>
  );
}
