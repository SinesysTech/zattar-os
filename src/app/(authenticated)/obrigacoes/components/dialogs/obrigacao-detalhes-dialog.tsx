'use client';

/**
 * Dialog de Detalhes de Obrigação
 * Segue o padrão canônico do Glass Briefing (capa de processo + bloco KPI + seções).
 */

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';
import {
  ArrowDown,
  ArrowUp,
  Check,
  CheckCircle2,
  Clock,
  FileText,
  Link as LinkIcon,
  ExternalLink,
  Pencil,
  RefreshCw,
  AlertCircle,
  X,
} from 'lucide-react';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { LoadingSpinner } from '@/components/ui/loading-state';
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
import {
  actionAtualizarAcordo,
  actionAtualizarParcela,
  actionMarcarParcelaRecebida,
} from '../../actions';
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
    <div className={cn("flex items-center inline-tight mb-2.5")}>
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
          /* design-system-escape: leading-snug sem token DS */ 'text-[13px] font-medium text-foreground/90 leading-snug',
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
  const router = useRouter();

  // ---------- Estado de edição inline (declarado antes de qualquer return) ----------
  const [editingValor, setEditingValor] = React.useState(false);
  const [valorDraft, setValorDraft] = React.useState('');
  const [savingValor, setSavingValor] = React.useState(false);

  const [editingVencimento, setEditingVencimento] = React.useState(false);
  const [vencimentoDraft, setVencimentoDraft] = React.useState('');
  const [savingVencimento, setSavingVencimento] = React.useState(false);

  const [efetivando, setEfetivando] = React.useState(false);
  const [dataEfetivacaoDraft, setDataEfetivacaoDraft] = React.useState('');
  const [savingEfetivacao, setSavingEfetivacao] = React.useState(false);

  // Reset dos drafts sempre que o dialog abre/fecha ou a obrigação muda
  React.useEffect(() => {
    if (!open) {
      setEditingValor(false);
      setEditingVencimento(false);
      setEfetivando(false);
    }
  }, [open, obrigacao?.id]);

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

  const podeMarcarRecebida =
    isParcela &&
    (obrigacao.status === 'pendente' || obrigacao.status === 'vencida');

  const handleClose = () => onOpenChange(false);

  // ---------- Edição: Valor ----------
  const handleStartEditValor = () => {
    setValorDraft(String(obrigacao.valor ?? ''));
    setEditingValor(true);
  };

  const handleSaveValor = async () => {
    const novoValor = parseFloat(valorDraft.replace(',', '.'));
    if (isNaN(novoValor) || novoValor <= 0) {
      toast.error('Informe um valor válido maior que zero');
      return;
    }
    setSavingValor(true);
    const result = isParcela
      ? await actionAtualizarParcela(obrigacao.id, {
          valorBrutoCreditoPrincipal: novoValor,
        })
      : await actionAtualizarAcordo(obrigacao.id, { valorTotal: novoValor });

    if (result.success) {
      toast.success('Valor atualizado');
      setEditingValor(false);
      router.refresh();
      onOpenChange(false);
    } else {
      toast.error(
        (result as { error?: string }).error || 'Erro ao atualizar valor',
      );
    }
    setSavingValor(false);
  };

  // ---------- Edição: Vencimento ----------
  const handleStartEditVencimento = () => {
    // <input type="date"> espera yyyy-MM-dd
    const iso = obrigacao.dataVencimento
      ? obrigacao.dataVencimento.slice(0, 10)
      : '';
    setVencimentoDraft(iso);
    setEditingVencimento(true);
  };

  const handleSaveVencimento = async () => {
    if (!vencimentoDraft) {
      toast.error('Informe uma data válida');
      return;
    }
    setSavingVencimento(true);
    const result = isParcela
      ? await actionAtualizarParcela(obrigacao.id, {
          dataVencimento: vencimentoDraft,
        })
      : await actionAtualizarAcordo(obrigacao.id, {
          dataVencimentoPrimeiraParcela: vencimentoDraft,
        });

    if (result.success) {
      toast.success('Vencimento atualizado');
      setEditingVencimento(false);
      router.refresh();
      onOpenChange(false);
    } else {
      toast.error(
        (result as { error?: string }).error || 'Erro ao atualizar vencimento',
      );
    }
    setSavingVencimento(false);
  };

  // ---------- Edição: Marcar como recebida ----------
  const handleStartEfetivacao = () => {
    setDataEfetivacaoDraft(format(new Date(), 'yyyy-MM-dd'));
    setEfetivando(true);
  };

  const handleMarcarRecebida = async () => {
    if (!dataEfetivacaoDraft) {
      toast.error('Informe a data de recebimento');
      return;
    }
    setSavingEfetivacao(true);
    const result = await actionMarcarParcelaRecebida(obrigacao.id, {
      dataRecebimento: dataEfetivacaoDraft,
    });
    if (result.success) {
      toast.success('Parcela marcada como recebida');
      setEfetivando(false);
      router.refresh();
      onOpenChange(false);
    } else {
      toast.error(
        (result as { error?: string }).error || 'Erro ao marcar como recebida',
      );
    }
    setSavingEfetivacao(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={cn("max-h-[92vh] flex flex-col inset-none inline-none overflow-hidden sm:max-w-2xl [scrollbar-width:thin]")}>
        <DialogDescription className="sr-only">
          Detalhes da obrigação financeira
        </DialogDescription>

        {/* ══════════ HEADER · Capa do processo ══════════ */}
        <DialogHeader className={cn(/* design-system-escape: px-6 padding direcional sem Inset equiv.; pt-5 padding direcional sem Inset equiv.; pb-4 padding direcional sem Inset equiv. */ "shrink-0 gap-0 px-6 pt-5 pb-4 border-b border-border/50")}>
          <div className={cn("flex items-center justify-between inline-default mb-1.5")}>
            <DialogTitle className={cn( "flex-1 min-w-0 text-[16px] font-semibold text-foreground leading-[1.3] -tracking-[0.01em] truncate")}>
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
            <div className={cn( "flex flex-wrap items-center gap-x-2 gap-y-1 text-[12px] font-medium text-muted-foreground")}>
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
        </DialogHeader>

        {/* ══════════ BLOCO PRINCIPAL · Tipo, valor e vencimento ══════════ */}
        <div className={cn("shrink-0 mx-6 mt-4 inset-card-compact rounded-xl bg-primary/5 border border-primary/15")}>
          <div className={cn("flex items-start inline-medium mb-3.5")}>
            <div className="flex-1 min-w-0">
              <p className={cn(/* design-system-escape: leading-tight sem token DS */ "text-[14.5px] font-semibold text-foreground leading-tight")}>
                {TIPO_LABELS[obrigacao.tipo] || obrigacao.tipo}
              </p>
              <Text variant="caption" className="text-muted-foreground mt-0.5 block">
                {obrigacao.descricao}
              </Text>
            </div>
            {obrigacao.direcao && (
              <span
                className={cn(
                  /* design-system-escape: px-2 padding direcional sem Inset equiv.; py-0.5 padding direcional sem Inset equiv.; */ 'inline-flex items-center inline-micro rounded-full px-2 py-0.5 text-[10.5px] font-semibold border shrink-0',
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

          <div className={cn("grid grid-cols-2 inline-default-plus pb-3.5 mb-3.5 border-b border-border/40")}>
            {/* ──────── Valor (editável) ──────── */}
            <div className={cn("flex flex-col inline-micro")}>
              <div className={cn("flex items-center justify-between inline-tight")}>
                <Text variant="label" className="text-muted-foreground/80">
                  Valor
                </Text>
                {!editingValor && (
                  <button
                    type="button"
                    onClick={handleStartEditValor}
                    className={cn( "text-[10px] font-semibold text-primary/70 hover:text-primary transition-colors cursor-pointer flex items-center inline-micro focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring rounded")}
                    aria-label="Editar valor"
                  >
                    <Pencil className="size-2.5" />
                    Editar
                  </button>
                )}
              </div>

              {editingValor ? (
                <div className={cn("flex items-center inline-snug min-w-0")}>
                  <span className={cn( "text-[13px] font-medium text-muted-foreground shrink-0")}>
                    R$
                  </span>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={valorDraft}
                    onChange={(e) => setValorDraft(e.target.value)}
                    className={cn("h-8 text-body-sm tabular-nums flex-1 min-w-0")}
                    autoFocus
                    disabled={savingValor}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSaveValor();
                      if (e.key === 'Escape') setEditingValor(false);
                    }}
                  />
                  <Button
                    size="icon"
                    variant="ghost"
                    className="size-7 shrink-0"
                    onClick={handleSaveValor}
                    disabled={savingValor}
                    aria-label="Salvar valor"
                  >
                    {savingValor ? (
                      <LoadingSpinner size="sm" />
                    ) : (
                      <Check className="size-3.5 text-success" />
                    )}
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="size-7 shrink-0"
                    onClick={() => setEditingValor(false)}
                    disabled={savingValor}
                    aria-label="Cancelar edição do valor"
                  >
                    <X className="size-3.5 text-muted-foreground" />
                  </Button>
                </div>
              ) : (
                <Text
                  variant="kpi-value"
                  className={cn("text-[22px] leading-tight tabular-nums")}
                >
                  {formatCurrency(obrigacao.valor)}
                </Text>
              )}
            </div>

            {/* ──────── Vencimento (editável) ──────── */}
            <div className={cn("flex flex-col inline-micro")}>
              <div className={cn("flex items-center justify-between inline-tight")}>
                <Text variant="label" className="text-muted-foreground/80">
                  Vencimento
                </Text>
                {!editingVencimento && (
                  <button
                    type="button"
                    onClick={handleStartEditVencimento}
                    className={cn( "text-[10px] font-semibold text-primary/70 hover:text-primary transition-colors cursor-pointer flex items-center inline-micro focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring rounded")}
                    aria-label="Editar vencimento"
                  >
                    <Pencil className="size-2.5" />
                    Editar
                  </button>
                )}
              </div>

              {editingVencimento ? (
                <div className={cn("flex items-center inline-snug min-w-0")}>
                  <Input
                    type="date"
                    value={vencimentoDraft}
                    onChange={(e) => setVencimentoDraft(e.target.value)}
                    className={cn("h-8 text-body-sm tabular-nums flex-1 min-w-0")}
                    autoFocus
                    disabled={savingVencimento}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSaveVencimento();
                      if (e.key === 'Escape') setEditingVencimento(false);
                    }}
                  />
                  <Button
                    size="icon"
                    variant="ghost"
                    className="size-7 shrink-0"
                    onClick={handleSaveVencimento}
                    disabled={savingVencimento}
                    aria-label="Salvar vencimento"
                  >
                    {savingVencimento ? (
                      <LoadingSpinner size="sm" />
                    ) : (
                      <Check className="size-3.5 text-success" />
                    )}
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="size-7 shrink-0"
                    onClick={() => setEditingVencimento(false)}
                    disabled={savingVencimento}
                    aria-label="Cancelar edição do vencimento"
                  >
                    <X className="size-3.5 text-muted-foreground" />
                  </Button>
                </div>
              ) : (
                <>
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
                </>
              )}
            </div>
          </div>

          {/* Ações rápidas */}
          <div className={cn("flex flex-wrap inline-snug")}>
            {temAcordo && (
              <Button
                asChild
                size="sm"
                variant="default"
                className={cn("flex h-7 px-2.5 rounded-lg text-[11.5px] inline-snug")}
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
                className={cn("flex h-7 px-2.5 rounded-lg text-[11.5px] inline-snug")}
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
                className={cn("flex h-7 px-2.5 rounded-lg text-[11.5px] inline-snug")}
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
                className={cn("flex h-7 px-2.5 rounded-lg text-[11.5px] inline-snug")}
              >
                <RefreshCw className="size-3" />
                Sincronizar
              </Button>
            )}
          </div>
        </div>

        {/* ══════════ BODY scrollável ══════════ */}
        <div className={cn("flex-1 overflow-y-auto px-6 py-4 [scrollbar-width:thin]")}>
          <div className={cn("flex flex-col stack-default")}>
            {/* Registrar recebimento — parcelas pendentes/vencidas */}
            {podeMarcarRecebida && (
              <div>
                <SectionHeader
                  icon={CheckCircle2}
                  label={
                    isRecebimento
                      ? 'Registrar recebimento'
                      : 'Registrar pagamento'
                  }
                />
                <SectionCard className="bg-success/5 border-success/25">
                  {efetivando ? (
                    <div className={cn("flex flex-col stack-tight")}>
                      <div>
                        <Text variant="label" className="mb-1 block">
                          {isRecebimento
                            ? 'Data do recebimento'
                            : 'Data do pagamento'}
                        </Text>
                        <Input
                          type="date"
                          value={dataEfetivacaoDraft}
                          onChange={(e) =>
                            setDataEfetivacaoDraft(e.target.value)
                          }
                          className={cn("h-8 text-body-sm tabular-nums")}
                          autoFocus
                          disabled={savingEfetivacao}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleMarcarRecebida();
                            if (e.key === 'Escape') setEfetivando(false);
                          }}
                        />
                      </div>
                      <div className={cn("flex justify-end inline-snug")}>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setEfetivando(false)}
                          disabled={savingEfetivacao}
                          className={cn("h-7 text-caption")}
                        >
                          Cancelar
                        </Button>
                        <Button
                          size="sm"
                          onClick={handleMarcarRecebida}
                          disabled={savingEfetivacao}
                          className={cn("h-7 text-caption")}
                        >
                          {savingEfetivacao && (
                            <LoadingSpinner size="sm" className="mr-1" />
                          )}
                          {isRecebimento
                            ? 'Confirmar recebimento'
                            : 'Confirmar pagamento'}
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className={cn("flex items-center justify-between inline-medium")}>
                      <Text variant="caption" className="text-foreground/80">
                        {isRecebimento
                          ? 'Esta parcela ainda não foi recebida.'
                          : 'Esta parcela ainda não foi paga.'}
                      </Text>
                      <Button
                        size="sm"
                        onClick={handleStartEfetivacao}
                        className={cn("flex h-7 px-3 rounded-lg text-[11.5px] inline-snug bg-success hover:bg-success/90 text-success-foreground")}
                      >
                        <CheckCircle2 className="size-3" />
                        {isRecebimento
                          ? 'Marcar como recebida'
                          : 'Marcar como paga'}
                      </Button>
                    </div>
                  )}
                </SectionCard>
              </div>
            )}

            {/* Sincronização */}
            <div>
              <SectionHeader icon={RefreshCw} label="Sincronização" />
              <SectionCard>
                <div className={cn("flex items-center inline-tight")}>
                  <SincIcon
                    className={cn(
                      'size-4 shrink-0',
                      sincConfig.tone === 'success' && 'text-success',
                      sincConfig.tone === 'warning' && 'text-warning',
                      sincConfig.tone === 'destructive' && 'text-destructive',
                      sincConfig.tone === 'muted' && 'text-muted-foreground/60',
                    )}
                  />
                  <Text variant="caption" className={cn( "text-foreground/90 font-medium")}>
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
                <SectionCard className={cn("inset-none overflow-hidden")}>
                  <div className="p-[14px_16px]">
                    <PrestacaoContasSection parcelaId={obrigacao.id} />
                  </div>
                </SectionCard>
              </div>
            )}
          </div>
        </div>

        {/* ══════════ FOOTER ══════════ */}
        <DialogFooter className={cn("shrink-0 px-6 py-3 border-t border-border/50 bg-card/40")}>
          <Button variant="outline" size="sm" onClick={handleClose}>
            Fechar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
