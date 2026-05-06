'use client';

import * as React from 'react';
import { format, parseISO, differenceInMinutes, isPast } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  Gavel, Lock, Monitor, CheckCircle2, Users, Clock, Building2, Layers, Video, Pencil, Check, X, ExternalLink} from 'lucide-react';

import { cn } from '@/lib/utils';
import { SemanticBadge } from '@/components/ui/semantic-badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Skeleton } from '@/components/ui/skeleton';

import type { Audiencia } from '../domain';
import {
  StatusAudiencia,
  STATUS_AUDIENCIA_LABELS,
  ModalidadeAudiencia,
  MODALIDADE_AUDIENCIA_LABELS,
  GRAU_TRIBUNAL_LABELS,
} from '../domain';
import { actionAtualizarObservacoes } from '../actions';
import { AudienciaResponsavelPopover, ResponsavelTriggerContent } from './audiencia-responsavel-popover';
import { calcPrepItems, calcPrepScore } from './prep-score';

import { Text } from '@/components/ui/typography';
import { LoadingSpinner } from "@/components/ui/loading-state"
// =============================================================================
// TIPOS
// =============================================================================

export interface AudienciaComResponsavel extends Audiencia {
  responsavelNome?: string | null;
}

interface UsuarioOption {
  id: number;
  nomeExibicao?: string;
  nomeCompleto?: string;
  avatarUrl?: string | null;
}

interface AudienciasGlassListProps {
  audiencias: AudienciaComResponsavel[];
  isLoading: boolean;
  onView: (audiencia: AudienciaComResponsavel) => void;
  usuarios: UsuarioOption[];
}

// =============================================================================
// HELPERS
// =============================================================================

function getModalidadeIcon(modalidade: ModalidadeAudiencia | null) {
  switch (modalidade) {
    case ModalidadeAudiencia.Virtual:
      return Video;
    case ModalidadeAudiencia.Presencial:
      return Building2;
    case ModalidadeAudiencia.Hibrida:
      return Layers;
    default:
      return Monitor;
  }
}

function getScoreColor(score: number): string {
  if (score >= 80) return 'text-success';
  if (score >= 50) return 'text-warning';
  return 'text-destructive';
}

function getScoreStrokeColor(score: number): string {
  if (score >= 80) return 'var(--success)';
  if (score >= 50) return 'var(--warning)';
  return 'var(--destructive)';
}

function formatCountdown(dataInicio: string): { text: string; isUrgent: boolean } | null {
  const target = parseISO(dataInicio);
  if (isPast(target)) return null;

  const mins = differenceInMinutes(target, new Date());
  if (mins < 0) return null;

  const hours = Math.floor(mins / 60);
  const remainingMins = mins % 60;

  if (hours > 48) return null;

  if (hours > 0) {
    return { text: `${hours}h ${remainingMins}min`, isUrgent: hours < 2 };
  }
  return { text: `${remainingMins}min`, isUrgent: true };
}

// =============================================================================
// PREP RING
// =============================================================================

function PrepRing({ audiencia }: { audiencia: Audiencia }) {
  const items = calcPrepItems(audiencia);
  const score = calcPrepScore(items);
  const radius = 18;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="relative w-11 h-11">
      <svg width="44" height="44" viewBox="0 0 44 44">
        <circle
          cx="22"
          cy="22"
          r={radius}
          fill="none"
          stroke="var(--border)"
          strokeOpacity="0.3"
          strokeWidth="3"
        />
        <circle
          cx="22"
          cy="22"
          r={radius}
          fill="none"
          stroke={getScoreStrokeColor(score)}
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-[stroke-dashoffset] duration-600 ease-out"
          style={{ transform: 'rotate(-90deg)', transformOrigin: '50% 50%' }}
        />
      </svg>
      <span
        className={cn(
           'absolute inset-0 flex items-center justify-center text-micro-badge font-bold tabular-nums',
          getScoreColor(score)
        )}
      >
        {score}%
      </span>
    </div>
  );
}

// =============================================================================
// ROW COMPONENT
// =============================================================================

function GlassRow({
  audiencia,
  onView,
  usuarios,
}: {
  audiencia: AudienciaComResponsavel;
  onView: () => void;
  usuarios: UsuarioOption[];
}) {
  const [editingObs, setEditingObs] = React.useState(false);
  const [obsDraft, setObsDraft] = React.useState('');
  const [savingObs, setSavingObs] = React.useState(false);
  const [obsValue, setObsValue] = React.useState<string | null>(audiencia.observacoes ?? null);

  React.useEffect(() => {
    setObsValue(audiencia.observacoes ?? null);
  }, [audiencia.observacoes]);

  const ModalidadeIcon = getModalidadeIcon(audiencia.modalidade);
  const countdown =
    audiencia.status === StatusAudiencia.Marcada ? formatCountdown(audiencia.dataInicio) : null;

  const dataInicio = parseISO(audiencia.dataInicio);

  const poloAtivo =
    audiencia.poloAtivoOrigem || audiencia.poloAtivoNome || '—';
  const poloPassivo =
    audiencia.poloPassivoOrigem || audiencia.poloPassivoNome || '—';
  const orgaoJulgador =
    audiencia.orgaoJulgadorDescricao ||
    audiencia.orgaoJulgadorOrigem ||
    null;
  const grauLabel = audiencia.grau ? GRAU_TRIBUNAL_LABELS[audiencia.grau] : null;
  const hasVirtualRoom =
    (audiencia.modalidade === ModalidadeAudiencia.Virtual || audiencia.modalidade === ModalidadeAudiencia.Hibrida) &&
    audiencia.urlAudienciaVirtual;

  const handleStartObs = (e: React.MouseEvent) => {
    e.stopPropagation();
    setObsDraft(obsValue ?? '');
    setEditingObs(true);
  };

  const handleCancelObs = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setEditingObs(false);
  };

  const handleSaveObs = async (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setSavingObs(true);
    const result = await actionAtualizarObservacoes(audiencia.id, obsDraft || null);
    if (result.success) {
      setObsValue(obsDraft || null);
      setEditingObs(false);
    }
    setSavingObs(false);
  };

  const handleCardClick = () => {
    if (editingObs) return;
    onView();
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={handleCardClick}
      onKeyDown={(e) => {
        if ((e.key === 'Enter' || e.key === ' ') && !editingObs) {
          e.preventDefault();
          onView();
        }
      }}
      className={cn(
        'group w-full text-left rounded-2xl border border-border/60 bg-card inset-card-compact cursor-pointer',
        'transition-all duration-180 ease-out',
        'hover:border-border hover:shadow-[0_4px_14px_rgba(0,0,0,0.06)] hover:-translate-y-px',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
      )}
    >
      <div className={cn("flex items-start inline-default")}>
        {/* DATA + HORA + PREP RING (coluna fixa à esquerda) */}
        <div className={cn("flex flex-col items-center inline-snug w-22 shrink-0 pt-0.5")}>
          <div className="text-center">
            <div className={cn(/* design-system-escape: leading-tight sem token DS */ "text-caption font-semibold text-foreground leading-tight whitespace-nowrap")}>
              {format(dataInicio, 'dd MMM yyyy', { locale: ptBR })}
            </div>
            {audiencia.horaInicio && (
              <>
                <div className={cn("mt-0.5 text-micro-caption uppercase tracking-wider text-muted-foreground/55")}>
                  Início
                </div>
                <div className="text-mono-num text-muted-foreground/55 tabular-nums">
                  {audiencia.horaInicio.substring(0, 5).replace(':', 'h')}
                </div>
              </>
            )}
          </div>
          <PrepRing audiencia={audiencia} />
        </div>

        {/* MAIN INFO */}
        <div className="flex-1 min-w-0">

          {/* L1 — Título + badges/flags à direita */}
          <div className={cn("flex items-center inline-tight")}>
            <h3 className="text-card-title text-foreground truncate">
              {audiencia.tipoDescricao || 'Audiência'}
            </h3>
            <div className={cn("ml-auto flex items-center inline-snug shrink-0")}>
              {audiencia.modalidade && (
                <span className="inline-flex items-center gap-1 rounded-md bg-primary/10 border border-primary/20 px-1.5 py-0.5 text-[10px] font-medium text-primary">
                  <ModalidadeIcon className="w-2 h-2" />
                  {MODALIDADE_AUDIENCIA_LABELS[audiencia.modalidade]}
                </span>
              )}
              {countdown ? (
                <span className={cn(
                   'inline-flex items-center inline-micro text-micro-caption font-semibold',
                  countdown.isUrgent ? 'text-warning' : 'text-success'
                )}>
                  <Clock className="w-3 h-3" />
                  {countdown.text}
                </span>
              ) : (
                <SemanticBadge
                  category="audiencia_status"
                  value={audiencia.status}
                  className="text-micro-caption"
                >
                  {STATUS_AUDIENCIA_LABELS[audiencia.status]}
                </SemanticBadge>
              )}
              {audiencia.segredoJustica && (
                <span className="inline-flex items-center gap-1 bg-warning/10 border border-warning/25 text-warning rounded-md px-1.5 py-0.5 text-[10px] font-medium">
                  <Lock className="w-2 h-2" />
                  Segredo
                </span>
              )}
              {audiencia.juizoDigital && (
                <span className="inline-flex items-center gap-1 bg-info/10 border border-info/25 text-info rounded-md px-1.5 py-0.5 text-[10px] font-medium">
                  <Monitor className="w-2 h-2" />
                  Digital
                </span>
              )}
              {audiencia.designada && (
                <span className="inline-flex items-center gap-1 bg-success/10 border border-success/25 text-success rounded-md px-1.5 py-0.5 text-[10px] font-medium">
                  <CheckCircle2 className="w-2 h-2" />
                  Designada
                </span>
              )}
              {(audiencia.poloAtivoRepresentaVarios || audiencia.poloPassivoRepresentaVarios) && (
                <span className="inline-flex items-center gap-1 bg-muted border border-border/70 text-muted-foreground rounded-md px-1.5 py-0.5 text-[10px] font-medium">
                  <Users className="w-2 h-2" />
                  Litisconsórcio
                </span>
              )}
            </div>
          </div>

          {/* Identidade Processual */}
          <div className={cn("flex flex-col mt-3 border-t border-border/40 pt-3 stack-micro")}>
            <p className="text-sm font-semibold text-foreground leading-snug">
              {poloAtivo}
              {poloAtivo !== '—' && poloPassivo !== '—' && (
                <span className="mx-1.5 text-[10px] font-normal text-muted-foreground/65">vs</span>
              )}
              {poloPassivo !== '—' && (
                <span className="font-medium text-muted-foreground/80">{poloPassivo}</span>
              )}
            </p>
            <p className="truncate text-mono-num">
              {[audiencia.trt, grauLabel, audiencia.salaAudienciaNome, audiencia.numeroProcesso].filter(Boolean).join(' · ')}
            </p>
            {orgaoJulgador && (
              <p className="truncate text-mono-num text-muted-foreground/55">{orgaoJulgador}</p>
            )}
          </div>

          {/* Observações (editável) */}
          <div
            className={cn("mt-3 border-t border-border/40 pt-3")}
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.stopPropagation()}
          >
            {editingObs ? (
              <div className={cn("flex flex-col stack-snug")}>
                <Textarea
                  value={obsDraft}
                  onChange={(e) => setObsDraft(e.target.value)}
                  placeholder="Anotações sobre a audiência..."
                  rows={2}
                  className="text-caption"
                  autoFocus
                />
                <div className={cn("flex items-center justify-end inline-micro")}>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={handleCancelObs}
                    className={cn("h-6 text-caption px-2")}
                  >
                    <X className="w-3 h-3" />
                    Cancelar
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleSaveObs}
                    disabled={savingObs}
                    className={cn("h-6 text-caption px-2")}
                  >
                    {savingObs ? (
                      <LoadingSpinner size="sm" />
                    ) : (
                      <Check className="w-3 h-3" />
                    )}
                    Salvar
                  </Button>
                </div>
              </div>
            ) : (
              <div>
                <Text variant="overline" as="p" className="mb-1">Observações</Text>
                <button
                  type="button"
                  onClick={handleStartObs}
                  className={cn(
                    'flex items-center inline-snug rounded-md px-1.5 py-1 -mx-1.5 -my-1 w-full text-left',
                    'transition-colors cursor-pointer hover:bg-muted/60',
                    obsValue ? 'text-foreground/75' : 'text-muted-foreground/60'
                  )}
                >
                  <span className={cn("text-caption flex-1 line-clamp-1 leading-snug")}>
                    {obsValue || 'Adicionar observações'}
                  </span>
                  <Pencil className="w-2.5 h-2.5 shrink-0 text-muted-foreground/65 opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
              </div>
            )}
          </div>

          {/* Footer */}
          {!editingObs && (
            <div
              className={cn("mt-3 border-t border-border/40 pt-3 flex items-center inline-snug")}
              onClick={(e) => e.stopPropagation()}
              onKeyDown={(e) => e.stopPropagation()}
            >
              <div className={cn("flex items-center inline-micro")}>
                <button
                  type="button"
                  onClick={onView}
                  className={cn(/* design-system-escape: px-2 padding direcional sem Inset equiv.; */ "flex h-6 cursor-pointer items-center inline-micro rounded-md border border-border/40 px-2 text-[10px] font-medium text-muted-foreground/75 transition-colors hover:border-border/60 hover:text-muted-foreground/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring")}
                >
                  <ExternalLink className="size-3" />
                  Detalhes
                </button>
                {hasVirtualRoom && audiencia.urlAudienciaVirtual && (
                  <a
                    href={audiencia.urlAudienciaVirtual}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className={cn(/* design-system-escape: px-2 padding direcional sem Inset equiv.; */ "flex h-6 items-center inline-micro rounded-md border border-info/25 bg-info/10 px-2 text-[10px] font-medium text-info transition-colors hover:bg-info/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring")}
                  >
                    <ExternalLink className="size-3" />
                    Entrar na sala
                  </a>
                )}
              </div>
              <div className="ml-auto">
                <AudienciaResponsavelPopover
                  audienciaId={audiencia.id}
                  responsavelId={audiencia.responsavelId}
                  usuarios={usuarios}
                >
                  <ResponsavelTriggerContent
                    responsavelId={audiencia.responsavelId}
                    usuarios={usuarios}
                    size="sm"
                  />
                </AudienciaResponsavelPopover>
              </div>
            </div>
          )}
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
    <div className={cn("flex flex-col inline-tight")}>
      {Array.from({ length: 5 }, (_, i) => (
        <div key={i} className={cn("rounded-2xl border border-border/60 bg-card inset-card-compact")}>
          <div className={cn("flex items-start inline-default")}>
            <div className={cn("flex flex-col items-center inline-tight w-21 shrink-0")}>
              <Skeleton className="w-11 h-11 rounded-full" />
              <Skeleton className="h-3 w-14" />
              <Skeleton className="h-3 w-12" />
            </div>
            <div className={cn("flex flex-col flex-1 stack-tight")}>
              <Skeleton className="h-4 w-64" />
              <Skeleton className="h-3.5 w-full" />
              <Skeleton className="h-3 w-48" />
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

function EmptyState() {
  return (
    <div className={cn("flex flex-col items-center justify-center py-16 opacity-60")}>
      <Gavel className="w-10 h-10 text-muted-foreground/55 mb-4" />
      <p className={cn( "text-body-sm font-medium text-muted-foreground/70")}>Nenhuma audiência encontrada</p>
      <Text variant="caption" className="text-muted-foreground/55 mt-1">
        Tente ajustar os filtros ou criar uma nova audiência
      </Text>
    </div>
  );
}

// =============================================================================
// COMPONENTE PRINCIPAL
// =============================================================================

export function AudienciasGlassList({ audiencias, isLoading, onView, usuarios }: AudienciasGlassListProps) {
  if (isLoading) return <ListSkeleton />;
  if (audiencias.length === 0) return <EmptyState />;

  return (
    <TooltipProvider>
      <div className={cn("flex flex-col inline-tight")}>
        {audiencias.map((aud) => (
          <GlassRow key={aud.id} audiencia={aud} onView={() => onView(aud)} usuarios={usuarios} />
        ))}
      </div>
    </TooltipProvider>
  );
}
