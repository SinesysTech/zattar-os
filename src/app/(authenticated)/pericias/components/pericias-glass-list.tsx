'use client';

/**
 * PericiasGlassList — View de lista em cards glass (padrão AudienciasGlassList).
 * ============================================================================
 * Cada perícia é renderizada como um card com layout livre (não grid tabular):
 *   Linha 1  → Partes (AUTOR × RÉU) como título + Badge situação
 *   Linha 2  → #processo + badges TRT/Grau + especialidade
 *   Footer   → Perito + Avatar responsável + Countdown
 *
 * Sem truncate nas partes (respeita wrap). Urgência via border-left colorida.
 * ============================================================================
 */

import * as React from 'react';
import { differenceInCalendarDays, parseISO, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Sparkles, User, Briefcase } from 'lucide-react';

import { cn } from '@/lib/utils';
import { GlassPanel } from '@/components/shared/glass-panel';
import { AppBadge } from '@/components/ui/app-badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getSemanticBadgeVariant } from '@/lib/design-system';

import {
  SituacaoPericiaCodigo,
  SITUACAO_PERICIA_LABELS,
  type Pericia,
  type UsuarioOption,
} from '../domain';
import { GRAU_TRIBUNAL_LABELS } from '@/app/(authenticated)/expedientes';

// =============================================================================
// URGÊNCIA
// =============================================================================

type UrgencyLevel = 'critico' | 'alto' | 'medio' | 'baixo' | 'ok';

function getPericiaUrgency(p: Pericia): UrgencyLevel {
  if (
    p.situacaoCodigo === SituacaoPericiaCodigo.FINALIZADA ||
    p.situacaoCodigo === SituacaoPericiaCodigo.CANCELADA
  ) {
    return 'ok';
  }
  if (!p.prazoEntrega) return 'ok';
  try {
    const diff = differenceInCalendarDays(parseISO(p.prazoEntrega), new Date());
    if (diff < 0) return 'critico';
    if (diff === 0) return 'alto';
    if (diff <= 7) return 'medio';
    return 'baixo';
  } catch {
    return 'ok';
  }
}

function getDiasRestantes(p: Pericia): number | null {
  if (!p.prazoEntrega) return null;
  try {
    return differenceInCalendarDays(parseISO(p.prazoEntrega), new Date());
  } catch {
    return null;
  }
}

const URGENCY_BORDER: Record<UrgencyLevel, string> = {
  critico: 'border-l-[3px] border-l-destructive',
  alto: 'border-l-[3px] border-l-warning',
  medio: 'border-l-[3px] border-l-info',
  baixo: 'border-l-[3px] border-l-success',
  ok: 'border-l-[3px] border-l-border/20',
};

const URGENCY_COUNTDOWN: Record<UrgencyLevel, string> = {
  critico: 'bg-destructive/8 text-destructive',
  alto: 'bg-warning/8 text-warning',
  medio: 'bg-info/8 text-info',
  baixo: 'bg-success/6 text-success',
  ok: 'bg-muted text-muted-foreground/50',
};

// =============================================================================
// HELPERS
// =============================================================================

function getInitials(name: string | null | undefined): string {
  if (!name) return '—';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function getUsuarioNome(u: UsuarioOption): string {
  return (
    u.nomeExibicao ||
    u.nome_exibicao ||
    u.nomeCompleto ||
    u.nome ||
    `Usuário ${u.id}`
  );
}

function CountdownBadge({
  dias,
  urgency,
}: {
  dias: number | null;
  urgency: UrgencyLevel;
}) {
  if (dias === null) {
    return (
      <span className="text-[11px] text-muted-foreground/40 tabular-nums">—</span>
    );
  }
  const label =
    dias < 0 ? `${Math.abs(dias)}d⇓` : dias === 0 ? 'hoje' : `${dias}d`;
  return (
    <span
      className={cn(
        /* design-system-escape: font-semibold → className de <Text>/<Heading>; px-2 padding direcional sem Inset equiv.; py-0.5 padding direcional sem Inset equiv. */ 'text-[11px] font-semibold tabular-nums px-2 py-0.5 rounded-md',
        URGENCY_COUNTDOWN[urgency],
      )}
    >
      {label}
    </span>
  );
}

// =============================================================================
// RESPONSÁVEL CELL (Avatar + nome — espelha padrão audiências)
// =============================================================================

interface ResponsavelCellProps {
  responsavelId: number | null;
  usuarios: UsuarioOption[];
}

function ResponsavelCell({ responsavelId, usuarios }: ResponsavelCellProps) {
  const responsavel = responsavelId
    ? usuarios.find((u) => u.id === responsavelId)
    : null;
  const nome = responsavel ? getUsuarioNome(responsavel) : null;

  if (responsavel && nome) {
    return (
      <div className={cn("flex items-center inline-tight min-w-0")}>
        <Avatar size="xs" className="shrink-0 size-6">
          <AvatarImage src={responsavel.avatarUrl || undefined} alt={nome} />
          <AvatarFallback className="text-[9px]">
            {getInitials(nome)}
          </AvatarFallback>
        </Avatar>
        <span className={cn(/* design-system-escape: font-medium → className de <Text>/<Heading> */ "text-[12px] font-medium text-foreground/85 truncate")}>
          {nome}
        </span>
      </div>
    );
  }

  return (
    <div className={cn("flex items-center inline-tight min-w-0")}>
      <div className="size-6 rounded-full bg-muted/40 flex items-center justify-center shrink-0">
        <User className="size-3 text-muted-foreground/40" />
      </div>
      <span className="text-[11px] italic text-warning/70">Sem responsável</span>
    </div>
  );
}

// =============================================================================
// GLASS ROW
// =============================================================================

interface GlassRowProps {
  pericia: Pericia;
  usuarios: UsuarioOption[];
  onViewDetail: () => void;
}

function GlassRow({ pericia, usuarios, onViewDetail }: GlassRowProps) {
  const urgency = getPericiaUrgency(pericia);
  const dias = getDiasRestantes(pericia);

  const parteAutora = pericia.processo?.nomeParteAutora;
  const parteRe = pericia.processo?.nomeParteRe;
  const especialidade = pericia.especialidade?.descricao;
  const perito = pericia.perito?.nome;
  const prazoFormatted = pericia.prazoEntrega
    ? format(parseISO(pericia.prazoEntrega), 'dd/MM/yyyy', { locale: ptBR })
    : null;

  const grauLabel = pericia.grau
    ? GRAU_TRIBUNAL_LABELS[pericia.grau as keyof typeof GRAU_TRIBUNAL_LABELS] ??
      pericia.grau
    : null;

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
        'group w-full text-left rounded-2xl border border-border/60 bg-card inset-card-compact cursor-pointer',
        'transition-all duration-180 ease-out',
        'hover:border-border hover:shadow-[0_4px_14px_rgba(0,0,0,0.06)] hover:-translate-y-px',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
        URGENCY_BORDER[urgency],
      )}
    >
      {/* ── Linha 1: Partes (título) · Perito · Especialidade · Situação ── */}
      <div className={cn("flex items-start justify-between inline-medium flex-wrap")}>
        <div className={cn("flex-1 min-w-0 flex items-baseline inline-medium flex-wrap")}>
          <h3 className={cn(/* design-system-escape: font-semibold → className de <Text>/<Heading>; leading-snug sem token DS */ "text-body-sm font-semibold text-foreground leading-snug wrap-break-word")}>
            {parteAutora || 'Autor não informado'}
            <span className={cn(/* design-system-escape: mx-2 margin sem primitiva DS; font-medium → className de <Text>/<Heading> */ "mx-2 text-muted-foreground/50 font-medium")}>×</span>
            {parteRe || 'Réu não informado'}
          </h3>

          {perito && (
            <span className={cn("inline-flex items-baseline inline-snug text-[12px] text-foreground/70 wrap-break-word")}>
              <Briefcase className="size-3 text-muted-foreground/50 translate-y-0.5 shrink-0" />
              <span className="wrap-break-word">{perito}</span>
            </span>
          )}
        </div>

        <div className={cn("flex items-center inline-tight shrink-0")}>
          {especialidade && (
            <span className={cn(/* design-system-escape: px-2 padding direcional sem Inset equiv.; py-0.5 padding direcional sem Inset equiv.; font-semibold → className de <Text>/<Heading>; tracking-wider sem token DS */ "inline-flex items-center rounded bg-muted border border-border/50 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-muted-foreground")}>
              {especialidade}
            </span>
          )}
          <AppBadge
            variant={getSemanticBadgeVariant(
              'pericia_situacao',
              pericia.situacaoCodigo,
            )}
            className={cn(/* design-system-escape: px-2 padding direcional sem Inset equiv.; py-0.5 padding direcional sem Inset equiv.; font-semibold → className de <Text>/<Heading>; tracking-wider sem token DS */ "text-[10px] px-2 py-0.5 font-semibold uppercase tracking-wider")}
          >
            {SITUACAO_PERICIA_LABELS[pericia.situacaoCodigo]}
          </AppBadge>
        </div>
      </div>

      {/* ── Linha 2: # Processo + TRT badge + Grau badge ───────── */}
      <div className={cn("mt-2 flex flex-wrap items-center inline-snug")}>
        <span className={cn(/* design-system-escape: font-medium → className de <Text>/<Heading> */ "text-[12px] font-medium tabular-nums text-muted-foreground")}>
          {pericia.numeroProcesso}
        </span>
        {pericia.trt && (
          <span className={cn(/* design-system-escape: px-1.5 padding direcional sem Inset equiv.; py-0.5 padding direcional sem Inset equiv.; font-semibold → className de <Text>/<Heading>; tracking-wider sem token DS */ "inline-flex items-center rounded bg-primary/8 border border-primary/15 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-primary/80")}>
            {pericia.trt}
          </span>
        )}
        {grauLabel && (
          <span className={cn(/* design-system-escape: px-1.5 padding direcional sem Inset equiv.; py-0.5 padding direcional sem Inset equiv.; font-semibold → className de <Text>/<Heading>; tracking-wider sem token DS */ "inline-flex items-center rounded bg-muted border border-border/50 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-muted-foreground")}>
            {grauLabel}
          </span>
        )}
      </div>

      {/* ── Footer: Prazo · Responsável · Countdown ── */}
      <div className={cn(/* design-system-escape: pt-3 padding direcional sem Inset equiv. */ "mt-3 pt-3 border-t border-border/40 flex items-center justify-between inline-medium flex-wrap")}>
        <div className={cn("flex items-center inline-default min-w-0 flex-wrap")}>
          {prazoFormatted && (
            <div className={cn("flex items-center inline-snug")}>
              <span className={cn(/* design-system-escape: tracking-wider sem token DS; font-medium → className de <Text>/<Heading> */ "text-[10px] uppercase tracking-wider text-muted-foreground/55 font-medium")}>
                Prazo
              </span>
              <span className={cn(/* design-system-escape: font-medium → className de <Text>/<Heading> */ "text-[12px] font-medium tabular-nums text-foreground/85")}>
                {prazoFormatted}
              </span>
            </div>
          )}
        </div>

        <div className={cn("flex items-center inline-medium shrink-0")}>
          <ResponsavelCell
            responsavelId={pericia.responsavelId}
            usuarios={usuarios}
          />
          <CountdownBadge dias={dias} urgency={urgency} />
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export interface PericiasGlassListProps {
  pericias: Pericia[];
  isLoading: boolean;
  onViewDetail: (pericia: Pericia) => void;
  usuarios: UsuarioOption[];
  emptyMessage?: string;
}

export function PericiasGlassList({
  pericias,
  isLoading,
  onViewDetail,
  usuarios,
  emptyMessage = 'Nenhuma perícia encontrada.',
}: PericiasGlassListProps) {
  if (isLoading) {
    return (
      <div className={cn("stack-tight")}>
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-28 w-full rounded-2xl" />
        ))}
      </div>
    );
  }

  if (pericias.length === 0) {
    return (
      <GlassPanel
        depth={1}
        className={cn(/* design-system-escape: p-12 → usar <Inset> */ "p-12 flex flex-col items-center justify-center text-center")}
      >
        <Sparkles className="size-10 text-primary/30 mb-3" />
        <p className={cn("text-body-sm text-muted-foreground")}>{emptyMessage}</p>
      </GlassPanel>
    );
  }

  return (
    <div className={cn("stack-tight")}>
      {pericias.map((pericia) => (
        <GlassRow
          key={pericia.id}
          pericia={pericia}
          usuarios={usuarios}
          onViewDetail={() => onViewDetail(pericia)}
        />
      ))}
    </div>
  );
}
