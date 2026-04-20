'use client';

import * as React from 'react';
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
import { STATUS_CONTRATO_LABELS } from '@/app/(authenticated)/contratos';
import type { Lancamento } from '@/app/(authenticated)/financeiro/domain';
import type { EntrevistaTrabalhista, EntrevistaAnexo } from '@/app/(authenticated)/entrevistas-trabalhistas';
import { EntrevistaTab } from '@/app/(authenticated)/entrevistas-trabalhistas';

import {
  ContratoDetalhesHeader,
  ContratoDetalhesCard,
  ContratoPartesCard,
  ContratoProcessosCard,
  ContratoFinanceiroCard,
  ContratoDocumentosCard,
  ContratoTimeline,
} from './components';
import { DocumentosContratacaoCard } from './components/documentos-contratacao-card';

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

// =============================================================================
// SEÇÕES INLINE — Resumo
// =============================================================================

function ObservacoesSection({ texto }: { texto: string }) {
  return (
    <DetailSection icon={StickyNote} label="Observações">
      <DetailSectionCard>
        <p className="text-[13px] text-foreground/90 leading-relaxed whitespace-pre-wrap">
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

  const fmt = (v: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(v);

  if (lancamentos.length === 0) {
    return (
      <DetailSection icon={DollarSign} label="Financeiro">
        <DetailSectionCard>
          <p className="text-[12.5px] text-muted-foreground/70 italic">
            Nenhum lançamento financeiro
          </p>
        </DetailSectionCard>
      </DetailSection>
    );
  }

  return (
    <DetailSection icon={DollarSign} label="Financeiro">
      <DetailSectionCard>
        <div className="grid grid-cols-2 gap-2.5 mb-3">
          <div className="px-3 py-2 rounded-[10px] bg-muted/40 border border-border/30">
            <div className="text-[10.5px] font-semibold text-muted-foreground uppercase tracking-[0.06em]">
              Recebido
            </div>
            <div className="mt-0.5 font-heading text-[15px] font-bold tabular-nums text-success">
              {fmt(totalReceitas)}
            </div>
          </div>
          <div className="px-3 py-2 rounded-[10px] bg-muted/40 border border-border/30">
            <div className="text-[10.5px] font-semibold text-muted-foreground uppercase tracking-[0.06em]">
              Pendente
            </div>
            <div className="mt-0.5 font-heading text-[15px] font-bold tabular-nums text-warning">
              {fmt(totalPendente)}
            </div>
          </div>
        </div>
        <div>
          <div className="flex justify-between text-[11px] mb-1.5">
            <span className="text-muted-foreground font-medium">Progresso de recebimento</span>
            <span className="text-primary font-bold tabular-nums">{pctRecebido}%</span>
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
        <div className="flex flex-col gap-2.5">
          {sorted.map((item) => {
            const toLabel = STATUS_CONTRATO_LABELS[item.toStatus] ?? item.toStatus;
            const fromLabel = item.fromStatus
              ? STATUS_CONTRATO_LABELS[item.fromStatus] ?? item.fromStatus
              : null;

            return (
              <div key={item.id} className="flex items-center justify-between gap-3 text-[12px]">
                <div className="inline-flex items-center gap-1.5 min-w-0">
                  {fromLabel ? (
                    <>
                      <span className="text-[11px] text-muted-foreground whitespace-nowrap overflow-hidden text-ellipsis">
                        {fromLabel}
                      </span>
                      <ArrowRight className="size-3 text-muted-foreground shrink-0" />
                    </>
                  ) : null}
                  <SemanticBadge
                    category="status_contrato"
                    value={item.toStatus}
                    className="text-[10px] shrink-0"
                  >
                    {toLabel}
                  </SemanticBadge>
                </div>
                <span className="text-[10.5px] text-muted-foreground tabular-nums whitespace-nowrap">
                  {formatDateCompact(item.changedAt)}
                </span>
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
}: ContratoDetalhesClientProps) {
  const clienteNome = cliente?.nome ?? `Cliente #${contrato.clienteId}`;

  // TabsList é renderizado dentro do hero via slot `tabs`.
  const tabsTrigger = (
    <TabsList className="flex w-full max-w-full overflow-x-auto">
      <TabsTrigger value="resumo" className="gap-1.5 text-[11.5px]">
        <LayoutDashboard className="size-3.5" />
        Resumo
      </TabsTrigger>
      <TabsTrigger value="financeiro" className="gap-1.5 text-[11.5px]">
        <Wallet className="size-3.5" />
        Financeiro
      </TabsTrigger>
      <TabsTrigger value="documentos" className="gap-1.5 text-[11.5px]">
        <FileText className="size-3.5" />
        Documentos
      </TabsTrigger>
      <TabsTrigger value="historico" className="gap-1.5 text-[11.5px]">
        <History className="size-3.5" />
        Histórico
      </TabsTrigger>
      <TabsTrigger value="entrevista" className="gap-1.5 text-[11.5px]">
        <ClipboardList className="size-3.5" />
        Entrevista
      </TabsTrigger>
    </TabsList>
  );

  return (
    <Tabs defaultValue="resumo" className="flex flex-col gap-4">
      <ContratoDetalhesHeader
        contrato={contrato}
        clienteNome={clienteNome}
        responsavel={responsavel}
        segmentoNome={segmento?.nome ?? null}
        totalProcessos={stats.totalProcessos}
        tabs={tabsTrigger}
      />

      {/* ───────────────── Tab Resumo ───────────────── */}
      <TabsContent value="resumo" className="flex flex-col gap-4 m-0">
        {contrato.observacoes ? (
          <ObservacoesSection texto={contrato.observacoes} />
        ) : null}

        <div className="grid gap-4 lg:grid-cols-2 items-start">
          <div className="flex flex-col gap-4">
            <ContratoPartesCard
              contrato={contrato}
              clienteNome={clienteNome}
            />
            <ContratoDetalhesCard
              tipoCobranca={contrato.tipoCobranca}
              papelClienteNoContrato={contrato.papelClienteNoContrato}
              segmento={segmento}
              cliente={cliente}
              cadastradoEm={contrato.cadastradoEm}
            />
          </div>
          <div className="flex flex-col gap-4">
            <ContratoProcessosCard processos={contrato.processos} />
            <FinanceiroResumoSection lancamentos={lancamentos} />
            <AtividadeRecenteSection historico={contrato.statusHistorico} />
          </div>
        </div>
      </TabsContent>

      {/* ───────────────── Tab Financeiro ───────────── */}
      <TabsContent value="financeiro" className="m-0">
        <ContratoFinanceiroCard lancamentos={lancamentos} />
      </TabsContent>

      {/* ───────────────── Tab Documentos ───────────── */}
      <TabsContent value="documentos" className="flex flex-col gap-4 m-0">
        <DocumentosContratacaoCard
          contratoId={contrato.id}
          segmentoId={contrato.segmentoId ?? null}
        />
        <ContratoDocumentosCard contratoId={contrato.id} />
      </TabsContent>

      {/* ───────────────── Tab Histórico ─────────────── */}
      <TabsContent value="historico" className="m-0">
        <ContratoTimeline historico={contrato.statusHistorico} />
      </TabsContent>

      {/* ───────────────── Tab Entrevista ────────────── */}
      <TabsContent value="entrevista" className="m-0">
        <EntrevistaTab
          contratoId={contrato.id}
          entrevista={entrevista}
          anexos={entrevistaAnexos}
        />
      </TabsContent>
    </Tabs>
  );
}
