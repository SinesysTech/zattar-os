'use client';

/**
 * PericiasMonthWrapper — View de mês (thin).
 * ============================================================================
 * Layout master-detail: calendário compacto (esquerda) + lista do dia
 * (direita). Toolbar vive no PericiasClient pai.
 * ============================================================================
 */

import * as React from 'react';
import { startOfMonth, endOfMonth, format } from 'date-fns';

import {
  TemporalViewLoading,
  TemporalViewError,
} from '@/components/shared';
import { GlassPanel } from '@/components/shared/glass-panel';

import {
  SituacaoPericiaCodigo,
  type UsuarioOption,
  type EspecialidadePericiaOption,
  type PeritoOption,
} from '../domain';
import { usePericias } from '../hooks/use-pericias';

import { PericiasCalendarCompact } from './pericias-calendar-compact';
import { PericiasDayList } from './pericias-day-list';
import type {
  SituacaoFilterType,
  ResponsavelFilterType,
  LaudoFilterType,
} from './pericias-filter-bar';

// =============================================================================
// TIPOS
// =============================================================================

export interface PericiasMonthWrapperProps {
  busca: string;
  situacaoFilter: SituacaoFilterType;
  responsavelFilter: ResponsavelFilterType;
  laudoFilter: LaudoFilterType;
  tribunalFilter: string;
  grauFilter: string;
  especialidadeFilter: string;
  peritoFilter: string;
  usuarios: UsuarioOption[];
  especialidades: EspecialidadePericiaOption[];
  peritos: PeritoOption[];
  refetchKey: number;
}

// =============================================================================
// COMPONENTE
// =============================================================================

export function PericiasMonthWrapper({
  busca,
  situacaoFilter,
  responsavelFilter,
  laudoFilter,
  tribunalFilter,
  grauFilter,
  especialidadeFilter,
  peritoFilter,
  refetchKey,
}: PericiasMonthWrapperProps) {
  // ---------- Navegação de calendário ----------
  const [selectedDate, setSelectedDate] = React.useState<Date>(new Date());
  const [currentMonth, setCurrentMonth] = React.useState<Date>(new Date());

  // ---------- Hook params ----------
  const hookParams = React.useMemo(() => {
    const params: Record<string, unknown> = {
      pagina: 1,
      limite: 1000,
      busca: busca || undefined,
      prazoEntregaInicio: format(startOfMonth(currentMonth), 'yyyy-MM-dd'),
      prazoEntregaFim: format(endOfMonth(currentMonth), 'yyyy-MM-dd'),
    };

    if (situacaoFilter !== 'todos') {
      params.situacaoCodigo = situacaoFilter;
    } else {
      params.situacoesExcluidas = [
        SituacaoPericiaCodigo.FINALIZADA,
        SituacaoPericiaCodigo.CANCELADA,
      ];
    }

    if (responsavelFilter === 'sem_responsavel') {
      params.semResponsavel = true;
    } else if (typeof responsavelFilter === 'number') {
      params.responsavelId = responsavelFilter;
    }

    if (laudoFilter === 'sim') params.laudoJuntado = true;
    if (laudoFilter === 'nao') params.laudoJuntado = false;

    if (tribunalFilter) params.trt = tribunalFilter;
    if (grauFilter) params.grau = grauFilter;
    if (especialidadeFilter)
      params.especialidadeId = parseInt(especialidadeFilter, 10);
    if (peritoFilter) params.peritoId = parseInt(peritoFilter, 10);

    return params;
  }, [
    busca,
    currentMonth,
    situacaoFilter,
    responsavelFilter,
    laudoFilter,
    tribunalFilter,
    grauFilter,
    especialidadeFilter,
    peritoFilter,
  ]);

  const { pericias, isLoading, error, refetch } = usePericias(hookParams);

  React.useEffect(() => {
    if (refetchKey > 0) {
      refetch();
    }
  }, [refetchKey, refetch]);

  if (isLoading) {
    return <TemporalViewLoading message="Carregando perícias..." />;
  }

  if (error) {
    return (
      <TemporalViewError
        message={`Erro ao carregar perícias: ${error}`}
        onRetry={refetch}
      />
    );
  }

  return (
    <GlassPanel depth={1} className="overflow-hidden">
      <div className="flex h-[calc(100vh-380px)] min-h-140">
        {/* Calendário compacto — largura fixa */}
        <div className="w-105 shrink-0 border-r border-border/30 p-6 overflow-auto">
          <PericiasCalendarCompact
            selectedDate={selectedDate}
            onDateSelect={setSelectedDate}
            pericias={pericias}
            currentMonth={currentMonth}
            onMonthChange={setCurrentMonth}
          />
        </div>

        {/* Lista do dia — ocupa espaço restante */}
        <div className="flex-1 min-w-0">
          <PericiasDayList
            selectedDate={selectedDate}
            pericias={pericias}
          />
        </div>
      </div>
    </GlassPanel>
  );
}
