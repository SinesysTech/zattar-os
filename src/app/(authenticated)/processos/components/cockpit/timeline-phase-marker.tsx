'use client';

import { Scale, ArrowUpRight, Users, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ProcessoPhase } from './types';
import { PHASE_CONFIG } from './types';

const PHASE_ICONS = {
  recurso: ArrowUpRight,
  sentenca: Scale,
  instrucao: Users,
  conhecimento: FileText,
} as const;

interface TimelinePhaseMarkerProps {
  phase: ProcessoPhase;
  className?: string;
}

export function TimelinePhaseMarker({ phase, className }: TimelinePhaseMarkerProps) {
  const config = PHASE_CONFIG[phase];
  const Icon = PHASE_ICONS[phase];

  return (
    <div
      className={cn('flex items-center gap-2 px-4 py-2', className)}
      aria-label={`Fase: ${config.label}`}
    >
      <div className="h-px flex-1 bg-border/8" />
      <Icon className="size-3 text-muted-foreground/25 shrink-0" />
      <span className="text-[9px] uppercase tracking-[0.15em] text-muted-foreground/30 font-bold whitespace-nowrap shrink-0">
        Fase: {config.label}
      </span>
      <div className="h-px flex-1 bg-border/8" />
    </div>
  );
}
