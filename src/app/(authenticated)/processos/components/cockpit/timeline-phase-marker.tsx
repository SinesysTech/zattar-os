'use client';

import { Scale, ArrowUpRight, Users, FileText } from 'lucide-react';
import { Text } from '@/components/ui/typography';
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
      className={cn(/* design-system-escape: gap-2 → migrar para <Inline gap="tight">; px-4 padding direcional sem Inset equiv.; py-2 padding direcional sem Inset equiv. */ 'flex items-center gap-2 px-4 py-2', className)}
      aria-label={`Fase: ${config.label}`}
    >
      <div className="h-px flex-1 bg-border/8" />
      <Icon className="size-3 text-muted-foreground/55 shrink-0" />
      <Text variant="overline" as="span" className={cn(/* design-system-escape: font-bold → className de <Text>/<Heading> */ "text-muted-foreground/55 font-bold whitespace-nowrap shrink-0")}>
        Fase: {config.label}
      </Text>
      <div className="h-px flex-1 bg-border/8" />
    </div>
  );
}
