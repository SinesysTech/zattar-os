'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { parseISO, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  ArrowLeft, ArrowDown, ArrowUp, Edit, Trash2, Clock} from 'lucide-react';
import { toast } from 'sonner';

import { GlassPanel } from '@/components/shared/glass-panel';
import { TabPills } from '@/components/dashboard/tab-pills';
import { SemanticBadge } from '@/components/ui/semantic-badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Heading, Text } from '@/components/ui/typography';
import { GRAU_LABELS } from '@/lib/design-system';
import { cn } from '@/lib/utils';

import {
  formatCurrency,
  EditParcelaDialog,
  IntegracaoFinanceiraSection,
  ParcelasTable,
  STATUS_LABELS,
  STATUS_REPASSE_LABELS,
  TIPO_LABELS,
  DIRECAO_LABELS,
} from '@/app/(authenticated)/obrigacoes';
import type {
  AcordoComParcelas,
  Parcela,
} from '@/app/(authenticated)/obrigacoes';
import {
  actionBuscarAcordo,
  actionDeletarAcordo,
} from '@/app/(authenticated)/obrigacoes/actions';

import { AcordoPulseStrip } from '../components/shared/acordo-pulse-strip';

import { LoadingSpinner } from "@/components/ui/loading-state"
// =============================================================================
// TYPES
// =============================================================================

interface AcordoDetalhesClientProps {
  initialAcordo: AcordoComParcelas;
  acordoId: number;
}

type TabId = 'resumo' | 'parcelas' | 'repasses' | 'timeline';

// =============================================================================
// COMPONENT
// =============================================================================

export function AcordoDetalhesClient({
  initialAcordo,
  acordoId,
}: AcordoDetalhesClientProps) {
  const router = useRouter();

  const [acordo, setAcordo] = React.useState<AcordoComParcelas>(initialAcordo);
  const [activeTab, setActiveTab] = React.useState<TabId>('resumo');
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = React.useState(false);
  const [editDialog, setEditDialog] = React.useState<{
    open: boolean;
    parcela: Parcela | null;
  }>({ open: false, parcela: null });

  // ---------- Reload acordo (após mutações) ----------
  const reloadAcordo = React.useCallback(async () => {
    const result = await actionBuscarAcordo(acordoId);
    if (result.success && result.data) {
      setAcordo(result.data);
    }
  }, [acordoId]);

  // ---------- Delete ----------
  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const result = await actionDeletarAcordo(acordoId);
      if (result.success) {
        toast.success('Acordo deletado com sucesso');
        router.push('/obrigacoes/lista');
      } else {
        toast.error(result.error || 'Erro ao deletar');
      }
    } catch {
      toast.error('Erro ao comunicar com o servidor');
    } finally {
      setIsDeleting(false);
      setIsDeleteOpen(false);
    }
  };

  // ---------- Tab counts ----------
  const parcelas = acordo.parcelas ?? [];
  const repassesRelevantes = parcelas.filter(
    (p) =>
      p.statusRepasse === 'pendente_declaracao' ||
      p.statusRepasse === 'pendente_transferencia' ||
      p.statusRepasse === 'repassado',
  );

  const tabs = [
    { id: 'resumo' as TabId, label: 'Resumo' },
    { id: 'parcelas' as TabId, label: 'Parcelas', count: parcelas.length },
    {
      id: 'repasses' as TabId,
      label: 'Repasses',
      count: repassesRelevantes.length,
    },
    { id: 'timeline' as TabId, label: 'Timeline' },
  ];

  const isRecebimento = acordo.direcao === 'recebimento';

  // ---------- Capa do processo (mesma hierarquia do processo-header) ----------
  const processo = acordo.processo;
  const parteAutora = processo?.nome_parte_autora?.trim() || null;
  const parteRe = processo?.nome_parte_re?.trim() || null;
  const tituloPartes =
    parteAutora && parteRe
      ? `${parteAutora} × ${parteRe}`
      : parteAutora || parteRe || `${TIPO_LABELS[acordo.tipo]} #${acordo.id}`;
  const classeJudicial = processo?.classe_judicial?.trim() || null;
  const orgaoJulgador = processo?.descricao_orgao_julgador?.trim() || null;
  const grauLabel = processo?.grau ? GRAU_LABELS[processo.grau] || processo.grau : null;

  // ---------- Render ----------
  return (
    <div className={cn("flex flex-col inline-default h-full")}>
      {/* ==================== HEADER · Capa do processo ==================== */}
      <div className={cn("flex items-start justify-between inline-default flex-wrap")}>
        <div className={cn("flex items-start inline-medium min-w-0 flex-1")}>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Voltar"
            asChild
            className="mt-0.5 shrink-0"
          >
            <Link href="/obrigacoes/lista">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div className={cn("flex flex-col min-w-0 stack-tight")}>
            <div className={cn("flex items-center inline-tight flex-wrap")}>
              <Heading level="page" className="min-w-0 truncate">
                {tituloPartes}
              </Heading>
              <SemanticBadge
                category="obrigacao_status"
                value={acordo.status}
                className="text-[10px]"
              >
                {STATUS_LABELS[acordo.status]}
              </SemanticBadge>
              <span
                className={cn(
                  /* design-system-escape: px-2 padding direcional sem Inset equiv.; py-0.5 padding direcional sem Inset equiv.; */ 'inline-flex items-center inline-nano rounded-full px-2 py-0.5 text-[10px] font-semibold border',
                  isRecebimento
                    ? 'bg-success/10 text-success border-success/25'
                    : 'bg-destructive/10 text-destructive border-destructive/25',
                )}
              >
                {isRecebimento ? (
                  <ArrowDown className="w-2.5 h-2.5" />
                ) : (
                  <ArrowUp className="w-2.5 h-2.5" />
                )}
                {DIRECAO_LABELS[acordo.direcao]}
              </span>
            </div>

            <div className={cn("flex flex-wrap items-center gap-x-3 gap-y-1.5 text-body-sm")}>
              {processo?.trt && (
                <SemanticBadge
                  category="tribunal"
                  value={processo.trt}
                  className="text-[10px]"
                >
                  {processo.trt}
                </SemanticBadge>
              )}
              {grauLabel && processo?.grau && (
                <SemanticBadge
                  category="grau"
                  value={processo.grau}
                  className="text-[10px]"
                >
                  {grauLabel}
                </SemanticBadge>
              )}
              {processo?.numero_processo && (
                <Text
                  variant="caption"
                  className={cn( "font-medium text-foreground/85 tabular-nums")}
                >
                  {processo.numero_processo}
                </Text>
              )}
              {classeJudicial && (
                <Text variant="caption" className="text-muted-foreground">
                  {classeJudicial}
                </Text>
              )}
              {orgaoJulgador && (
                <Text
                  variant="caption"
                  className="text-muted-foreground truncate max-w-[18rem]"
                >
                  {orgaoJulgador}
                </Text>
              )}
              <Text variant="meta-label" className="text-muted-foreground/70">
                {TIPO_LABELS[acordo.tipo]} #{acordo.id}
              </Text>
            </div>
          </div>
        </div>

        <div className={cn("flex inline-tight shrink-0")}>
          <Button variant="outline" size="sm" asChild className="rounded-xl">
            <Link href={`/obrigacoes/${acordoId}/editar`}>
              <Edit className="size-3.5 mr-1" />
              Editar
            </Link>
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="rounded-xl text-destructive hover:text-destructive hover:bg-destructive/5"
            onClick={() => setIsDeleteOpen(true)}
            disabled={isDeleting}
          >
            <Trash2 className="size-3.5 mr-1" />
            Excluir
          </Button>
        </div>
      </div>

      {/* ==================== PULSE STRIP ==================== */}
      <AcordoPulseStrip acordo={acordo} />

      {/* ==================== TABS ==================== */}
      <TabPills
        tabs={tabs}
        active={activeTab}
        onChange={(id) => setActiveTab(id as TabId)}
      />

      {/* ==================== TAB CONTENT ==================== */}
      <div className={cn("flex-1 min-h-0 overflow-y-auto pr-1")}>
        {activeTab === 'resumo' && <ResumoTab acordo={acordo} />}

        {activeTab === 'parcelas' && (
          <GlassPanel depth={1} className={cn("inset-card-compact")}>
            <ParcelasTable
              parcelas={parcelas}
              direcao={acordo.direcao}
              onParcelaUpdated={reloadAcordo}
              acordoCondenacaoId={acordo.id}
              onEdit={(parcela) => setEditDialog({ open: true, parcela })}
            />
            <div className="mt-4">
              <IntegracaoFinanceiraSection
                acordoId={acordo.id}
                onSyncComplete={reloadAcordo}
              />
            </div>
          </GlassPanel>
        )}

        {activeTab === 'repasses' && (
          <RepassesTab parcelas={repassesRelevantes} acordo={acordo} />
        )}

        {activeTab === 'timeline' && <TimelineTab acordo={acordo} />}
      </div>

      {/* ==================== DIALOGS ==================== */}
      {editDialog.parcela && (
        <EditParcelaDialog
          open={editDialog.open}
          onOpenChange={(open) => setEditDialog((prev) => ({ ...prev, open }))}
          parcela={editDialog.parcela}
          acordoCondenacaoId={acordoId}
          onSuccess={() => {
            reloadAcordo();
            setEditDialog({ open: false, parcela: null });
          }}
        />
      )}

      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar exclusão</DialogTitle>
            <DialogDescription>
              Esta ação não pode ser desfeita. Todas as parcelas e repasses
              vinculados serão removidos permanentemente.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeleteOpen(false)}
              disabled={isDeleting}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <LoadingSpinner className="mr-1" />
                  Excluindo...
                </>
              ) : (
                'Confirmar exclusão'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// =============================================================================
// TABS (sub-components)
// =============================================================================

function ResumoTab({ acordo }: { acordo: AcordoComParcelas }) {
  // Dados do processo já vivem no header da página — aqui focamos apenas
  // no que é particular ao acordo (tipo, valor, parcelamento, distribuição).

  return (
    <div className={cn("flex flex-col stack-default")}>
      <GlassPanel depth={1} className={cn("inset-default-plus")}>
        <Heading level="section" className="mb-4">
          Dados do acordo
        </Heading>
        <dl className={cn("grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 inline-default-plus")}>
          <Field label="Tipo" value={TIPO_LABELS[acordo.tipo]} />
          <Field label="Direção" value={DIRECAO_LABELS[acordo.direcao]} />
          <Field
            label="Valor total"
            value={formatCurrency(acordo.valorTotal)}
            emphasis
          />
          <Field label="Número de parcelas" value={`${acordo.numeroParcelas}x`} />
          <Field
            label="1ª parcela"
            value={format(
              parseISO(acordo.dataVencimentoPrimeiraParcela),
              "dd 'de' MMM 'de' yyyy",
              { locale: ptBR },
            )}
          />
          {acordo.formaDistribuicao && (
            <Field
              label="Distribuição"
              value={acordo.formaDistribuicao}
              className="capitalize"
            />
          )}
          {acordo.percentualEscritorio !== undefined && (
            <Field
              label="% Escritório"
              value={`${acordo.percentualEscritorio}%`}
            />
          )}
          {acordo.percentualCliente !== undefined && (
            <Field label="% Cliente" value={`${acordo.percentualCliente}%`} />
          )}
          {acordo.honorariosSucumbenciaisTotal !== undefined &&
            acordo.honorariosSucumbenciaisTotal > 0 && (
              <Field
                label="Hon. sucumbenciais"
                value={formatCurrency(acordo.honorariosSucumbenciaisTotal)}
              />
            )}
          <Field
            label="Criado em"
            value={format(parseISO(acordo.createdAt), 'dd/MM/yyyy')}
          />
          <Field
            label="Atualizado em"
            value={format(parseISO(acordo.updatedAt), 'dd/MM/yyyy')}
          />
        </dl>
        {acordo.observacoes && (
          <div className={cn("mt-5 pt-4 border-t border-border/15")}>
            <Text variant="label" className="mb-1.5">
              Observações
            </Text>
            <Text variant="caption" className="whitespace-pre-wrap">
              {acordo.observacoes}
            </Text>
          </div>
        )}
      </GlassPanel>
    </div>
  );
}

function RepassesTab({
  parcelas,
  acordo,
}: {
  parcelas: Parcela[];
  acordo: AcordoComParcelas;
}) {
  if (parcelas.length === 0) {
    return (
      <GlassPanel depth={1} className={cn(/* design-system-escape: p-10 → usar <Inset> */ "p-10 text-center")}>
        <Text variant="caption" className="text-muted-foreground/60">
          Nenhum repasse associado a este acordo.
        </Text>
      </GlassPanel>
    );
  }

  return (
    <div className={cn("flex flex-col stack-tight")}>
      {parcelas.map((parcela) => {
        const valorRepasse = parcela.valorRepasseCliente ?? 0;
        const toneClass =
          parcela.statusRepasse === 'repassado'
            ? 'bg-success/10 text-success border-success/20'
            : parcela.statusRepasse === 'pendente_declaracao'
            ? 'bg-warning/10 text-warning border-warning/20'
            : 'bg-info/10 text-info border-info/20';

        return (
          <GlassPanel key={parcela.id} depth={1} className={cn("inset-card-compact")}>
            <div className={cn("flex items-center justify-between inline-medium flex-wrap")}>
              <div className="min-w-0">
                <div className={cn("flex items-center inline-tight")}>
                  <Text variant="caption" className={cn( "font-medium text-foreground/85")}>Parcela {parcela.numeroParcela}</Text>
                  <span
                    className={cn(
                      /* design-system-escape: px-1.5 padding direcional sem Inset equiv.; py-0.5 padding direcional sem Inset equiv.; */ 'inline-flex items-center rounded px-1.5 py-0.5 border text-[9px] font-semibold',
                      toneClass,
                    )}
                  >
                    {STATUS_REPASSE_LABELS[parcela.statusRepasse]}
                  </span>
                </div>
                <Text variant="meta-label" className="mt-1">
                  Venc:{' '}
                  {format(parseISO(parcela.dataVencimento), 'dd/MM/yyyy')}
                  {parcela.dataRepasse &&
                    ` · Repassada em ${format(parseISO(parcela.dataRepasse), 'dd/MM/yyyy')}`}
                </Text>
              </div>
              <div className="text-right">
                <Text variant="kpi-value" className={cn("text-body")}>
                  {formatCurrency(valorRepasse)}
                </Text>
                <Text variant="meta-label" className="tabular-nums">
                  {acordo.percentualCliente}% do cliente
                </Text>
              </div>
            </div>
          </GlassPanel>
        );
      })}
    </div>
  );
}

function TimelineTab({ acordo }: { acordo: AcordoComParcelas }) {
  const events: { icon: React.ComponentType<{ className?: string }>; label: string; date: string; tone: 'primary' | 'success' | 'warning' }[] = [];

  events.push({
    icon: Clock,
    label: 'Acordo criado',
    date: acordo.createdAt,
    tone: 'primary',
  });

  const parcelasPagas = (acordo.parcelas ?? [])
    .filter((p) => p.dataEfetivacao)
    .sort((a, b) =>
      (a.dataEfetivacao ?? '').localeCompare(b.dataEfetivacao ?? ''),
    );

  for (const parcela of parcelasPagas) {
    events.push({
      icon: Clock,
      label: `Parcela ${parcela.numeroParcela} efetivada`,
      date: parcela.dataEfetivacao!,
      tone: 'success',
    });
    if (parcela.dataRepasse) {
      events.push({
        icon: Clock,
        label: `Repasse da parcela ${parcela.numeroParcela}`,
        date: parcela.dataRepasse,
        tone: 'warning',
      });
    }
  }

  if (events.length <= 1) {
    return (
      <GlassPanel depth={1} className={cn(/* design-system-escape: p-10 → usar <Inset> */ "p-10 text-center")}>
        <Text variant="caption" className="text-muted-foreground/60">
          Histórico ainda sem movimentações além da criação.
        </Text>
      </GlassPanel>
    );
  }

  return (
    <GlassPanel depth={1} className={cn("inset-default-plus")}>
      <ol className={cn("flex flex-col relative border-l border-border/20 ml-2 stack-default-plus")}>
        {events.map((event, idx) => {
          const Icon = event.icon;
          const dotClass =
            event.tone === 'success'
              ? 'bg-success'
              : event.tone === 'warning'
              ? 'bg-warning'
              : 'bg-primary';
          return (
            <li key={idx} className="ml-5 relative">
              <span
                className={cn(
                  'absolute -left-[1.65rem] top-1 w-3 h-3 rounded-full ring-2 ring-background',
                  dotClass,
                )}
              />
              <div className={cn("flex items-center inline-tight")}>
                <Icon className="w-3.5 h-3.5 text-muted-foreground/50" />
                <Text variant="caption" className={cn( "font-medium text-foreground/85")}>{event.label}</Text>
              </div>
              <Text variant="meta-label" className="mt-0.5">
                {format(parseISO(event.date), "dd 'de' MMM 'de' yyyy", {
                  locale: ptBR,
                })}
              </Text>
            </li>
          );
        })}
      </ol>
    </GlassPanel>
  );
}

// =============================================================================
// HELPERS
// =============================================================================

function Field({
  label,
  value,
  emphasis,
  className,
}: {
  label: string;
  value: string;
  emphasis?: boolean;
  className?: string;
}) {
  return (
    <div className={cn('min-w-0', className)}>
      <Text variant="label" className="mb-1">
        {label}
      </Text>
      <Text
        variant={emphasis ? 'kpi-value' : 'caption'}
        className={cn(
          'wrap-break-word',
          emphasis ? 'text-body-lg' :  'font-medium text-foreground/85',
        )}
      >
        {value}
      </Text>
    </div>
  );
}
