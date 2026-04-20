'use client';

/**
 * PericiasYearWrapper — View de ano (thin).
 * ============================================================================
 * Renderiza o heatmap anual. Year navigator + filtros + toolbar vivem no
 * PericiasClient pai. O heatmap recebe `year` controlled e dispara
 * `onYearChange` quando o usuário clica no navigator (mas agora ele nem
 * aparece mais — fica no toolbar via YearFilterPopover).
 * ============================================================================
 */

import * as React from 'react';
import { startOfYear, endOfYear, format } from 'date-fns';

import {
  TemporalViewLoading,
  TemporalViewError,
} from '@/components/shared';

import type {
  Pericia,
  UsuarioOption,
  EspecialidadePericiaOption,
  PeritoOption,
} from '../domain';
import { SituacaoPericiaCodigo } from '../domain';
import { usePericias } from '../hooks/use-pericias';

import { PericiasYearHeatmap } from './pericias-year-heatmap';
import { PericiaDetalhesDialog } from './pericia-detalhes-dialog';
import type {
  SituacaoFilterType,
  ResponsavelFilterType,
  LaudoFilterType,
} from './pericias-filter-bar';

// =============================================================================
// TIPOS
// =============================================================================

export interface PericiasYearWrapperProps {
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
  selectedYear: number;
  refetchKey: number;
}

// =============================================================================
// COMPONENTE
// =============================================================================

export function PericiasYearWrapper({
  busca,
  situacaoFilter,
  responsavelFilter,
  laudoFilter,
  tribunalFilter,
  grauFilter,
  especialidadeFilter,
  peritoFilter,
  selectedYear,
  refetchKey,
}: PericiasYearWrapperProps) {
  const selectedDate = React.useMemo(
    () => new Date(selectedYear, 0, 1),
    [selectedYear],
  );

  // ---------- Dialog state (day click detail) ----------
  const [periciasDiaDialog, setPericiasDiaDialog] = React.useState<Pericia[]>(
    [],
  );
  const [isDiaDialogOpen, setIsDiaDialogOpen] = React.useState(false);

  // ---------- Hook params ----------
  const hookParams = React.useMemo(() => {
    const params: Record<string, unknown> = {
      pagina: 1,
      limite: 1000,
      busca: busca || undefined,
      prazoEntregaInicio: format(startOfYear(selectedDate), 'yyyy-MM-dd'),
      prazoEntregaFim: format(endOfYear(selectedDate), 'yyyy-MM-dd'),
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
    selectedDate,
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

  const handleDayClick = React.useCallback(
    (_date: Date, dayPericias: Pericia[]) => {
      if (dayPericias.length > 0) {
        setPericiasDiaDialog(dayPericias);
        setIsDiaDialogOpen(true);
      }
    },
    [],
  );

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
      <PericiasYearHeatmap pericias={pericias} year={selectedYear} onDayClick={handleDayClick} />

      <PericiaDetalhesDialog
        pericia={null}
        pericias={periciasDiaDialog}
        open={isDiaDialogOpen}
        onOpenChange={setIsDiaDialogOpen}
      />
    </>
  );
}
