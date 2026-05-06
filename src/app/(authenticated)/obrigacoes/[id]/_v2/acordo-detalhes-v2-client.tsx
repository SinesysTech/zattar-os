'use client';

import * as React from 'react';
import Link from 'next/link';
import { parseISO, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  ArrowLeft,
  ArrowDown,
  ArrowUp,
  Edit,
  Trash2,
  Clock,
  FileText,
} from 'lucide-react';
import { toast } from 'sonner';

import { GlassPanel } from '@/components/shared/glass-panel';
import { TabPills } from '@/components/dashboard/tab-pills';
import { SemanticBadge } from '@/components/ui/semantic-badge';
import { Button } from '@/components/ui/button';
import { Heading, Text } from '@/components/ui/typography';
import { GRAU_LABELS } from '@/lib/design-system';
import { cn } from '@/lib/utils';

import {
  formatCurrency,
  AcordoPulseStrip,
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

import { ProximaParcelaCard } from './proxima-parcela-card';
import { SplitFinanceiro } from './split-financeiro';
import { CronogramaParcelas } from './cronograma-parcelas';
import { ProcessoVinculadoCard } from './processo-vinculado-card';

// =============================================================================
// TYPES
// =============================================================================

interface AcordoDetalhesV2ClientProps {
  initialAcordo: AcordoComParcelas;
  acordoId: number;
  /** Se true, desabilita mutações (usado no /preview com dados mocados). */
  readOnly?: boolean;
}

type TabId = 'resumo' | 'parcelas' | 'repasses' | 'timeline';

// =============================================================================
// COMPONENT
// =============================================================================

export function AcordoDetalhesV2Client({
  initialAcordo,
  acordoId,
  readOnly = false,
}: AcordoDetalhesV2ClientProps) {
  const [acordo] = React.useState<AcordoComParcelas>(initialAcordo);
  const [activeTab, setActiveTab] = React.useState<TabId>('resumo');
  const [editDialog, setEditDialog] = React.useState<{
    open: boolean;
    parcela: Parcela | null;
  }>({ open: false, parcela: null });

  const parcelas = React.useMemo(
    () => acordo.parcelas ?? [],
    [acordo.parcelas],
  );
  const repassesRelevantes = parcelas.filter(
    (p) =>
      p.statusRepasse === 'pendente_declaracao' ||
      p.statusRepasse === 'pendente_transferencia' ||
      p.statusRepasse === 'repassado',
  );

  const proximaParcela = React.useMemo(() => {
    return (
      parcelas
        .filter((p) => p.status === 'pendente' || p.status === 'atrasada')
        .sort((a, b) => a.dataVencimento.localeCompare(b.dataVencimento))[0] ??
      null
    );
  }, [parcelas]);

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

  // ---------- Capa do processo ----------
  const processo = acordo.processo;
  const parteAutora = processo?.nome_parte_autora?.trim() || null;
  const parteRe = processo?.nome_parte_re?.trim() || null;
  const tituloPartes =
    parteAutora && parteRe
      ? `${parteAutora} × ${parteRe}`
      : parteAutora || parteRe || `${TIPO_LABELS[acordo.tipo]} #${acordo.id}`;
  const grauLabel = processo?.grau ? GRAU_LABELS[processo.grau] || processo.grau : null;

  const handleMarcarProxima = () => {
    if (readOnly) {
      toast.info('Preview: ação desabilitada no modo somente leitura.');
      return;
    }
    if (!proximaParcela) return;
    setEditDialog({ open: true, parcela: proximaParcela });
  };

  const handleVerProxima = () => {
    if (!proximaParcela) return;
    setActiveTab('parcelas');
  };

  const handleSelecionarParcela = (parcela: Parcela) => {
    if (readOnly) {
      toast.info(`Parcela ${parcela.numeroParcela} — preview.`);
      return;
    }
    setEditDialog({ open: true, parcela });
  };

  return (
    <div className={cn("flex flex-col inline-default h-full")}>
      {/* ==================== HEADER ==================== */}
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
          <div className={cn("min-w-0 stack-tight")}>
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
                  /* design-system-escape: px-2 padding direcional sem Inset equiv.; py-0.5 padding direcional sem Inset equiv.; font-semibold → className de <Text>/<Heading> */ 'inline-flex items-center inline-nano rounded-full px-2 py-0.5 text-[10px] font-semibold border',
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
                  className={cn(/* design-system-escape: font-medium → className de <Text>/<Heading> */ "font-medium text-foreground/85 tabular-nums")}
                >
                  {processo.numero_processo}
                </Text>
              )}
              {processo?.classe_judicial && (
                <Text variant="caption" className="text-muted-foreground">
                  {processo.classe_judicial}
                </Text>
              )}
              {processo?.descricao_orgao_julgador && (
                <Text
                  variant="caption"
                  className="text-muted-foreground truncate max-w-[18rem]"
                >
                  {processo.descricao_orgao_julgador}
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
            disabled={readOnly}
          >
            <Trash2 className="size-3.5 mr-1" />
            Excluir
          </Button>
        </div>
      </div>

      {/* ==================== PULSE STRIP (mantém existente) ==================== */}
      <AcordoPulseStrip acordo={acordo} />

      {/* ==================== TABS ==================== */}
      <TabPills
        tabs={tabs}
        active={activeTab}
        onChange={(id) => setActiveTab(id as TabId)}
      />

      {/* ==================== TAB CONTENT ==================== */}
      <div className={cn(/* design-system-escape: pr-1 padding direcional sem Inset equiv. */ "flex-1 min-h-0 overflow-y-auto pr-1")}>
        {activeTab === 'resumo' && (
          <ResumoTab
            acordo={acordo}
            proximaParcela={proximaParcela}
            onMarcarProxima={handleMarcarProxima}
            onVerProxima={handleVerProxima}
            onSelecionarParcela={handleSelecionarParcela}
          />
        )}

        {activeTab === 'parcelas' && (
          <GlassPanel depth={1} className={cn("inset-card-compact")}>
            <ParcelasTable
              parcelas={parcelas}
              direcao={acordo.direcao}
              onParcelaUpdated={() => {}}
              acordoCondenacaoId={acordo.id}
              onEdit={(parcela) =>
                setEditDialog({ open: true, parcela })
              }
            />
            {!readOnly && (
              <div className="mt-4">
                <IntegracaoFinanceiraSection
                  acordoId={acordo.id}
                  onSyncComplete={() => {}}
                />
              </div>
            )}
          </GlassPanel>
        )}

        {activeTab === 'repasses' && (
          <RepassesTab parcelas={repassesRelevantes} acordo={acordo} />
        )}

        {activeTab === 'timeline' && <TimelineTab acordo={acordo} />}
      </div>

      {/* ==================== DIALOGS ==================== */}
      {editDialog.parcela && !readOnly && (
        <EditParcelaDialog
          open={editDialog.open}
          onOpenChange={(open) =>
            setEditDialog((prev) => ({ ...prev, open }))
          }
          parcela={editDialog.parcela}
          acordoCondenacaoId={acordoId}
          onSuccess={() => {
            setEditDialog({ open: false, parcela: null });
          }}
        />
      )}
    </div>
  );
}

// =============================================================================
// TABS (sub-components)
// =============================================================================

function ResumoTab({
  acordo,
  proximaParcela,
  onMarcarProxima,
  onVerProxima,
  onSelecionarParcela,
}: {
  acordo: AcordoComParcelas;
  proximaParcela: Parcela | null;
  onMarcarProxima: () => void;
  onVerProxima: () => void;
  onSelecionarParcela: (parcela: Parcela) => void;
}) {
  const parcelas = acordo.parcelas ?? [];

  return (
    <div className={cn("stack-default")}>
      {/* Row 1 — Ação + Split */}
      <div className={cn("grid grid-cols-1 lg:grid-cols-5 inline-default")}>
        <div className="lg:col-span-2">
          <ProximaParcelaCard
            parcela={proximaParcela}
            direcao={acordo.direcao}
            onMarcarRecebida={onMarcarProxima}
            onVerParcela={onVerProxima}
          />
        </div>
        <div className="lg:col-span-3">
          <SplitFinanceiro acordo={acordo} />
        </div>
      </div>

      {/* Row 2 — Cronograma */}
      {parcelas.length > 0 && (
        <CronogramaParcelas
          parcelas={parcelas}
          onSelecionar={onSelecionarParcela}
        />
      )}

      {/* Row 3 — Detalhes + Processo */}
      <div className={cn("grid grid-cols-1 lg:grid-cols-2 inline-default")}>
        <DetalhesAcordoCard acordo={acordo} />
        <ProcessoVinculadoCard processo={acordo.processo} />
      </div>

      {/* Row 4 — Observações */}
      {acordo.observacoes && <ObservacoesCard observacoes={acordo.observacoes} />}
    </div>
  );
}

function DetalhesAcordoCard({ acordo }: { acordo: AcordoComParcelas }) {
  const rows: Array<{ label: string; value: string }> = [];

  if (acordo.formaDistribuicao) {
    rows.push({
      label: 'Distribuição',
      value:
        acordo.formaDistribuicao === 'integral'
          ? 'Integral'
          : 'Dividido',
    });
  }
  rows.push({
    label: '% Escritório',
    value: `${acordo.percentualEscritorio}%`,
  });
  rows.push({
    label: '% Cliente',
    value: `${acordo.percentualCliente}%`,
  });
  if ((acordo.honorariosSucumbenciaisTotal ?? 0) > 0) {
    rows.push({
      label: 'Sucumbência',
      value: formatCurrency(acordo.honorariosSucumbenciaisTotal),
    });
  }
  rows.push({
    label: 'Número de parcelas',
    value: `${acordo.numeroParcelas}x`,
  });
  rows.push({
    label: '1ª parcela',
    value: format(
      parseISO(acordo.dataVencimentoPrimeiraParcela),
      "dd 'de' MMM 'de' yyyy",
      { locale: ptBR },
    ),
  });
  rows.push({
    label: 'Criado em',
    value: format(parseISO(acordo.createdAt), 'dd/MM/yyyy'),
  });
  rows.push({
    label: 'Atualizado',
    value: format(parseISO(acordo.updatedAt), 'dd/MM/yyyy'),
  });

  return (
    <GlassPanel depth={1} className={cn(/* design-system-escape: p-5 → usar <Inset> */ "p-5")}>
      <Text variant="meta-label" className="text-muted-foreground/60 mb-4">
        Detalhes do acordo
      </Text>
      <dl className="grid grid-cols-2 gap-x-4 gap-y-3">
        {rows.map((r) => (
          <div key={r.label} className="min-w-0">
            <Text
              variant="meta-label"
              className="text-muted-foreground/55"
            >
              {r.label}
            </Text>
            <Text
              variant="caption"
              className={cn(/* design-system-escape: font-medium → className de <Text>/<Heading> */ "font-medium text-foreground/85 tabular-nums block mt-0.5 truncate")}
            >
              {r.value}
            </Text>
          </div>
        ))}
      </dl>
    </GlassPanel>
  );
}

function ObservacoesCard({ observacoes }: { observacoes: string }) {
  return (
    <GlassPanel depth={1} className={cn(/* design-system-escape: p-5 → usar <Inset> */ "p-5")}>
      <div className={cn("flex items-center inline-tight mb-3")}>
        <FileText className="size-3.5 text-muted-foreground/60" />
        <Text variant="meta-label" className="text-muted-foreground/60">
          Observações
        </Text>
      </div>
      <Text
        variant="caption"
        className={cn(/* design-system-escape: leading-relaxed sem token DS */ "whitespace-pre-wrap text-foreground/80 leading-relaxed")}
      >
        {observacoes}
      </Text>
    </GlassPanel>
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
    <div className={cn("stack-tight")}>
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
                  <Text
                    variant="caption"
                    className={cn(/* design-system-escape: font-medium → className de <Text>/<Heading> */ "font-medium text-foreground/85")}
                  >
                    Parcela {parcela.numeroParcela}
                  </Text>
                  <span
                    className={cn(
                      /* design-system-escape: px-1.5 padding direcional sem Inset equiv.; py-0.5 padding direcional sem Inset equiv.; font-semibold → className de <Text>/<Heading> */ 'inline-flex items-center rounded px-1.5 py-0.5 border text-[9px] font-semibold',
                      toneClass,
                    )}
                  >
                    {STATUS_REPASSE_LABELS[parcela.statusRepasse]}
                  </span>
                </div>
                <Text variant="meta-label" className="mt-1">
                  Venc: {format(parseISO(parcela.dataVencimento), 'dd/MM/yyyy')}
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
  const events: {
    icon: React.ComponentType<{ className?: string }>;
    label: string;
    date: string;
    tone: 'primary' | 'success' | 'warning';
  }[] = [];

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
    <GlassPanel depth={1} className={cn(/* design-system-escape: p-5 → usar <Inset> */ "p-5")}>
      <ol className={cn(/* design-system-escape: space-y-5 sem token DS */ "relative border-l border-border/20 ml-2 space-y-5")}>
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
                <Text
                  variant="caption"
                  className={cn(/* design-system-escape: font-medium → className de <Text>/<Heading> */ "font-medium text-foreground/85")}
                >
                  {event.label}
                </Text>
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

