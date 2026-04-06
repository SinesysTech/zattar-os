'use client';

import { Scale, Briefcase, Archive, CalendarClock } from 'lucide-react';
import { PulseStrip, type PulseItem } from '@/components/dashboard/pulse-strip';
import type { ProcessoStats } from '../service-estatisticas';

interface ProcessosPulseStripProps {
  stats: ProcessoStats;
}

/**
 * KPI strip do acervo de processos.
 * Acervo (total) | Em Curso | Arquivados | Com Eventos
 */
export function ProcessosPulseStrip({ stats }: ProcessosPulseStripProps) {
  const items: PulseItem[] = [
    { label: 'Acervo', total: stats.total, icon: Scale, color: 'text-primary' },
    { label: 'Em Curso', total: stats.emCurso, icon: Briefcase, color: 'text-success' },
    { label: 'Arquivados', total: stats.arquivados, icon: Archive, color: 'text-muted-foreground' },
    { label: 'Com Eventos', total: stats.comEventos, icon: CalendarClock, color: 'text-warning' },
  ];

  return <PulseStrip items={items} />;
}
