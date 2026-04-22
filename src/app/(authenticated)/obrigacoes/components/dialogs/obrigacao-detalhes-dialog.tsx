'use client';

/**
 * Dialog de Detalhes de Obrigação
 * Segue o padrão canônico do Glass Briefing (capa de processo + bloco KPI + seções).
 */

import * as React from 'react';
import Link from 'next/link';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  ArrowDown,
  ArrowUp,
  CheckCircle2,
  Clock,
  FileText,
  Link as LinkIcon,
  ExternalLink,
  RefreshCw,
  AlertCircle,
  X,
} from 'lucide-react';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { SemanticBadge } from '@/components/ui/semantic-badge';
import { Text } from '@/components/ui/typography';
import { GRAU_LABELS } from '@/lib/design-system';
import { cn } from '@/lib/utils';

import {
  DIRECAO_LABELS,
  TIPO_LABELS,
  type ObrigacaoComDetalhes,
  type StatusObrigacao,
  type StatusSincronizacao,
} from '../../domain';
import { formatCurrency } from '../../utils';
import { PrestacaoContasSection } from '../prestacao-contas';

// ============================================================================
// Props
// ============================================================================

interface ObrigacaoDetalhesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  obrigacao?: ObrigacaoComDetalhes | null;
  onSincronizar?: (obrigacao: ObrigacaoComDetalhes) => void;
  onVerLancamento?: (obrigacao: ObrigacaoComDetalhes) => void;
}

// ============================================================================
// Constantes visuais
// ============================================================================

const SINCRONIZACAO_CONFIG: Record<
  StatusSincronizacao,
  { label: string; icon: React.ComponentType<{ className?: string }>; tone: 'success' | 'warning' | 'destructive' | 'muted' }
> = {
  sincronizado: { label: 'Sincronizado', icon: CheckCircle2, tone: 'success' },
  pendente: { label: 'Pendente de sincronização', icon: Clock, tone: 'warning' },
  inconsistente: { label: 'Inconsistente', icon: AlertCircle, tone: 'destructive' },
  nao_aplicavel: { label: 'Não aplicável', icon: Clock, tone: 'muted' },
};

const STATUS_OBRIGACAO_LABELS: Record<StatusObrigacao, string> = {
  pendente: 'Pendente',
  vencida: 'Vencida',
  efetivada: 'Efetivada',
  cancelada: 'Cancelada',
  estornada: 'Estornada',
};

// ============================================================================
// Helpers
// ============================================================================

function formatarData(data: string | null | undefined): string {
  if (!data) return '—';
  return format(parseISO(data), "dd 'de' MMM 'de' yyyy", { locale: ptBR });
}

function formatarDataCurta(data: string | null | undefined): string {
  if (!data) return '—';
  return format(parseISO(data), 'dd/MM/yyyy', { locale: ptBR });
}

function diasAteVencimentoLabel(dias: number | null): string | null {
  if (dias === null) return null;
  if (dias === 0) return 'Vence hoje';
  if (dias > 0) return `Em ${dias} dia${dias > 1 ? 's' : ''}`;
  const abs = Math.abs(dias);
  return `Vencido há ${abs} dia${abs > 1 ? 's' : ''}`;
}

// ============================================================================
// Sub-components (padrão canônico)
// ============================================================================

function SectionHeader({
  icon: Icon,
  label,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
}) {
  return (
    <div className="flex items-center gap-2 mb-2.5">
      <Icon className="size-3.5 text-primary" />
      <Text variant="overline" className="text-muted-foreground">
        {label}
      </Text>
    </div>
  );
}

function SectionCard({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'rounded-[14px] bg-muted/40 border border-border/30 p-[14px_16px]',
        className,
      )}
    >
      {children}
    </div>
  );
}

function MetaDot() {
  return (
    <span
      aria-hidden
      className="inline-block size-1 rounded-full bg-muted-foreground/50"
    />
  );
}

function InfoRow({
  label,
  value,
  valueClassName,
}: {
  label: string;
  value: React.ReactNode;
  valueClassName?: string;
}) {
  return (
    <div className="min-w-0">
      <Text variant="label" className="mb-0.5">
        {label}
      </Text>
      <div
        className={cn(
          'text-[13px] font-medium text-foreground/90 leading-snug',
          valueClassName,
        )}
      >
        {value || '—'}
      </div>
    </div>
  );
}

// ============================================================================
// Component
// ============================================================================

export function ObrigacaoDetalhesDialog({
  open,
  onOpenChange,
  obrigacao,
  onSincronizar,
  onVerLancamento,
}: ObrigacaoDetalhesDialogProps) {
  if (!obrigacao) return null;

  const processo = obrigacao.processo;
  const parteAutora = processo?.nome_parte_autora?.trim() || null;
  const parteRe = processo?.nome_parte_re?.trim() || null;
  const tituloPartes =
    parteAutora && parteRe
      ? `${parteAutora} × ${parteRe}`
      : parteAutora || parteRe || obrigacao.descricao;

  const numeroProcesso = processo?.numero_processo || null;
  const classeJudicial = processo?.classe_judicial?.trim() || null;
  const trt = processo?.trt || null;
  const grauLabel = processo?.grau ? GRAU_LABELS[processo.grau] || processo.grau : null;
  const orgaoJulgador = processo?.descricao_orgao_julgador?.trim() || null;

  const isParcela = obrigacao.tipoEntidade === 'parcela';
  const isRecebimento = obrigacao.direcao === 'recebimento';
  const diasLabel = diasAteVencimentoLabel(obrigacao.diasAteVencimento);
  const sincConfig = SINCRONIZACAO_CONFIG[obrigacao.statusSincronizacao];
  const SincIcon = sincConfig.icon;

  const podeVerLancamento = obrigacao.lancamentoId != null && onVerLancamento != null;
  const podeSincronizar =
    isParcela &&
    (obrigacao.statusSincronizacao === 'pendente' ||
      obrigacao.statusSincronizacao === 'inconsistente') &&
    onSincronizar != null;
  const temAcordo = obrigacao.acordoId != null;
  const temProcesso = obrigacao.processoId != null;

  const handleClose = () => onOpenChange(false);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] flex flex-col p-0 gap-0 overflow-hidden sm:max-w-2xl [scrollbar-width:thin]">
        <DialogDescription className="sr-only">
          Detalhes da obrigação financeira
        </DialogDescription>

        {/* ══════════ HEADER · Capa do processo ══════════ */}
        <div className="shrink-0 px-6 pt-5 pb-4 border-b border-border/50">
          <div className="flex items-center justify-between gap-4 mb-1.5">
            <DialogTitle className="flex-1 min-w-0 text-[16px] font-semibold text-foreground leading-[1.3] -tracking-[0.01em] truncate">
              {tituloPartes}
            </DialogTitle>

            <SemanticBadge
              category="obrigacao_status"
              value={obrigacao.status}
              className="text-[10px]"
            >
              {STATUS_OBRIGACAO_LABELS[obrigacao.status] || obrigacao.status}
            </SemanticBadge>

            <button
              type="button"
              onClick={handleClose}
              className="shrink-0 inline-flex items-center justify-center size-7 rounded-lg text-muted-foreground/60 hover:text-foreground hover:bg-muted/60 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              aria-label="Fechar"
            >
              <X className="size-4" />
            </button>
          </div>

          {(numeroProcesso || trt || orgaoJulgador) && (
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[12px] font-medium text-muted-foreground">
              {numeroProcesso && <span>{numeroProcesso}</span>}
              {classeJudicial && (
                <>
                  <MetaDot />
                  <span>{classeJudicial}</span>
                </>
              )}
              {(trt || grauLabel) && (
                <>
                  <MetaDot />
                  <span>
                    {trt}
                    {trt && grauLabel && ' · '}
                    {grauLabel}
                  </span>
                </>
              )}
              {orgaoJulgador && (
                <>
                  <MetaDot />
                  <span className="truncate max-w-[16rem]" title={orgaoJulgador}>
                    {orgaoJulgador}
                  </span>
                </>
              )}
            </div>
          )}
        </div>

        {/* ══════════ BLOCO PRINCIPAL · Tipo, valor e vencimento ══════════ */}
        <div className="shrink-0 mx-6 mt-4 p-4 rounded-xl bg-primary/5 border border-primary/15">
          <div className="flex items-start gap-3 mb-3.5">
            <div className="flex-1 min-w-0">
              <p className="text-[14.5px] font-semibold text-foreground leading-tight">
                {TIPO_LABELS[obrigacao.tipo] || obrigacao.tipo}
              </p>
              <Text variant="caption" className="text-muted-foreground mt-0.5 block">
                {obrigacao.descricao}
              </Text>
            </div>
            {obrigacao.direcao && (
              <span
                className={cn(
                  'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10.5px] font-semibold border shrink-0',
                  isRecebimento
                    ? 'bg-success/10 text-success border-success/25'
                    : 'bg-destructive/10 text-destructive border-destructive/25',
                )}
              >
                {isRecebimento ? (
                  <ArrowDown className="size-2.5" />
                ) : (
                  <ArrowUp className="size-2.5" />
                )}
                {DIRECAO_LABELS[obrigacao.direcao] || obrigacao.direcao}
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 gap-5 pb-3.5 mb-3.5 border-b border-border/40">
            <div className="flex flex-col gap-1">
              <Text variant="label" className="text-muted-foreground/80">
                Valor
              </Text>
              <Text
                variant="kpi-value"
                className="text-[22px] leading-tight tabular-nums"
              >
                {formatCurrency(obrigacao.valor)}
              </Text>
            </div>
            <div className="flex flex-col gap-1">
              <Text variant="label" className="text-muted-foreground/80">
                Vencimento
              </Text>
              <Text
                variant="kpi-value"
                className={cn(
                  'text-[17px] leading-tight tabular-nums',
                  obrigacao.status === 'vencida' && 'text-destructive',
                )}
              >
                {formatarDataCurta(obrigacao.dataVencimento)}
              </Text>
              {diasLabel && (
                <Text
                  variant="meta-label"
                  className={cn(
                    obrigacao.status === 'vencida' && 'text-destructive/80',
                  )}
                >
                  {diasLabel}
                </Text>
              )}
            </div>
          </div>

          {/* Ações rápidas */}
          <div className="flex flex-wrap gap-1.5">
            {temAcordo && (
              <Button
                asChild
                size="sm"
                variant="default"
                className="h-7 px-2.5 rounded-lg text-[11.5px] gap-1.5"
              >
                <Link
                  href={`/obrigacoes/${obrigacao.acordoId}`}
                  onClick={handleClose}
                >
                  <FileText className="size-3" />
                  Ver acordo
                </Link>
              </Button>
            )}
            {temProcesso && (
              <Button
                asChild
                size="sm"
                variant="outline"
                className="h-7 px-2.5 rounded-lg text-[11.5px] gap-1.5"
              >
                <Link
                  href={`/processos/${obrigacao.processoId}`}
                  onClick={handleClose}
                >
                  <ExternalLink className="size-3" />
                  Ver processo
                </Link>
              </Button>
            )}
            {podeVerLancamento && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => onVerLancamento?.(obrigacao)}
                className="h-7 px-2.5 rounded-lg text-[11.5px] gap-1.5"
              >
                <LinkIcon className="size-3" />
                Ver lançamento
              </Button>
            )}
            {podeSincronizar && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => onSincronizar?.(obrigacao)}
                className="h-7 px-2.5 rounded-lg text-[11.5px] gap-1.5"
              >
                <RefreshCw className="size-3" />
                Sincronizar
              </Button>
            )}
          </div>
        </div>

        {/* ══════════ BODY scrollável ══════════ */}
        <div className="flex-1 overflow-y-auto px-6 py-4 [scrollbar-width:thin]">
          <div className="space-y-4">
            {/* Sincronização */}
            <div>
              <SectionHeader icon={RefreshCw} label="Sincronização" />
              <SectionCard>
                <div className="flex items-center gap-2">
                  <SincIcon
                    className={cn(
                      'size-4 shrink-0',
                      sincConfig.tone === 'success' && 'text-success',
                      sincConfig.tone === 'warning' && 'text-warning',
                      sincConfig.tone === 'destructive' && 'text-destructive',
                      sincConfig.tone === 'muted' && 'text-muted-foreground/60',
                    )}
                  />
                  <Text variant="caption" className="text-foreground/90 font-medium">
                    {sincConfig.label}
                  </Text>
                </div>
              </SectionCard>
            </div>

            {/* Datas */}
            <div>
              <SectionHeader icon={Clock} label="Datas" />
              <SectionCard className="grid grid-cols-2 gap-x-4 gap-y-3">
                <InfoRow
                  label="Data de lançamento"
                  value={formatarData(obrigacao.dataLancamento)}
                />
                <InfoRow
                  label="Data de efetivação"
                  value={formatarData(obrigacao.dataEfetivacao)}
                  valueClassName={
                    obrigacao.dataEfetivacao ? 'text-success' : undefined
                  }
                />
              </SectionCard>
            </div>

            {/* Prestação de contas — só para parcelas */}
            {isParcela && (
              <div>
                <SectionHeader icon={FileText} label="Prestação de contas" />
                <SectionCard className="p-0 overflow-hidden">
                  <div className="p-[14px_16px]">
                    <PrestacaoContasSection parcelaId={obrigacao.id} />
                  </div>
                </SectionCard>
              </div>
            )}
          </div>
        </div>

        {/* ══════════ FOOTER ══════════ */}
        <div className="shrink-0 px-6 py-3 border-t border-border/50 flex items-center justify-end bg-card/40">
          <Button variant="outline" size="sm" onClick={handleClose}>
            Fechar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
