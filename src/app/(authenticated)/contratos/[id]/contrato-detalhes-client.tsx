'use client';

import { cn } from '@/lib/utils';
import * as React from 'react';
import { useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Wallet,
  FileText,
  History,
  ClipboardList,
  StickyNote,
  DollarSign,
  History as HistoryIcon,
  ArrowRight,
} from 'lucide-react';

import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { SemanticBadge } from '@/components/ui/semantic-badge';
import { Text } from '@/components/ui/typography';
import {
  DetailSection,
  DetailSectionCard,
} from '@/components/shared/detail-section';
import type {
  Contrato,
  ClienteDetalhado,
  ResponsavelDetalhado,
  SegmentoDetalhado,
  ContratoStatusHistorico,
  ContratoCompletoStats,
} from '@/app/(authenticated)/contratos';
import {
  STATUS_CONTRATO_LABELS,
  ContratoForm,
} from '@/app/(authenticated)/contratos';
import type { Lancamento } from '@/app/(authenticated)/financeiro/domain';
import type { EntrevistaTrabalhista, EntrevistaAnexo } from '@/app/(authenticated)/entrevistas-trabalhistas';
import { EntrevistaTab } from '@/app/(authenticated)/entrevistas-trabalhistas';
import { GerarPecaDialog } from '@/app/(authenticated)/pecas-juridicas';

import {
  ContratoDetalhesHeader,
  ContratoPartesCard,
  ContratoProcessosCard,
  ContratoFinanceiroCard,
  ContratoDocumentosCard,
  ContratoTimeline,
} from './components';
import { DocumentosContratacaoCard } from './components/documentos-contratacao-card';
import { ContratoTransitoriasAlert } from './components/contrato-transitorias-alert';
import { ContratoDocumentosAssinaturaCard } from './components/contrato-documentos-assinatura-card';
import type {
  DocumentoAssinaturaDoContrato,
  PacoteAtivoResumo,
} from '@/shared/assinatura-digital/services/documentos-do-contrato.service';

type TabValue = 'resumo' | 'financeiro' | 'documentos' | 'historico' | 'entrevista';

// =============================================================================
// HELPERS
// =============================================================================

function formatDateCompact(dateStr: string): string {
  try {
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(new Date(dateStr));
  } catch {
    return dateStr;
  }
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 0,
  }).format(value);
}

// =============================================================================
// SEÇÕES INLINE — Resumo
// =============================================================================

function ObservacoesSection({ texto }: { texto: string }) {
  return (
    <DetailSection icon={StickyNote} label="Observações">
      <DetailSectionCard>
        <p className={cn("text-caption text-foreground/90 leading-relaxed whitespace-pre-wrap")}>
          {texto}
        </p>
      </DetailSectionCard>
    </DetailSection>
  );
}

function FinanceiroResumoSection({ lancamentos }: { lancamentos: Lancamento[] }) {
  const totalReceitas = lancamentos
    .filter((l) => l.tipo === 'receita' && l.status !== 'cancelado' && l.status !== 'estornado')
    .reduce((acc, l) => acc + l.valor, 0);

  const totalPendente = lancamentos
    .filter((l) => l.status === 'pendente')
    .reduce((acc, l) => acc + l.valor, 0);

  const valorTotal = totalReceitas + totalPendente;
  const pctRecebido = valorTotal > 0 ? Math.round((totalReceitas / valorTotal) * 100) : 0;

  if (lancamentos.length === 0) {
    return (
      <DetailSection icon={DollarSign} label="Financeiro">
        <DetailSectionCard>
          <p className="text-caption text-muted-foreground/70 italic">
            Nenhum lançamento financeiro
          </p>
        </DetailSectionCard>
      </DetailSection>
    );
  }

  return (
    <DetailSection icon={DollarSign} label="Financeiro">
      <DetailSectionCard>
        <div className={cn("grid grid-cols-2 inline-medium mb-4")}>
          <div className={cn("flex flex-col inline-micro")}>
            <Text variant="meta-label">Recebido</Text>
            <Text
              variant="label"
              className={cn( "font-heading font-bold text-success tabular-nums text-[15px]")}
            >
              {formatCurrency(totalReceitas)}
            </Text>
          </div>
          <div className={cn("flex flex-col inline-micro")}>
            <Text variant="meta-label">Pendente</Text>
            <Text
              variant="label"
              className={cn( "font-heading font-bold text-warning tabular-nums text-[15px]")}
            >
              {formatCurrency(totalPendente)}
            </Text>
          </div>
        </div>
        <div>
          <div className="flex justify-between mb-1.5">
            <Text variant="caption" className={cn( "font-medium")}>
              Progresso de recebimento
            </Text>
            <Text variant="caption" className={cn( "text-primary font-bold tabular-nums")}>
              {pctRecebido}%
            </Text>
          </div>
          <div
            className="h-1 rounded-full bg-muted/60 overflow-hidden"
            role="progressbar"
            aria-valuenow={pctRecebido}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <div
              className="h-full rounded-full bg-primary transition-[width] duration-500"
              data-progress={pctRecebido}
              style={{ width: `${pctRecebido}%` }}
            />
          </div>
        </div>
      </DetailSectionCard>
    </DetailSection>
  );
}

function AtividadeRecenteSection({ historico }: { historico: ContratoStatusHistorico[] }) {
  if (historico.length === 0) return null;

  const sorted = [...historico]
    .sort((a, b) => new Date(b.changedAt).getTime() - new Date(a.changedAt).getTime())
    .slice(0, 3);

  return (
    <DetailSection icon={HistoryIcon} label="Últimas mudanças">
      <DetailSectionCard>
        <div className={cn(/* design-system-escape: gap-2.5 gap sem token DS */ "flex flex-col gap-2.5")}>
          {sorted.map((item) => {
            const toLabel = STATUS_CONTRATO_LABELS[item.toStatus] ?? item.toStatus;
            const fromLabel = item.fromStatus
              ? STATUS_CONTRATO_LABELS[item.fromStatus] ?? item.fromStatus
              : null;

            return (
              <div key={item.id} className={cn("flex items-center justify-between inline-medium")}>
                <div className={cn("inline-flex items-center inline-snug min-w-0")}>
                  {fromLabel ? (
                    <>
                      <Text
                        variant="caption"
                        className="whitespace-nowrap overflow-hidden text-ellipsis"
                      >
                        {fromLabel}
                      </Text>
                      <ArrowRight className="size-3 text-muted-foreground/60 shrink-0" />
                    </>
                  ) : null}
                  <SemanticBadge
                    category="status_contrato"
                    value={item.toStatus}
                    className="shrink-0"
                  >
                    {toLabel}
                  </SemanticBadge>
                </div>
                <Text
                  variant="micro-caption"
                  className="tabular-nums whitespace-nowrap"
                >
                  {formatDateCompact(item.changedAt)}
                </Text>
              </div>
            );
          })}
        </div>
      </DetailSectionCard>
    </DetailSection>
  );
}

// =============================================================================
// COMPONENTE PRINCIPAL
// =============================================================================

interface ContratoDetalhesClientProps {
  contrato: Contrato;
  cliente: ClienteDetalhado | null;
  responsavel: ResponsavelDetalhado | null;
  segmento: SegmentoDetalhado | null;
  stats: ContratoCompletoStats;
  lancamentos: Lancamento[];
  entrevista?: EntrevistaTrabalhista | null;
  entrevistaAnexos?: EntrevistaAnexo[];
  documentosAssinatura?: DocumentoAssinaturaDoContrato[];
  pacoteAssinaturaAtivo?: PacoteAtivoResumo | null;
}

export function ContratoDetalhesClient({
  contrato,
  cliente,
  responsavel,
  segmento,
  stats,
  lancamentos,
  entrevista = null,
  entrevistaAnexos = [],
  documentosAssinatura = [],
  pacoteAssinaturaAtivo = null,
}: ContratoDetalhesClientProps) {
  const router = useRouter();
  const clienteNome = cliente?.nome ?? `Cliente #${contrato.clienteId}`;

  const [activeTab, setActiveTab] = React.useState<TabValue>('resumo');
  const [editOpen, setEditOpen] = React.useState(false);
  const [gerarPecaOpen, setGerarPecaOpen] = React.useState(false);

  const handleEdit = React.useCallback(() => setEditOpen(true), []);
  const handleGerarPeca = React.useCallback(() => setGerarPecaOpen(true), []);
  const handleEnviarAssinatura = React.useCallback(() => {
    setActiveTab('documentos');
    if (typeof window !== 'undefined') {
      setTimeout(() => {
        document
          .getElementById('contrato-assinatura-card')
          ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 50);
    }
  }, []);

  const handleEditSuccess = React.useCallback(() => {
    setEditOpen(false);
    router.refresh();
  }, [router]);

  const handleGerarPecaSuccess = React.useCallback(() => {
    setGerarPecaOpen(false);
    router.refresh();
  }, [router]);

  return (
    <div className={cn(/* design-system-escape: gap-5 gap sem token DS */ "flex flex-col gap-5")}>
      <ContratoDetalhesHeader
        contrato={contrato}
        clienteNome={clienteNome}
        responsavel={responsavel}
        segmentoNome={segmento?.nome ?? null}
        totalProcessos={stats.totalProcessos}
        onEdit={handleEdit}
        onGerarPeca={handleGerarPeca}
        onEnviarAssinatura={handleEnviarAssinatura}
      />

      <ContratoTransitoriasAlert
        contratoId={contrato.id}
        onTransitoriaPromoted={() => router.refresh()}
      />

      <Tabs
        value={activeTab}
        onValueChange={(v) => setActiveTab(v as TabValue)}
        className={cn(/* design-system-escape: gap-5 gap sem token DS */ "flex flex-col gap-5")}
      >
        <TabsList className="flex w-full max-w-full overflow-x-auto">
          <TabsTrigger value="resumo" className={cn("inline-snug")}>
            <LayoutDashboard className="size-3.5" />
            Resumo
          </TabsTrigger>
          <TabsTrigger value="financeiro" className={cn("inline-snug")}>
            <Wallet className="size-3.5" />
            Financeiro
          </TabsTrigger>
          <TabsTrigger value="documentos" className={cn("inline-snug")}>
            <FileText className="size-3.5" />
            Documentos
          </TabsTrigger>
          <TabsTrigger value="historico" className={cn("inline-snug")}>
            <History className="size-3.5" />
            Histórico
          </TabsTrigger>
          <TabsTrigger value="entrevista" className={cn("inline-snug")}>
            <ClipboardList className="size-3.5" />
            Entrevista
          </TabsTrigger>
        </TabsList>

        {/* ───────────────── Tab Resumo ───────────────── */}
        <TabsContent value="resumo" className={cn(/* design-system-escape: gap-5 gap sem token DS; m-0 margin sem primitiva DS */ "flex flex-col gap-5 m-0")}>
          {contrato.observacoes ? (
            <ObservacoesSection texto={contrato.observacoes} />
          ) : null}

          <div className={cn(/* design-system-escape: gap-5 gap sem token DS */ "grid gap-5 lg:grid-cols-2 items-start")}>
            <div className={cn(/* design-system-escape: gap-5 gap sem token DS */ "flex flex-col gap-5")}>
              <ContratoPartesCard
                contrato={contrato}
                clienteNome={clienteNome}
              />
              <ContratoProcessosCard processos={contrato.processos} />
            </div>
            <div className={cn(/* design-system-escape: gap-5 gap sem token DS */ "flex flex-col gap-5")}>
              <FinanceiroResumoSection lancamentos={lancamentos} />
              <AtividadeRecenteSection historico={contrato.statusHistorico} />
            </div>
          </div>
        </TabsContent>

        {/* ───────────────── Tab Financeiro ───────────── */}
        <TabsContent value="financeiro" className={cn("m-0")}>
          <ContratoFinanceiroCard lancamentos={lancamentos} />
        </TabsContent>

        {/* ───────────────── Tab Documentos ───────────── */}
        <TabsContent value="documentos" className={cn(/* design-system-escape: gap-5 gap sem token DS; m-0 margin sem primitiva DS */ "flex flex-col gap-5 m-0")}>
          <DocumentosContratacaoCard
            contratoId={contrato.id}
            segmentoId={contrato.segmentoId ?? null}
          />
          <div id="contrato-assinatura-card" className="scroll-mt-4">
            <ContratoDocumentosAssinaturaCard
              contratoId={contrato.id}
              initialDocumentos={documentosAssinatura}
              initialPacoteAtivo={pacoteAssinaturaAtivo}
            />
          </div>
          <ContratoDocumentosCard contratoId={contrato.id} />
        </TabsContent>

        {/* ───────────────── Tab Histórico ─────────────── */}
        <TabsContent value="historico" className={cn("m-0")}>
          <ContratoTimeline historico={contrato.statusHistorico} />
        </TabsContent>

        {/* ───────────────── Tab Entrevista ────────────── */}
        <TabsContent value="entrevista" className={cn("m-0")}>
          <EntrevistaTab
            contratoId={contrato.id}
            entrevista={entrevista}
            anexos={entrevistaAnexos}
          />
        </TabsContent>
      </Tabs>

      <ContratoForm
        open={editOpen}
        onOpenChange={setEditOpen}
        mode="edit"
        contrato={contrato}
        onSuccess={handleEditSuccess}
      />

      <GerarPecaDialog
        contratoId={contrato.id}
        open={gerarPecaOpen}
        onOpenChange={setGerarPecaOpen}
        onSuccess={handleGerarPecaSuccess}
      />
    </div>
  );
}
