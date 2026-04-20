'use client';

/**
 * PericiasSemanaWrapper — View de semana (thin)
 * ============================================================================
 * Busca perícias da semana selecionada e renderiza PericiasSemanaView.
 * Toolbar vive no PericiasClient pai.
 * ============================================================================
 */

import * as React from 'react';
import { startOfWeek, endOfWeek, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

import {
  TemporalViewLoading,
  TemporalViewError,
} from '@/components/shared';

import {
  SituacaoPericiaCodigo,
  type Pericia,
  type UsuarioOption,
  type EspecialidadePericiaOption,
  type PeritoOption,
} from '../domain';
import { usePericias } from '../hooks/use-pericias';

import { PericiasSemanaView } from './pericias-semana-view';
import { PericiaDetalhesDialog } from './pericia-detalhes-dialog';
import type {
  SituacaoFilterType,
  ResponsavelFilterType,
  LaudoFilterType,
} from './pericias-filter-bar';

// =============================================================================
// TIPOS
// =============================================================================

export interface PericiasSemanaWrapperProps {
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
  /** Data da semana selecionada (qualquer dia da semana). */
  weekDate: Date;
  /** Callback quando usuário navega para outra semana. */
  onWeekDateChange: (date: Date) => void;
}

// =============================================================================
// COMPONENTE
// =============================================================================

export function PericiasSemanaWrapper({
  busca,
  situacaoFilter,
  responsavelFilter,
  laudoFilter,
  tribunalFilter,
  grauFilter,
  especialidadeFilter,
  peritoFilter,
  refetchKey,
  weekDate,
  onWeekDateChange,
}: PericiasSemanaWrapperProps) {
  // Detail dialog
  const [selectedPericia, setSelectedPericia] =
    React.useState<Pericia | null>(null);
  const [isDetailOpen, setIsDetailOpen] = React.useState(false);

  const handleViewDetail = React.useCallback((p: Pericia) => {
    setSelectedPericia(p);
    setIsDetailOpen(true);
  }, []);

  // Hook params
  const hookParams = React.useMemo(() => {
    const start = startOfWeek(weekDate, { locale: ptBR, weekStartsOn: 1 });
    const end = endOfWeek(weekDate, { locale: ptBR, weekStartsOn: 1 });

    const params: Record<string, unknown> = {
      pagina: 1,
      limite: 1000,
      busca: busca || undefined,
      prazoEntregaInicio: format(start, 'yyyy-MM-dd'),
      prazoEntregaFim: format(end, 'yyyy-MM-dd'),
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
    weekDate,
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
    <>
      <PericiasSemanaView
        pericias={pericias}
        currentDate={weekDate}
        onDateChange={onWeekDateChange}
        onViewDetail={handleViewDetail}
      />

      <PericiaDetalhesDialog
        pericia={selectedPericia}
        open={isDetailOpen}
        onOpenChange={setIsDetailOpen}
      />
    </>
  );
}
