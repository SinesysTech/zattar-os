'use client';

/**
 * ExpedienteCard — Componente base compartilhado entre as views de quadro
 * (`expedientes-control-view`) e lista (`expedientes-glass-list`).
 *
 * Antes existiam dois componentes paralelos (`QueueCard` e `GlassRow`) com
 * layouts independentes — qualquer ajuste num driftava do outro. Esta base
 * unifica a hierarquia tipográfica (tipo, partes, identificação mono, labels
 * Descrição/Observações em `text-overline`) e expõe duas densidades:
 *
 *   - `density="comfortable"` — card vertical (quadro). Countdown como pill
 *     no canto superior direito; descrição e observações empilhadas.
 *   - `density="compact"`     — row horizontal (lista). Coluna fixa à
 *     esquerda com data fatal + countdown badge. Descrição/observações em
 *     duas colunas no body para preservar densidade sem perder os labels.
 */

import * as React from 'react';
import { format, parseISO } from 'date-fns';
import {
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
  Lock,
  Monitor,
} from 'lucide-react';

import { GlassPanel } from '@/components/shared/glass-panel';
import { Text } from '@/components/ui/typography';
import { cn } from '@/lib/utils';

import {
  GRAU_TRIBUNAL_LABELS,
  getExpedientePartyNames,
  getExpedienteUrgencyLevel,
  type Expediente,
  type UrgencyLevel,
} from '../domain';
import {
  getExpedienteDiasRestantes,
  URGENCY_BORDER,
} from './urgency-helpers';
import {
  ExpedienteResponsavelPopover,
  ResponsavelTriggerContent,
} from './expediente-responsavel-popover';
import {
  ExpedienteTipoPopover,
  TipoTriggerContent,
} from './expediente-tipo-popover';
import { ExpedientePrazoPopover } from './expediente-prazo-popover';
import { ExpedienteTextEditor } from './expediente-text-editor';

// =============================================================================
// TIPOS COMPARTILHADOS
// =============================================================================

interface UsuarioData {
  id: number;
  nomeExibicao?: string;
  nome_exibicao?: string;
  nomeCompleto?: string;
  nome?: string;
  avatarUrl?: string | null;
}

interface TipoExpedienteData {
  id: number;
  tipoExpediente?: string;
  tipo_expediente?: string;
}

export type ExpedienteCardDensity = 'comfortable' | 'compact';

export interface ExpedienteCardProps {
  expediente: Expediente;
  density: ExpedienteCardDensity;
  usuariosData: UsuarioData[];
  tiposExpedientesData: TipoExpedienteData[];
  selected?: boolean;
  onSelect?: () => void;
  onBaixar?: (expediente: Expediente) => void;
  onViewDetail?: (expediente: Expediente) => void;
  onSuccess?: () => void;
}

// =============================================================================
// HELPERS
// =============================================================================

function getDiasLabel(dias: number | null, vencido: boolean): string {
  if (dias === null) return 'Sem prazo';
  if (vencido || dias < 0) return `${Math.abs(dias)}d vencido`;
  if (dias === 0) return 'Vence hoje';
  if (dias === 1) return 'Vence amanhã';
  return `${dias}d restantes`;
}

const URGENCY_TEXT: Record<UrgencyLevel, string> = {
  critico:
    /* design-system-escape: font-semibold contextual de status (urgência crítica), não decorativo */ 'text-destructive/80 font-semibold',
  alto:
    /* design-system-escape: font-semibold contextual de status (urgência alta), não decorativo */ 'text-warning/80 font-semibold',
  medio: 'text-primary/70',
  baixo: 'text-muted-foreground/65',
  ok: 'text-success/60',
};

// =============================================================================
// SUB-COMPONENTES PUROS
// =============================================================================

function PrazoColumn({
  expediente,
  urgency,
  onSuccess,
}: {
  expediente: Expediente;
  urgency: UrgencyLevel;
  onSuccess?: () => void;
}) {
  const temPrazo = Boolean(expediente.dataPrazoLegalParte);
  const temCiencia = Boolean(expediente.dataCienciaParte);
  const urgencyTextClass = URGENCY_TEXT[urgency];

  return (
    <div
      className={cn(
        /* design-system-escape: w-24 largura mínima para datas dd/MM/yyyy + labels uppercase; self-center centraliza verticalmente o bloco temporal contra o body do card */ 'flex w-24 shrink-0 flex-col items-center gap-3 self-center',
      )}
    >
      {temPrazo ? (
        <ExpedientePrazoPopover
          expedienteId={expediente.id}
          dataPrazoLegalParte={expediente.dataPrazoLegalParte}
          onSuccess={onSuccess}
          align="start"
        >
          <button
            type="button"
            onClick={(e) => e.stopPropagation()}
            className={cn(
              /* design-system-escape: bloco clicável de prazo fatal — gap-0.5 entre data e label, rounded-md/px-1/py-0.5 hover sutil para indicar editabilidade */ 'flex cursor-pointer flex-col items-center gap-0.5 rounded-md px-1 py-0.5 text-center transition-colors hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring',
            )}
          >
            <span
              className={cn(
                /* design-system-escape: text-[14px] tabular-nums do dado fatal — sobe um nível de hierarquia (era 13px) por ser o KPI temporal do card */ 'text-[14px] font-semibold leading-tight whitespace-nowrap tabular-nums',
                urgencyTextClass,
              )}
            >
              {format(parseISO(expediente.dataPrazoLegalParte!), 'dd/MM/yyyy')}
            </span>
            <span
              className={cn(
                /* design-system-escape: label "Fatal" — text-[10px] tracking-[0.14em] espelha text-meta-label mas em escala menor para coluna estreita */ 'text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground/75',
              )}
            >
              Fatal
            </span>
          </button>
        </ExpedientePrazoPopover>
      ) : (
        <div className="text-caption italic text-muted-foreground/70">Sem prazo</div>
      )}
      {temCiencia && (
        <div
          className={cn(
            /* design-system-escape: bloco secundário de Ciência — segue layout do Fatal mas sem peso de cor; gap-0.5 entre data e label */ 'flex flex-col items-center gap-0.5 text-center',
          )}
        >
          <span
            className={cn(
              /* design-system-escape: data ciência — text-[13px] tabular-nums, peso normal pois é dado contextual (não-KPI) */ 'text-[13px] leading-tight whitespace-nowrap tabular-nums text-foreground/85',
            )}
          >
            {format(parseISO(expediente.dataCienciaParte!), 'dd/MM/yyyy')}
          </span>
          <span
            className={cn(
              /* design-system-escape: label "Ciência" — text-[10px] tracking-[0.14em] mirror do label Fatal mas com peso visual atenuado */ 'text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground/60',
            )}
          >
            Ciência
          </span>
        </div>
      )}
    </div>
  );
}

function CardHeader({
  expediente,
  tiposExpedientesData,
  rightSlot,
  onSuccess,
}: {
  expediente: Expediente;
  tiposExpedientesData: TipoExpedienteData[];
  rightSlot: React.ReactNode;
  onSuccess?: () => void;
}) {
  return (
    <div
      className={cn(
        /* design-system-escape: gap-2 entre tipo e ações no header — densidade interna do card, abaixo do mínimo Inline */ 'flex items-center gap-2',
      )}
    >
      <div className="min-w-0 flex-1">
        <ExpedienteTipoPopover
          expedienteId={expediente.id}
          tipoExpedienteId={expediente.tipoExpedienteId}
          tiposExpedientes={tiposExpedientesData}
          onSuccess={onSuccess}
        >
          <TipoTriggerContent
            tipoExpedienteId={expediente.tipoExpedienteId}
            tiposExpedientes={tiposExpedientesData}
            size="md"
            showIcon={false}
          />
        </ExpedienteTipoPopover>
      </div>
      <div
        className={cn(
          /* design-system-escape: gap-1.5 entre flags processuais no canto direito do header */ 'flex shrink-0 items-center gap-1.5',
        )}
      >
        {rightSlot}
      </div>
    </div>
  );
}

function ProcessFlags({ expediente }: { expediente: Expediente }) {
  return (
    <>
      {Boolean(expediente.segredoJustica) && (
        <span
          className={cn(
            /* design-system-escape: gap-1/px-1.5/py-0.5/font-semibold — token de pílula compacta de flag processual */ 'inline-flex items-center gap-1 rounded-md border border-warning/25 bg-warning/10 px-1.5 py-0.5 text-micro-caption font-semibold text-warning',
          )}
        >
          <Lock className="size-2.5" />
          Segredo
        </span>
      )}
      {Boolean(expediente.juizoDigital) && (
        <span
          className={cn(
            /* design-system-escape: gap-1/px-1.5/py-0.5/font-semibold — token de pílula compacta de flag processual */ 'inline-flex items-center gap-1 rounded-md border border-info/25 bg-info/10 px-1.5 py-0.5 text-micro-caption font-semibold text-info',
          )}
        >
          <Monitor className="size-2.5" />
          Digital
        </span>
      )}
      {Boolean(expediente.prioridadeProcessual) && (
        <span
          className={cn(
            /* design-system-escape: gap-1/px-1.5/py-0.5/font-semibold — token de pílula compacta de flag processual */ 'inline-flex items-center gap-1 rounded-md border border-destructive/25 bg-destructive/10 px-1.5 py-0.5 text-micro-caption font-semibold text-destructive',
          )}
        >
          <AlertTriangle className="size-2.5" />
          Prioridade
        </span>
      )}
    </>
  );
}

function IdentidadeProcessual({
  expediente,
  variant = 'stack',
}: {
  expediente: Expediente;
  /**
   * `stack`  — usado no card vertical (quadro): identificação processual em linha 2,
   *            órgão julgador + ciência em linha 3.
   * `inline` — usado na lista compacta: tudo numa linha só (TRT · grau · classe ·
   *            processo · vara). Ciência sai daqui (vai para a PrazoColumn) e o órgão
   *            vira parte da linha de identificação.
   */
  variant?: 'stack' | 'inline';
}) {
  const partes = getExpedientePartyNames(expediente);
  const grauLabel = GRAU_TRIBUNAL_LABELS[expediente.grau] ?? expediente.grau;
  const orgao = expediente.descricaoOrgaoJulgador || expediente.orgaoJulgadorOrigem;

  const baseIdentSegments = [
    expediente.trt,
    grauLabel,
    expediente.classeJudicial,
    expediente.numeroProcesso,
  ].filter(Boolean);

  const inlineSegments = orgao
    ? [...baseIdentSegments, orgao]
    : baseIdentSegments;

  return (
    <div
      className={cn(
        /* design-system-escape: space-y-1 stack vertical fino entre partes/identificação/órgão dentro do bloco de identidade */ 'space-y-1',
      )}
    >
      {(partes.autora || partes.re) && (
        <div
          className={cn(
            /* design-system-escape: space-y-0.5 stack micro entre as duas linhas de partes (autora/ré) */ 'space-y-0.5',
          )}
        >
          <p
            className={cn(
              /* design-system-escape: text-[13px] font-medium — partes do processo recebem peso medium (era semibold) para não competir com o título Tipo (semibold), e bump para 13px reforça legibilidade */ 'truncate text-[13px] font-medium text-foreground',
            )}
          >
            {partes.autora || '—'}
          </p>
          <p
            className={cn(
              /* design-system-escape: text-[13px] font-medium — espelha autora; "vs" recebe text-[10px] font-normal para virar separador discreto */ 'truncate text-[13px] font-medium text-foreground',
            )}
          >
            <span className="mr-1 text-[10px] font-normal text-muted-foreground/70">vs</span>
            {partes.re || '—'}
          </p>
        </div>
      )}
      {variant === 'inline' ? (
        inlineSegments.length > 0 && (
          <p
            className={cn(
              /* design-system-escape: text-[11.5px] font-mono tabular-nums — sobe de 10px para 11.5px (legibilidade WCAG); contraste /80 supera o /55 antigo que ficava abaixo de 4.5:1 */ 'truncate text-[11.5px] font-mono tabular-nums text-muted-foreground/80',
            )}
          >
            {inlineSegments.join(' · ')}
          </p>
        )
      ) : (
        <>
          {baseIdentSegments.length > 0 && (
            <p
              className={cn(
                /* design-system-escape: text-[11.5px] font-mono tabular-nums — bump de 10px para 11.5px alinha com a versão inline e melhora legibilidade da identificação processual */ 'truncate text-[11.5px] font-mono tabular-nums text-muted-foreground/80',
              )}
            >
              {baseIdentSegments.join(' · ')}
            </p>
          )}
          {(orgao || expediente.dataCienciaParte) && (
            <p
              className={cn(
                /* design-system-escape: text-[11.5px] font-mono tabular-nums — linha terciária com órgão + ciência, contraste /60 mais suave que a identificação principal */ 'truncate text-[11.5px] font-mono tabular-nums text-muted-foreground/60',
              )}
            >
              {[
                orgao,
                expediente.dataCienciaParte
                  ? `Ciência ${format(parseISO(expediente.dataCienciaParte), 'dd/MM/yyyy')}`
                  : null,
              ]
                .filter(Boolean)
                .join(' · ')}
            </p>
          )}
        </>
      )}
    </div>
  );
}

function CorpoEditavel({
  expediente,
  onSuccess,
  layout,
}: {
  expediente: Expediente;
  onSuccess?: () => void;
  layout: 'stacked' | 'grid';
}) {
  const containerClass =
    layout === 'stacked'
      ? /* design-system-escape: space-y-3 entre Descrição e Observações empilhadas (variant comfortable) */ 'space-y-3'
      : /* design-system-escape: gap-x-4/gap-y-2 entre cells de Descrição/Observações no grid 2-col (variant compact) */ 'grid gap-x-4 gap-y-2 sm:grid-cols-2';

  return (
    <div className={containerClass}>
      <div>
        <Text variant="overline" as="p" className="mb-1">
          Descrição
        </Text>
        <ExpedienteTextEditor
          expedienteId={expediente.id}
          field="descricaoArquivos"
          value={expediente.descricaoArquivos}
          emptyPlaceholder="Sem descrição — clique para adicionar"
          onSuccess={onSuccess}
        />
      </div>
      <div>
        <Text variant="overline" as="p" className="mb-1">
          Observações
        </Text>
        <ExpedienteTextEditor
          expedienteId={expediente.id}
          field="observacoes"
          value={expediente.observacoes}
          emptyPlaceholder="Sem observações — clique para adicionar"
          onSuccess={onSuccess}
        />
      </div>
    </div>
  );
}

function FooterAcoes({
  expediente,
  usuariosData,
  onBaixar,
  onViewDetail,
  onSuccess,
}: {
  expediente: Expediente;
  usuariosData: UsuarioData[];
  onBaixar?: (expediente: Expediente) => void;
  onViewDetail?: (expediente: Expediente) => void;
  onSuccess?: () => void;
}) {
  return (
    <div
      className={cn(
        /* design-system-escape: gap-1.5 entre cluster de botões e cluster de responsável no footer */ 'flex items-center gap-1.5',
      )}
      onClick={(e) => e.stopPropagation()}
      onKeyDown={(e) => e.stopPropagation()}
    >
      <div
        className={cn(
          /* design-system-escape: gap-1 entre botões Baixar/Detalhes (cluster compacto) */ 'flex items-center gap-1',
        )}
      >
        {onBaixar && !expediente.baixadoEm && (
          <button
            type="button"
            onClick={() => onBaixar(expediente)}
            className={cn(
              /* design-system-escape: pill de ação primária — gap-1/px-2/font-medium específico do botão Baixar */ 'flex h-6 cursor-pointer items-center gap-1 rounded-md bg-primary/10 px-2 text-[10px] font-medium text-primary/80 transition-colors hover:bg-primary/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
            )}
          >
            <CheckCircle2 className="size-3" />
            Baixar
          </button>
        )}
        {onViewDetail && (
          <button
            type="button"
            onClick={() => onViewDetail(expediente)}
            className={cn(
              /* design-system-escape: pill de ação secundária — gap-1/px-2/font-medium específico do botão Detalhes */ 'flex h-6 cursor-pointer items-center gap-1 rounded-md border border-border/40 px-2 text-[10px] font-medium text-muted-foreground/60 transition-colors hover:border-border/40 hover:text-muted-foreground/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
            )}
          >
            <ExternalLink className="size-3" />
            Detalhes
          </button>
        )}
      </div>
      <div className="ml-auto">
        <ExpedienteResponsavelPopover
          expedienteId={expediente.id}
          responsavelId={expediente.responsavelId}
          usuarios={usuariosData}
          onSuccess={onSuccess}
          align="end"
        >
          <ResponsavelTriggerContent
            responsavelId={expediente.responsavelId}
            usuarios={usuariosData}
            size="sm"
          />
        </ExpedienteResponsavelPopover>
      </div>
    </div>
  );
}

// =============================================================================
// COMPONENTE PRINCIPAL
// =============================================================================

export function ExpedienteCard({
  expediente,
  density,
  usuariosData,
  tiposExpedientesData,
  selected,
  onSelect,
  onBaixar,
  onViewDetail,
  onSuccess,
}: ExpedienteCardProps) {
  const urgency = getExpedienteUrgencyLevel(expediente);
  const dias = getExpedienteDiasRestantes(expediente);
  const diasLabel = getDiasLabel(dias, expediente.prazoVencido);

  const handleKey = React.useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onSelect?.();
      }
    },
    [onSelect],
  );

  if (density === 'comfortable') {
    return (
      <GlassPanel
        depth={1}
        className={cn(
          /* design-system-escape: p-0 — outer GlassPanel zera o padding pois o inner div clicável aplica p-4 (Inset não suporta este split) */ 'group w-full cursor-pointer p-0 text-left transition-all duration-200',
          'border-border/40 hover:border-primary/30 hover:bg-accent/40 hover:shadow-md',
          URGENCY_BORDER[urgency],
          selected && 'border-primary/40 bg-primary/5 ring-1 ring-primary/20',
        )}
      >
        <div
          role={onSelect ? 'button' : undefined}
          tabIndex={onSelect ? 0 : undefined}
          onClick={onSelect}
          onKeyDown={onSelect ? handleKey : undefined}
          className={cn(
            /* design-system-escape: p-4 padding interno do clickable — Inset não permite ainda atribuir role/tabIndex juntos */ 'p-4 focus:outline-none',
          )}
        >
          <CardHeader
            expediente={expediente}
            tiposExpedientesData={tiposExpedientesData}
            rightSlot={
              expediente.dataPrazoLegalParte ? (
                <span
                  className={cn(
                    /* design-system-escape: font-mono/text-[10px]/tabular-nums — mirror exato do QueueCard original; text-mono-num conflitava em cascata com URGENCY_TEXT no Tailwind v4 */ 'shrink-0 font-mono text-[10px] tabular-nums',
                    URGENCY_TEXT[urgency],
                  )}
                >
                  {diasLabel}
                </span>
              ) : (
                <span
                  className={cn(
                    /* design-system-escape: font-mono/text-[10px]/tabular-nums — label de "sem prazo" no canto direito do header comfortable */ 'shrink-0 font-mono text-[10px] tabular-nums text-muted-foreground/55',
                  )}
                >
                  —
                </span>
              )
            }
            onSuccess={onSuccess}
          />
          <div
            className={cn(
              /* design-system-escape: pt-3 separador interno entre seções do card vertical */ 'mt-3 border-t border-border/10 pt-3',
            )}
          >
            <IdentidadeProcessual expediente={expediente} />
          </div>
          <div
            className={cn(
              /* design-system-escape: pt-3 separador interno entre seções do card vertical */ 'mt-3 border-t border-border/10 pt-3',
            )}
          >
            <CorpoEditavel expediente={expediente} onSuccess={onSuccess} layout="stacked" />
          </div>
          <div
            className={cn(
              /* design-system-escape: pt-3 separador interno entre seções do card vertical */ 'mt-3 border-t border-border/10 pt-3',
            )}
          >
            <FooterAcoes
              expediente={expediente}
              usuariosData={usuariosData}
              onBaixar={onBaixar}
              onViewDetail={onViewDetail}
              onSuccess={onSuccess}
            />
          </div>
        </div>
      </GlassPanel>
    );
  }

  // density === 'compact'
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onSelect}
      onKeyDown={handleKey}
      className={cn(
        /* design-system-escape: p-4 padding interno do row clicável; Inset não suporta role/tabIndex no mesmo node */ 'group w-full cursor-pointer rounded-2xl border border-border/60 bg-card p-4 text-left transition-all duration-180 ease-out',
        'hover:-translate-y-px hover:border-border hover:shadow-[0_4px_14px_rgba(0,0,0,0.06)]',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        URGENCY_BORDER[urgency],
      )}
    >
      <div
        className={cn(
          /* design-system-escape: items-center centraliza verticalmente a PrazoColumn contra o body do card; gap-4 entre coluna temporal e bloco principal */ 'flex items-center gap-4',
        )}
      >
        <PrazoColumn expediente={expediente} urgency={urgency} onSuccess={onSuccess} />
        <div className="min-w-0 flex-1">
          <CardHeader
            expediente={expediente}
            tiposExpedientesData={tiposExpedientesData}
            rightSlot={<ProcessFlags expediente={expediente} />}
            onSuccess={onSuccess}
          />
          <div className="mt-2">
            <IdentidadeProcessual expediente={expediente} variant="inline" />
          </div>
          <div
            className={cn(
              /* design-system-escape: pt-3 separador interno entre identidade e corpo editável */ 'mt-3 border-t border-border/40 pt-3',
            )}
          >
            <CorpoEditavel expediente={expediente} onSuccess={onSuccess} layout="grid" />
          </div>
          <div
            className={cn(
              /* design-system-escape: pt-3 separador interno entre corpo editável e footer */ 'mt-3 border-t border-border/40 pt-3',
            )}
          >
            <FooterAcoes
              expediente={expediente}
              usuariosData={usuariosData}
              onBaixar={onBaixar}
              onViewDetail={onViewDetail}
              onSuccess={onSuccess}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
