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
  FileText,
  MessageSquare,
} from 'lucide-react';

import { cn } from '@/lib/utils';
import { SemanticBadge } from '@/components/ui/semantic-badge';
import { Skeleton } from '@/components/ui/skeleton';

import {
  type Expediente,
  getExpedienteUrgencyLevel,
  GRAU_TRIBUNAL_LABELS,
  getExpedientePartyNames,
} from '../domain';
import type { Usuario } from '@/app/(authenticated)/usuarios';
import {
  getExpedienteDiasRestantes,
  URGENCY_BORDER,
  URGENCY_COUNTDOWN,
} from './urgency-helpers';
import {
  ExpedienteResponsavelPopover,
  ResponsavelTriggerContent,
} from './expediente-responsavel-popover';
import { ExpedienteTipoPopover } from './expediente-tipo-popover';
import { ExpedienteTextEditor } from './expediente-text-editor';

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
  const dias = getExpedienteDiasRestantes(expediente);
  const temPrazo = Boolean(expediente.dataPrazoLegalParte);
  const vencido = urgency === 'critico' && !expediente.baixadoEm;

  const partes = getExpedientePartyNames(expediente);
  const grauLabel = GRAU_TRIBUNAL_LABELS[expediente.grau] ?? expediente.grau;
  const orgao =
    expediente.descricaoOrgaoJulgador || expediente.orgaoJulgadorOrigem;
  const tipo = expediente.tipoExpedienteId
    ? tiposExpedientesData?.find((t) => t.id === expediente.tipoExpedienteId)
    : null;
  const tipoLabel = tipo?.tipoExpediente ?? 'Verificar';

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
        'transition-all duration-180 ease-out',
        'hover:border-border hover:shadow-[0_4px_14px_rgba(0,0,0,0.06)] hover:-translate-y-px',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        URGENCY_BORDER[urgency],
      )}
    >
      <div className="flex items-start gap-4">
        {/* TEMPORAL: prazo fatal + countdown (coluna fixa à esquerda) */}
        <div className="flex flex-col items-center gap-1.5 w-22 shrink-0 pt-0.5">
          <div className="text-center">
            {temPrazo ? (
              <>
                <div className="text-caption font-semibold text-foreground leading-tight whitespace-nowrap tabular-nums">
                  {format(
                    parseISO(expediente.dataPrazoLegalParte!),
                    'dd MMM yyyy',
                    { locale: ptBR },
                  )}
                </div>
                <div className="text-micro-caption uppercase tracking-wider text-muted-foreground/55 mt-0.5">
                  Fatal
                </div>
              </>
            ) : (
              <div className="text-caption italic text-muted-foreground/60">
                Sem prazo
              </div>
            )}
          </div>
          {temPrazo && (vencido || dias !== null) && (
            <div className="flex items-center gap-1 flex-wrap justify-center">
              {vencido ? (
                <SemanticBadge
                  category="expediente_status"
                  value="VENCIDO"
                  variantOverride="destructive"
                  toneOverride="soft"
                  className="text-micro-badge px-1.5 py-0 h-5"
                >
                  Vencido
                </SemanticBadge>
              ) : dias !== null ? (
                <span
                  className={cn(
                    'inline-flex items-center rounded-md px-2 py-0.5',
                    'text-micro-caption font-semibold tabular-nums',
                    URGENCY_COUNTDOWN[urgency],
                  )}
                >
                  {dias}d
                </span>
              ) : null}
            </div>
          )}
        </div>

        {/* MAIN INFO */}
        <div className="flex-1 min-w-0">
          {/* L1 — Tipo como título + flags à direita */}
          <div className="flex items-center gap-2">
            <ExpedienteTipoPopover
              expedienteId={expediente.id}
              tipoExpedienteId={expediente.tipoExpedienteId}
              tiposExpedientes={tiposExpedientesData ?? []}
              onSuccess={onSuccess}
            >
              <h3
                className={cn(
                  'text-label font-semibold text-foreground leading-tight truncate cursor-pointer',
                  !tipo && 'text-muted-foreground italic font-normal',
                )}
              >
                {tipoLabel}
              </h3>
            </ExpedienteTipoPopover>
            <div className="ml-auto flex items-center gap-1.5 shrink-0">
              {expediente.segredoJustica && (
                <span className="inline-flex items-center gap-1 bg-warning/10 border border-warning/25 text-warning rounded-md px-1.5 py-0.5 text-micro-caption font-semibold">
                  <Lock className="w-2.5 h-2.5" />
                  Segredo
                </span>
              )}
              {expediente.juizoDigital && (
                <span className="inline-flex items-center gap-1 bg-info/10 border border-info/25 text-info rounded-md px-1.5 py-0.5 text-micro-caption font-semibold">
                  <Monitor className="w-2.5 h-2.5" />
                  Digital
                </span>
              )}
              {expediente.prioridadeProcessual && (
                <span className="inline-flex items-center gap-1 bg-destructive/10 border border-destructive/25 text-destructive rounded-md px-1.5 py-0.5 text-micro-caption font-semibold">
                  <AlertTriangle className="w-2.5 h-2.5" />
                  Prioridade
                </span>
              )}
            </div>
          </div>

          {/* L2 — Partes */}
          {(partes.autora || partes.re) && (
            <div className="mt-0.5 text-caption text-foreground/85 leading-snug flex flex-wrap items-baseline">
              {partes.autora && (
                <span className="font-medium">{partes.autora}</span>
              )}
              {partes.autora && partes.re && (
                <span className="mx-1.5 text-muted-foreground/60 font-medium">
                  ×
                </span>
              )}
              {partes.re && (
                <span className="font-medium">{partes.re}</span>
              )}
            </div>
          )}

          {/* L3 — Classe · número · tribunal · grau · órgão · ciência */}
          <div className="mt-1 flex flex-wrap items-center gap-1.5">
            {expediente.classeJudicial && (
              <>
                <span className="text-caption text-muted-foreground/75">
                  {expediente.classeJudicial}
                </span>
                <span className="w-0.75 h-0.75 rounded-full bg-muted-foreground/30 shrink-0" />
              </>
            )}
            <span className="text-caption text-muted-foreground tabular-nums">
              {expediente.numeroProcesso}
            </span>
            <SemanticBadge
              category="tribunal"
              value={expediente.trt}
              className="text-micro-caption"
            >
              {expediente.trt}
            </SemanticBadge>
            <SemanticBadge
              category="grau"
              value={expediente.grau}
              className="text-micro-caption"
            >
              {grauLabel}
            </SemanticBadge>
            {orgao && (
              <>
                <span className="w-0.75 h-0.75 rounded-full bg-muted-foreground/30 shrink-0" />
                <span
                  className="text-caption text-muted-foreground/55 truncate"
                  title={orgao}
                >
                  {orgao}
                </span>
              </>
            )}
            {expediente.dataCienciaParte && (
              <>
                <span className="w-0.75 h-0.75 rounded-full bg-muted-foreground/30 shrink-0" />
                <span className="text-micro-caption text-muted-foreground/60">
                  Ciência{' '}
                  {format(parseISO(expediente.dataCienciaParte), 'dd/MM/yyyy')}
                </span>
              </>
            )}
          </div>

          {/* FOOTER — descrição + observações + responsável + concluir */}
          <div
            className="mt-2.5 pt-2.5 border-t border-border/50 flex items-center gap-3"
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.stopPropagation()}
          >
            {/* Descrição editável */}
            <div className="flex items-center gap-1.5 min-w-0 flex-1">
              <FileText className="w-3 h-3 shrink-0 text-muted-foreground/60" />
              <ExpedienteTextEditor
                expedienteId={expediente.id}
                field="descricaoArquivos"
                value={expediente.descricaoArquivos}
                emptyPlaceholder="Descrição"
                onSuccess={onSuccess}
                triggerClassName="text-caption flex-1 line-clamp-1"
              />
            </div>

            {/* Observações editáveis */}
            <div className="flex items-center gap-1.5 min-w-0 flex-1">
              <MessageSquare className="w-3 h-3 shrink-0 text-muted-foreground/60" />
              <ExpedienteTextEditor
                expedienteId={expediente.id}
                field="observacoes"
                value={expediente.observacoes}
                emptyPlaceholder="Observações"
                onSuccess={onSuccess}
                triggerClassName="text-caption flex-1 line-clamp-1"
              />
            </div>

            {/* Responsável */}
            <div className="shrink-0">
              <ExpedienteResponsavelPopover
                expedienteId={expediente.id}
                responsavelId={expediente.responsavelId}
                usuarios={usuariosData ?? []}
                onSuccess={onSuccess}
              >
                <ResponsavelTriggerContent
                  responsavelId={expediente.responsavelId}
                  usuarios={usuariosData ?? []}
                  size="sm"
                />
              </ExpedienteResponsavelPopover>
            </div>

            {/* Concluir */}
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
                  'inline-flex size-7 items-center justify-center rounded-md shrink-0',
                  'text-success/80 hover:text-success hover:bg-success/10',
                  'transition-colors duration-150 cursor-pointer',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                )}
              >
                <CheckCircle2 className="size-4" />
              </button>
            )}
          </div>
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
      {Array.from({ length: 5 }, (_, i) => (
        <div
          key={i}
          className="rounded-2xl border border-border/60 bg-card p-4"
        >
          <div className="flex items-start gap-4">
            <div className="flex flex-col items-center gap-1.5 w-22 shrink-0">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-3 w-10" />
              <Skeleton className="h-5 w-12 rounded-md" />
            </div>
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-3.5 w-64" />
              <Skeleton className="h-3 w-56" />
              <Skeleton className="h-8 w-full" />
            </div>
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
      <FileSearch className="w-10 h-10 text-muted-foreground/30 mb-4" />
      <p className="text-sm font-medium text-muted-foreground/50">
        Nenhum expediente encontrado
      </p>
      <p className="text-xs text-muted-foreground/30 mt-1">
        Tente ajustar os filtros ou criar um novo expediente
      </p>
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
