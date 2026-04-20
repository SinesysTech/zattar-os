'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { parseISO, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  ArrowLeft,
  ArrowDown,
  ArrowUp,
  Edit,
  Trash2,
  Loader2,
  Clock,
} from 'lucide-react';
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

  // ---------- Render ----------
  return (
    <div className="flex flex-col gap-4 h-full">
      {/* ==================== HEADER ==================== */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-start gap-3">
          <Button
            variant="ghost"
            size="icon"
            aria-label="Voltar"
            asChild
            className="mt-0.5"
          >
            <Link href="/obrigacoes/lista">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <Heading level="page">
                {TIPO_LABELS[acordo.tipo]} #{acordo.id}
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
                  'inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 text-[10px] font-semibold',
                  isRecebimento
                    ? 'bg-success/10 text-success border border-success/20'
                    : 'bg-destructive/10 text-destructive border border-destructive/20',
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
            <Text variant="meta-label" className="mt-1">
              {acordo.processo?.numero_processo
                ? `Processo ${acordo.processo.numero_processo}`
                : `Processo #${acordo.processoId}`}
              {acordo.processo?.nome_parte_autora &&
                acordo.processo?.nome_parte_re &&
                ` · ${acordo.processo.nome_parte_autora} vs. ${acordo.processo.nome_parte_re}`}
            </Text>
          </div>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" size="sm" asChild className="h-8 text-xs">
            <Link href={`/obrigacoes/${acordoId}/editar`}>
              <Edit className="h-3.5 w-3.5 mr-1" />
              Editar
            </Link>
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-8 text-xs text-destructive hover:text-destructive hover:bg-destructive/5"
            onClick={() => setIsDeleteOpen(true)}
            disabled={isDeleting}
          >
            <Trash2 className="h-3.5 w-3.5 mr-1" />
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
      <div className="flex-1 min-h-0 overflow-y-auto pr-1">
        {activeTab === 'resumo' && <ResumoTab acordo={acordo} />}

        {activeTab === 'parcelas' && (
          <GlassPanel depth={1} className="p-4">
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
        <DialogContent className="glass-dialog">
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
                  <Loader2 className="h-4 w-4 mr-1 animate-spin" />
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
  const processo = acordo.processo;

  return (
    <div className="space-y-4">
      {/* Dados do acordo */}
      <GlassPanel depth={1} className="p-5">
        <Heading level="section" className="mb-4">
          Dados do acordo
        </Heading>
        <dl className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
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
          <div className="mt-5 pt-4 border-t border-border/15">
            <Text variant="label" className="mb-1.5">
              Observações
            </Text>
            <Text variant="caption" className="whitespace-pre-wrap">
              {acordo.observacoes}
            </Text>
          </div>
        )}
      </GlassPanel>

      {/* Processo vinculado */}
      {processo && (
        <GlassPanel depth={1} className="p-5">
          <Heading level="section" className="mb-4">
            Processo vinculado
          </Heading>
          <dl className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <Field label="Número" value={processo.numero_processo} />
            <Field label="Tribunal" value={processo.trt} />
            <Field label="Grau" value={processo.grau} />
            <Field label="Classe" value={processo.classe_judicial || '—'} />
            <Field
              label="Parte autora"
              value={processo.nome_parte_autora || '—'}
            />
            <Field label="Parte ré" value={processo.nome_parte_re || '—'} />
            <Field
              label="Órgão julgador"
              value={processo.descricao_orgao_julgador || '—'}
              className="md:col-span-2"
            />
          </dl>
        </GlassPanel>
      )}
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
      <GlassPanel depth={1} className="p-10 text-center">
        <Text variant="caption" className="text-muted-foreground/60">
          Nenhum repasse associado a este acordo.
        </Text>
      </GlassPanel>
    );
  }

  return (
    <div className="space-y-2">
      {parcelas.map((parcela) => {
        const valorRepasse = parcela.valorRepasseCliente ?? 0;
        const toneClass =
          parcela.statusRepasse === 'repassado'
            ? 'bg-success/10 text-success border-success/20'
            : parcela.statusRepasse === 'pendente_declaracao'
            ? 'bg-warning/10 text-warning border-warning/20'
            : 'bg-info/10 text-info border-info/20';

        return (
          <GlassPanel key={parcela.id} depth={1} className="p-4">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <Text variant="caption" className="font-medium text-foreground/85">Parcela {parcela.numeroParcela}</Text>
                  <span
                    className={cn(
                      'inline-flex items-center rounded px-1.5 py-0.5 border text-[9px] font-semibold',
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
                <Text variant="kpi-value" className="text-base">
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
      <GlassPanel depth={1} className="p-10 text-center">
        <Text variant="caption" className="text-muted-foreground/60">
          Histórico ainda sem movimentações além da criação.
        </Text>
      </GlassPanel>
    );
  }

  return (
    <GlassPanel depth={1} className="p-5">
      <ol className="relative border-l border-border/20 ml-2 space-y-5">
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
              <div className="flex items-center gap-2">
                <Icon className="w-3.5 h-3.5 text-muted-foreground/50" />
                <Text variant="caption" className="font-medium text-foreground/85">{event.label}</Text>
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
          emphasis ? 'text-lg' : 'font-medium text-foreground/85',
        )}
      >
        {value}
      </Text>
    </div>
  );
}
