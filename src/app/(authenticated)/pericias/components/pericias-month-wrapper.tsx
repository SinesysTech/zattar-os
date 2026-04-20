'use client';

/**
 * PericiasMonthWrapper — View de mês (thin).
 * ============================================================================
 * Busca perícias do mês e renderiza PericiasGlassMonth (padrão audiências).
 * Toolbar vive no PericiasClient pai.
 * ============================================================================
 */

import * as React from 'react';
import { startOfMonth, endOfMonth, format } from 'date-fns';

import {
  TemporalViewLoading,
  TemporalViewError,
} from '@/components/shared';

import {
  SituacaoPericiaCodigo,
  type UsuarioOption,
  type EspecialidadePericiaOption,
  type PeritoOption,
} from '../domain';
import { usePericias } from '../hooks/use-pericias';

import { PericiasGlassMonth } from './pericias-glass-month';
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
  // Navegação mensal interna ao wrapper (persiste o estado local ao mudar de view)
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
    <PericiasGlassMonth
      pericias={pericias}
      currentMonth={currentMonth}
      onMonthChange={setCurrentMonth}
    />
  );
}
