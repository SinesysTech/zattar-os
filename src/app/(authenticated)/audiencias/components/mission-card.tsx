/**
 * MissionCard — Card hero da próxima audiência (Glass Briefing)
 * ============================================================================
 * Destaca a audiência mais próxima com:
 * - Countdown em tempo real com cores de urgência
 * - Grid de informações (horário, tribunal, processo, modalidade)
 * - Faixa de partes (polo ativo vs polo passivo)
 * - PrepScore com breakdown + ações rápidas
 * - Ambient glow + GlassPanel depth=3
 * ============================================================================
 */

'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Video,
  Building2,
  Sparkles as SparklesIcon,
  ExternalLink,
  FileText,
  Users,
  Gavel,
  ArrowRight,
  CheckCircle2,
  Circle,
  type LucideIcon,
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { GlassPanel } from '@/components/shared/glass-panel';
import { IconContainer } from '@/components/ui/icon-container';
import { Heading, Text } from '@/components/ui/typography';

import type { Audiencia } from '../domain';
import { MODALIDADE_AUDIENCIA_LABELS } from '../domain';
import { calcPrepItems, calcPrepScore } from './prep-score';

// ─── Types ────────────────────────────────────────────────────────────────

export interface MissionCardProps {
  audiencia: Audiencia;
  onOpenProcess?: (processoId: number) => void;
  onOpenPje?: (audiencia: Audiencia) => void;
  onJoinVirtual?: (url: string) => void;
  onViewChecklist?: (audiencia: Audiencia) => void;
  className?: string;
}

interface QuickAction {
  label: string;
  icon: LucideIcon;
  onClick?: () => void;
  primary?: boolean;
}

// ─── Helpers ──────────────────────────────────────────────────────────────

const MODALIDADE_ICON: Record<string, LucideIcon> = {
  virtual: Video,
  presencial: Building2,
  hibrida: SparklesIcon,
};

function getPrepColor(score: number): string {
  if (score >= 80) return 'var(--success)';
  if (score >= 50) return 'var(--warning)';
  return 'var(--destructive)';
}

function getUrgencyStyles(totalMs: number) {
  if (totalMs <= 0) return { text: 'text-muted-foreground/55', bg: 'bg-muted-foreground/5' };
  if (totalMs <= 15 * 60 * 1000) return { text: 'text-destructive', bg: 'bg-destructive/8' };
  if (totalMs <= 60 * 60 * 1000) return { text: 'text-warning', bg: 'bg-warning/8' };
  return { text: 'text-primary', bg: 'bg-primary/6' };
}

// ─── Component ────────────────────────────────────────────────────────────

export function MissionCard({
  audiencia,
  onOpenProcess,
  onOpenPje,
  onJoinVirtual,
  onViewChecklist,
  className,
}: MissionCardProps) {
  const [, setTick] = useState(0);

  // Update every second for countdown
  useEffect(() => {
    const interval = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  const dataInicio = useMemo(() => parseISO(audiencia.dataInicio), [audiencia.dataInicio]);
  const dataFim = useMemo(() => parseISO(audiencia.dataFim), [audiencia.dataFim]);
  const isPast = dataFim < new Date();
  const isOngoing = dataInicio <= new Date() && dataFim >= new Date();

  const prepItems = useMemo(() => calcPrepItems(audiencia), [audiencia]);
  const prepScore = useMemo(() => calcPrepScore(prepItems), [prepItems]);

  const ModalIcon = audiencia.modalidade ? (MODALIDADE_ICON[audiencia.modalidade] ?? Gavel) : Gavel;
  const modalidadeLabel = audiencia.modalidade ? MODALIDADE_AUDIENCIA_LABELS[audiencia.modalidade] : null;

  // Countdown
  const diff = dataInicio.getTime() - Date.now();
  const hours = Math.max(0, Math.floor(diff / (1000 * 60 * 60)));
  const minutes = Math.max(0, Math.floor((diff / (1000 * 60)) % 60));
  const seconds = Math.max(0, Math.floor((diff / 1000) % 60));
  const pad = (n: number) => String(n).padStart(2, '0');
  const urgency = getUrgencyStyles(diff);

  // Prep ring
  const ringSize = 48;
  const strokeWidth = 5;
  const radius = (ringSize - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (prepScore / 100) * circumference;
  const prepColor = getPrepColor(prepScore);
  const prepStatus = prepScore >= 80 ? 'text-success' : prepScore >= 50 ? 'text-warning' : 'text-destructive';

  // Quick actions
  const actions = useMemo(() => {
    const list: QuickAction[] = [];

    if (audiencia.urlAudienciaVirtual && (audiencia.modalidade === 'virtual' || audiencia.modalidade === 'hibrida')) {
      list.push({
        label: 'Entrar na sala',
        icon: Video,
        onClick: () => onJoinVirtual?.(audiencia.urlAudienciaVirtual!),
        primary: isOngoing,
      });
    }

    list.push({
      label: 'Ver processo',
      icon: FileText,
      onClick: () => onOpenProcess?.(audiencia.processoId),
    });

    list.push({
      label: 'Abrir PJe',
      icon: ExternalLink,
      onClick: () => onOpenPje?.(audiencia),
    });

    list.push({
      label: 'Checklist',
      icon: Users,
      onClick: () => onViewChecklist?.(audiencia),
    });

    return list;
  }, [audiencia, isOngoing, onOpenProcess, onOpenPje, onJoinVirtual, onViewChecklist]);

  return (
    <GlassPanel depth={3} className={cn('relative overflow-hidden', className)}>
      {/* Ambient glow */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-primary/3 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2 pointer-events-none" />

      <div className={cn(/* design-system-escape: sm:p-5 sem equivalente DS */ "relative inset-card-compact sm:p-5")}>
        {/* Header: Status + Countdown */}
        <div className={cn(/* design-system-escape: gap-3 gap sem token DS */ "flex items-start justify-between gap-3 mb-4")}>
          <div className={cn(/* design-system-escape: gap-2.5 gap sem token DS */ "flex items-center gap-2.5")}>
            <IconContainer size="md" className="bg-primary/10">
              <Gavel className="size-4 text-primary" />
            </IconContainer>
            <div>
              <div className={cn("flex items-center inline-tight")}>
                <span className={cn(/* design-system-escape: font-semibold → className de <Text>/<Heading>; tracking-wider sem token DS */ "text-micro-caption font-semibold uppercase tracking-wider text-primary/60")}>
                  {isOngoing ? 'Em andamento' : isPast ? 'Concluída' : 'Próxima missão'}
                </span>
                {isOngoing && <span className="size-1.5 rounded-full bg-success animate-pulse" />}
              </div>
              <Heading level="card" className="mt-0.5">
                {audiencia.tipoDescricao || 'Audiência'}
              </Heading>
            </div>
          </div>

          {/* Countdown */}
          {!isPast && diff > 0 && (
            <div className={cn(/* design-system-escape: gap-1 gap sem token DS; px-2.5 padding direcional sem Inset equiv.; py-1.5 padding direcional sem Inset equiv. */ 'inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg', urgency.bg)}>
              <div className={cn(/* design-system-escape: gap-0.5 gap sem token DS */ "flex items-center gap-0.5 tabular-nums")}>
                {hours > 0 && (
                  <>
                    <span className={cn(/* design-system-escape: font-bold → className de <Text>/<Heading> */ 'text-body-sm font-bold', urgency.text)}>{pad(hours)}</span>
                    <span className="text-micro-caption text-muted-foreground/60">:</span>
                  </>
                )}
                <span className={cn(/* design-system-escape: font-bold → className de <Text>/<Heading> */ 'text-body-sm font-bold', urgency.text)}>{pad(minutes)}</span>
                <span className="text-micro-caption text-muted-foreground/60">:</span>
                <span className={cn(/* design-system-escape: font-bold → className de <Text>/<Heading> */ 'text-body-sm font-bold', urgency.text)}>{pad(seconds)}</span>
              </div>
            </div>
          )}
        </div>

        {/* Info grid */}
        <div className={cn(/* design-system-escape: gap-3 gap sem token DS */ "grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4")}>
          <div className={cn(/* design-system-escape: gap-0.5 gap sem token DS */ "flex flex-col gap-0.5")}>
            <span className={cn(/* design-system-escape: tracking-wider sem token DS */ "text-micro-caption text-muted-foreground/60 uppercase tracking-wider")}>Horário</span>
            <span className={cn(/* design-system-escape: font-medium → className de <Text>/<Heading> */ "text-body-sm font-medium tabular-nums")}>
              {format(dataInicio, 'HH:mm', { locale: ptBR })} – {format(dataFim, 'HH:mm', { locale: ptBR })}
            </span>
          </div>
          <div className={cn(/* design-system-escape: gap-0.5 gap sem token DS */ "flex flex-col gap-0.5")}>
            <span className={cn(/* design-system-escape: tracking-wider sem token DS */ "text-micro-caption text-muted-foreground/60 uppercase tracking-wider")}>Tribunal</span>
            <div className={cn(/* design-system-escape: gap-1.5 gap sem token DS */ "flex items-center gap-1.5")}>
              <span className={cn(/* design-system-escape: font-medium → className de <Text>/<Heading> */ "text-body-sm font-medium")}>{audiencia.trt || '–'}</span>
              {audiencia.grau && (
                <span className="text-micro-caption text-muted-foreground/60">
                  {audiencia.grau === 'primeiro_grau' ? '1º grau' : audiencia.grau === 'segundo_grau' ? '2º grau' : 'Superior'}
                </span>
              )}
            </div>
          </div>
          <div className={cn(/* design-system-escape: gap-0.5 gap sem token DS */ "flex flex-col gap-0.5")}>
            <span className={cn(/* design-system-escape: tracking-wider sem token DS */ "text-micro-caption text-muted-foreground/60 uppercase tracking-wider")}>Processo</span>
            <span className="text-mono-num text-foreground/70 truncate">
              {audiencia.numeroProcesso}
            </span>
          </div>
          <div className={cn(/* design-system-escape: gap-0.5 gap sem token DS */ "flex flex-col gap-0.5")}>
            <span className={cn(/* design-system-escape: tracking-wider sem token DS */ "text-micro-caption text-muted-foreground/60 uppercase tracking-wider")}>Modalidade</span>
            <div className={cn(/* design-system-escape: gap-1.5 gap sem token DS */ "flex items-center gap-1.5")}>
              <ModalIcon className="size-3 text-muted-foreground/60" />
              <span className={cn(/* design-system-escape: font-medium → className de <Text>/<Heading> */ "text-body-sm font-medium")}>{modalidadeLabel || '–'}</span>
            </div>
          </div>
        </div>

        {/* Órgão jurisdicional */}
        {audiencia.orgaoJulgadorOrigem && (
          <div className={cn(/* design-system-escape: px-3 padding direcional sem Inset equiv.; py-1.5 padding direcional sem Inset equiv. */ "mb-2 px-3 py-1.5 rounded-lg bg-border/5")}>
            <span className={cn(/* design-system-escape: tracking-wider sem token DS */ "text-micro-caption text-muted-foreground/60 uppercase tracking-wider")}>Órgão Jurisdicional</span>
            <Text variant="caption" as="p" className="mt-0.5 text-foreground/70">{audiencia.orgaoJulgadorOrigem}</Text>
          </div>
        )}

        {/* Parties */}
        {(audiencia.poloAtivoNome || audiencia.poloPassivoNome) && (
          <div className={cn(/* design-system-escape: px-3 padding direcional sem Inset equiv.; py-2 padding direcional sem Inset equiv. */ "flex items-center inline-tight mb-4 px-3 py-2 rounded-lg bg-border/5")}>
            <span className="text-micro-caption text-foreground/70 truncate">{audiencia.poloAtivoNome || '–'}</span>
            <span className="text-micro-caption text-muted-foreground/55 shrink-0">vs</span>
            <span className="text-micro-caption text-foreground/70 truncate">{audiencia.poloPassivoNome || '–'}</span>
          </div>
        )}

        {/* Observações */}
        {audiencia.observacoes && (
          <div className={cn(/* design-system-escape: px-3 padding direcional sem Inset equiv.; py-2 padding direcional sem Inset equiv. */ "mb-4 px-3 py-2 rounded-lg bg-border/5")}>
            <span className={cn(/* design-system-escape: tracking-wider sem token DS */ "text-micro-caption text-muted-foreground/60 uppercase tracking-wider")}>Observações</span>
            <Text variant="caption" as="p" className="mt-0.5 line-clamp-2 italic text-foreground/60">{audiencia.observacoes}</Text>
          </div>
        )}

        {/* Bottom: Prep Score + Actions */}
        <div className={cn("flex items-end justify-between inline-default")}>
          {/* Prep Score */}
          <div className={cn(/* design-system-escape: gap-3 gap sem token DS */ "flex items-center gap-3")}>
            <div className="relative shrink-0" style={{ width: ringSize, height: ringSize }}>
              <svg width={ringSize} height={ringSize} className="-rotate-90">
                <circle cx={ringSize / 2} cy={ringSize / 2} r={radius} fill="none" stroke="currentColor" strokeWidth={strokeWidth} className="text-border/15" />
                <circle
                  cx={ringSize / 2} cy={ringSize / 2} r={radius} fill="none"
                  stroke={prepColor}
                  strokeWidth={strokeWidth}
                  strokeDasharray={circumference}
                  strokeDashoffset={offset}
                  strokeLinecap="round"
                  className="transition-all duration-700"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className={cn(/* design-system-escape: font-bold → className de <Text>/<Heading> */ 'font-bold tabular-nums text-caption', prepStatus)}>{prepScore}%</span>
              </div>
            </div>
            <div className={cn(/* design-system-escape: space-y-0.5 sem token DS */ "space-y-0.5")}>
              {prepItems.slice(0, 3).map((item) => (
                <div key={item.label} className={cn(/* design-system-escape: gap-1.5 gap sem token DS */ "flex items-center gap-1.5")}>
                  {item.done ? (
                    <CheckCircle2 className="size-2.5 text-success/60 shrink-0" />
                  ) : (
                    <Circle className="size-2.5 text-muted-foreground/65 shrink-0" />
                  )}
                  <span className={cn(
                    'text-micro-caption truncate',
                    item.done ? 'text-muted-foreground/70 line-through' : 'text-foreground/70',
                  )}>
                    {item.label}
                  </span>
                </div>
              ))}
              {prepItems.length > 3 && (
                <span className="text-micro-caption text-muted-foreground/60">+{prepItems.length - 3} itens</span>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className={cn(/* design-system-escape: gap-1 gap sem token DS */ "flex items-center gap-1")}>
            {actions.map((action) => (
              <button
                key={action.label}
                onClick={action.onClick}
                className={cn(
                  /* design-system-escape: gap-1.5 gap sem token DS; px-2.5 padding direcional sem Inset equiv.; py-1.5 padding direcional sem Inset equiv.; font-medium → className de <Text>/<Heading> */ 'flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-micro-caption font-medium transition-all cursor-pointer group',
                  action.primary
                    ? 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm'
                    : 'text-muted-foreground/70 hover:text-foreground/70 hover:bg-foreground/4',
                )}
              >
                <action.icon className="size-2.5" />
                <span className="hidden sm:inline">{action.label}</span>
                <ArrowRight className="size-2 opacity-0 group-hover:opacity-40 transition-opacity hidden sm:block" />
              </button>
            ))}
          </div>
        </div>
      </div>
    </GlassPanel>
  );
}
