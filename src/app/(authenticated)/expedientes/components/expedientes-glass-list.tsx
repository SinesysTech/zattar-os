'use client';

import * as React from 'react';
import { parseISO, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  FileSearch,
  Lock,
  Monitor,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react';

import { cn } from '@/lib/utils';
import { SemanticBadge } from '@/components/ui/semantic-badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Heading, Text } from '@/components/ui/typography';

import {
  type Expediente,
  type UrgencyLevel,
  getExpedienteUrgencyLevel,
  GRAU_TRIBUNAL_LABELS,
  getExpedientePartyNames,
} from '../domain';
import type { Usuario } from '@/app/(authenticated)/usuarios';
import {
  getExpedienteDiasRestantes,
  URGENCY_BORDER,
  URGENCY_DOT,
  URGENCY_COUNTDOWN,
} from './urgency-helpers';
import {
  ExpedienteResponsavelPopover,
  ResponsavelTriggerContent,
} from './expediente-responsavel-popover';
import { ExpedienteTipoPopover } from './expediente-tipo-popover';
import { ExpedienteTextEditor } from './expediente-text-editor';

// =============================================================================
// CONSTANTS
// =============================================================================

// [ temporal | main (flex) | responsável | ação ]
const GRID_TEMPLATE = 'grid-cols-[200px_minmax(0,1fr)_180px_44px]';
const GRID_EXPANSION_OFFSET = 'pl-[216px]'; // 200px + 16px gap (p-4)

// =============================================================================
// TYPES
// =============================================================================

interface TipoExpedienteOption {
  id: number;
  tipoExpediente?: string;
}

interface ExpedientesGlassListProps {
  expedientes: Expediente[];
  isLoading: boolean;
  onViewDetail: (expediente: Expediente) => void;
  onBaixar?: (expediente: Expediente) => void;
  usuariosData?: Usuario[];
  tiposExpedientesData?: TipoExpedienteOption[];
  onSuccess?: () => void;
}

// =============================================================================
// TEMPORAL BLOCK (coluna 1) — Fatal + Ciência + Vencido/Countdown
// =============================================================================

function TemporalBlock({
  expediente,
  urgency,
}: {
  expediente: Expediente;
  urgency: UrgencyLevel;
}) {
  const dias = getExpedienteDiasRestantes(expediente);
  const temPrazo = Boolean(expediente.dataPrazoLegalParte);
  const vencido = urgency === 'critico' && !expediente.baixadoEm;

  return (
    <div className="flex items-start gap-2">
      <div
        className={cn(
          'mt-1.5 size-2 shrink-0 rounded-full',
          URGENCY_DOT[urgency],
        )}
      />
      <div className="min-w-0 flex flex-col gap-0.5">
        {temPrazo ? (
          <div className="flex items-baseline gap-1.5">
            <Text variant="meta-label" className="text-muted-foreground/65">
              Fatal
            </Text>
            <Text variant="caption" className="tabular-nums font-medium">
              {format(parseISO(expediente.dataPrazoLegalParte!), 'dd MMM yyyy', {
                locale: ptBR,
              })}
            </Text>
          </div>
        ) : (
          <Text variant="caption" className="text-muted-foreground/50 italic">
            Sem prazo
          </Text>
        )}
        {expediente.dataCienciaParte && (
          <div className="flex items-baseline gap-1.5">
            <Text variant="meta-label" className="text-muted-foreground/55">
              Ciência
            </Text>
            <Text
              variant="micro-caption"
              className="tabular-nums text-muted-foreground/70"
            >
              {format(parseISO(expediente.dataCienciaParte), 'dd/MM/yyyy')}
            </Text>
          </div>
        )}
        {temPrazo && (vencido || dias !== null) && (
          <div className="mt-1 flex items-center gap-1 flex-wrap">
            {vencido && (
              <SemanticBadge
                category="expediente_status"
                value="VENCIDO"
                variantOverride="destructive"
                toneOverride="soft"
                className="text-[10px] px-1.5 py-0 h-5"
              >
                Vencido
              </SemanticBadge>
            )}
            {dias !== null && (
              <span
                className={cn(
                  'inline-flex items-center rounded-lg px-1.5 py-0.5',
                  'text-[10px] font-semibold tabular-nums',
                  URGENCY_COUNTDOWN[urgency],
                )}
              >
                {dias}d
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// =============================================================================
// MAIN CELL (coluna 2) — 4 linhas narrativas
// =============================================================================

function MainCell({
  expediente,
  tiposExpedientesData,
  onSuccess,
}: {
  expediente: Expediente;
  tiposExpedientesData?: TipoExpedienteOption[];
  onSuccess?: () => void;
}) {
  const partes = getExpedientePartyNames(expediente);
  const grauLabel = GRAU_TRIBUNAL_LABELS[expediente.grau] ?? expediente.grau;
  const orgao =
    expediente.descricaoOrgaoJulgador || expediente.orgaoJulgadorOrigem;
  const tipo = expediente.tipoExpedienteId
    ? tiposExpedientesData?.find((t) => t.id === expediente.tipoExpedienteId)
    : null;
  const tipoLabel = tipo?.tipoExpediente ?? 'Verificar';

  return (
    <div className="min-w-0 flex flex-col gap-1">
      {/* L1 — Tipo como título + flags */}
      <div className="flex items-center gap-2 flex-wrap">
        <ExpedienteTipoPopover
          expedienteId={expediente.id}
          tipoExpedienteId={expediente.tipoExpedienteId}
          tiposExpedientes={tiposExpedientesData ?? []}
          onSuccess={onSuccess}
        >
          <Heading
            level="widget"
            as="h3"
            className={cn(
              'truncate',
              !tipo && 'text-muted-foreground/60 italic font-normal',
            )}
          >
            {tipoLabel}
          </Heading>
        </ExpedienteTipoPopover>
        {expediente.segredoJustica && (
          <SemanticBadge
            category="status"
            value="SEGREDO"
            variantOverride="warning"
            toneOverride="soft"
            className="text-[10px] gap-1"
          >
            <Lock className="size-2.5" />
            Segredo
          </SemanticBadge>
        )}
        {expediente.juizoDigital && (
          <SemanticBadge
            category="status"
            value="DIGITAL"
            variantOverride="info"
            toneOverride="soft"
            className="text-[10px] gap-1"
          >
            <Monitor className="size-2.5" />
            Digital
          </SemanticBadge>
        )}
        {expediente.prioridadeProcessual && (
          <SemanticBadge
            category="priority"
            value="ALTA"
            variantOverride="destructive"
            toneOverride="soft"
            className="text-[10px] gap-1"
          >
            <AlertTriangle className="size-2.5" />
            Prioridade
          </SemanticBadge>
        )}
      </div>
      {/* L2 — Partes */}
      {(partes.autora || partes.re) && (
        <Text variant="caption" className="truncate text-muted-foreground/70">
          {partes.autora}
          {partes.autora && partes.re && (
            <span className="text-muted-foreground/40"> vs. </span>
          )}
          {partes.re}
        </Text>
      )}
      {/* L3 — Rito · número · badges de tribunal */}
      <div className="flex items-center gap-1.5 flex-wrap">
        {expediente.classeJudicial && (
          <>
            <Text
              variant="caption"
              className="text-muted-foreground/60 truncate"
            >
              {expediente.classeJudicial}
            </Text>
            <Text variant="caption" className="text-muted-foreground/30">
              ·
            </Text>
          </>
        )}
        <Text
          variant="caption"
          className="tabular-nums text-muted-foreground/70 truncate"
        >
          {expediente.numeroProcesso}
        </Text>
        <SemanticBadge
          category="tribunal"
          value={expediente.trt}
          className="text-[10px]"
        >
          {expediente.trt}
        </SemanticBadge>
        <SemanticBadge
          category="grau"
          value={expediente.grau}
          className="text-[10px]"
        >
          {grauLabel}
        </SemanticBadge>
      </div>
      {/* L4 — Órgão julgador */}
      {orgao && (
        <Text
          variant="micro-caption"
          className="truncate text-muted-foreground/55"
          title={orgao}
        >
          {orgao}
        </Text>
      )}
    </div>
  );
}

// =============================================================================
// GLASS ROW
// =============================================================================

function GlassRow({
  expediente,
  onViewDetail,
  onBaixar,
  usuariosData,
  tiposExpedientesData,
  onSuccess,
}: {
  expediente: Expediente;
  onViewDetail: () => void;
  onBaixar?: (expediente: Expediente) => void;
  usuariosData?: Usuario[];
  tiposExpedientesData?: TipoExpedienteOption[];
  onSuccess?: () => void;
}) {
  const urgency = getExpedienteUrgencyLevel(expediente);

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onViewDetail}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onViewDetail();
        }
      }}
      className={cn(
        'group w-full text-left rounded-2xl border border-border/60 bg-card p-4 cursor-pointer',
        'transition-colors duration-200 ease-out',
        'hover:border-border hover:shadow-sm',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        URGENCY_BORDER[urgency],
      )}
    >
      <div className={cn('grid gap-4 items-start', GRID_TEMPLATE)}>
        <TemporalBlock expediente={expediente} urgency={urgency} />
        <MainCell
          expediente={expediente}
          tiposExpedientesData={tiposExpedientesData}
          onSuccess={onSuccess}
        />
        <div className="min-w-0 self-center">
          <ExpedienteResponsavelPopover
            expedienteId={expediente.id}
            responsavelId={expediente.responsavelId}
            usuarios={usuariosData ?? []}
            onSuccess={onSuccess}
          >
            <ResponsavelTriggerContent
              responsavelId={expediente.responsavelId}
              usuarios={usuariosData ?? []}
              size="md"
            />
          </ExpedienteResponsavelPopover>
        </div>
        <div className="flex items-center justify-end self-center">
          {onBaixar && !expediente.baixadoEm && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onBaixar(expediente);
              }}
              onKeyDown={(e) => e.stopPropagation()}
              aria-label="Concluir expediente"
              title="Concluir expediente"
              className={cn(
                'inline-flex size-9 items-center justify-center rounded-xl',
                'text-success/80 hover:text-success hover:bg-success/10',
                'transition-colors duration-150 cursor-pointer',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
              )}
            >
              <CheckCircle2 className="size-5" />
            </button>
          )}
        </div>
      </div>

      {/* Expansion — descrição + observações editáveis (no hover) */}
      <div
        className={cn(
          'hidden group-hover:grid grid-cols-1 md:grid-cols-2 gap-4',
          'mt-3 pt-3 border-t border-border/20',
          GRID_EXPANSION_OFFSET,
        )}
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.stopPropagation()}
      >
        <div className="min-w-0">
          <Text
            variant="overline"
            as="p"
            className="mb-1.5 text-muted-foreground/55"
          >
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
        <div className="min-w-0">
          <Text
            variant="overline"
            as="p"
            className="mb-1.5 text-muted-foreground/55"
          >
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
    </div>
  );
}

// =============================================================================
// SKELETON
// =============================================================================

function ListSkeleton() {
  return (
    <div className="flex flex-col gap-2">
      {Array.from({ length: 6 }, (_, i) => (
        <div
          key={i}
          className="rounded-2xl border border-border/40 bg-card p-4"
        >
          <div className={cn('grid gap-4 items-start', GRID_TEMPLATE)}>
            <div className="flex items-start gap-2">
              <Skeleton className="mt-1.5 size-2 rounded-full" />
              <div className="space-y-1.5 flex-1">
                <Skeleton className="h-3.5 w-28" />
                <Skeleton className="h-2.5 w-24" />
                <Skeleton className="h-4 w-16 rounded-md" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Skeleton className="h-4 w-44" />
              <Skeleton className="h-3 w-56" />
              <Skeleton className="h-3 w-48" />
              <Skeleton className="h-2.5 w-36" />
            </div>
            <div className="flex items-center gap-2 self-center">
              <Skeleton className="size-7 rounded-full" />
              <Skeleton className="h-3 w-24" />
            </div>
            <Skeleton className="size-9 rounded-xl ml-auto self-center" />
          </div>
        </div>
      ))}
    </div>
  );
}

// =============================================================================
// EMPTY STATE
// =============================================================================

function GlassEmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 opacity-60">
      <FileSearch className="size-10 text-muted-foreground/30 mb-4" />
      <Text
        variant="caption"
        className="font-medium text-muted-foreground/60"
      >
        Nenhum expediente encontrado
      </Text>
      <Text
        variant="micro-caption"
        className="mt-1 text-muted-foreground/40"
      >
        Tente ajustar os filtros ou criar um novo expediente
      </Text>
    </div>
  );
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function ExpedientesGlassList({
  expedientes,
  isLoading,
  onViewDetail,
  onBaixar,
  usuariosData,
  tiposExpedientesData,
  onSuccess,
}: ExpedientesGlassListProps) {
  if (isLoading) return <ListSkeleton />;
  if (expedientes.length === 0) return <GlassEmptyState />;

  return (
    <div className="flex flex-col gap-2">
      {expedientes.map((exp) => (
        <GlassRow
          key={exp.id}
          expediente={exp}
          onViewDetail={() => onViewDetail(exp)}
          onBaixar={onBaixar}
          usuariosData={usuariosData}
          tiposExpedientesData={tiposExpedientesData}
          onSuccess={onSuccess}
        />
      ))}
    </div>
  );
}
