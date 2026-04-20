'use client';

/**
 * ObrigacoesMonthWrapper — Glass Briefing
 *
 * View mensal: calendário compacto + lista do dia selecionado.
 * Simplificado: toolbar vive em ObrigacoesContent; este wrapper consome
 * `busca` e `filters` via props.
 */

import * as React from 'react';
import { startOfMonth, endOfMonth, format } from 'date-fns';

import { GlassPanel } from '@/components/shared/glass-panel';
import { TemporalViewLoading, TemporalViewError } from '@/components/shared';
import { useDebounce } from '@/hooks/use-debounce';

import type { AcordoComParcelas } from '../../domain';
import { actionListarObrigacoesPorPeriodo } from '../../actions';

import type { ObrigacoesFilterBarFilters } from '../shared/obrigacoes-filter-bar';
import { ObrigacoesCalendarCompact } from './obrigacoes-calendar-compact';
import { ObrigacoesDayList } from './obrigacoes-day-list';

interface ObrigacoesMonthWrapperProps {
  busca?: string;
  filters?: ObrigacoesFilterBarFilters;
}

export function ObrigacoesMonthWrapper({
  busca = '',
  filters,
}: ObrigacoesMonthWrapperProps) {
  const [selectedDate, setSelectedDate] = React.useState<Date>(new Date());
  const [currentMonth, setCurrentMonth] = React.useState<Date>(new Date());

  const [obrigacoes, setObrigacoes] = React.useState<AcordoComParcelas[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const buscaDebounced = useDebounce(busca, 500);

  const fetchData = React.useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await actionListarObrigacoesPorPeriodo({
        dataInicio: format(startOfMonth(currentMonth), 'yyyy-MM-dd'),
        dataFim: format(endOfMonth(currentMonth), 'yyyy-MM-dd'),
        incluirSemData: false,
        status:
          filters && filters.status !== 'todos' ? filters.status : undefined,
        tipo: filters?.tipo ?? undefined,
        direcao: filters?.direcao ?? undefined,
        busca: buscaDebounced || undefined,
      });

      if (!result.success)
        throw new Error(result.error || 'Erro ao listar obrigações');
      setObrigacoes(result.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setIsLoading(false);
    }
  }, [currentMonth, filters, buscaDebounced]);

  React.useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (isLoading) return <TemporalViewLoading message="Carregando obrigações..." />;
  if (error)
    return (
      <TemporalViewError
        message={`Erro ao carregar obrigações: ${error}`}
        onRetry={fetchData}
      />
    );

  return (
    <GlassPanel depth={1} className="h-full overflow-hidden p-0">
      <div className="flex h-full">
        <div className="w-120 shrink-0 border-r border-border/10 p-6 overflow-auto">
          <ObrigacoesCalendarCompact
            selectedDate={selectedDate}
            onDateSelect={setSelectedDate}
            obrigacoes={obrigacoes}
            currentMonth={currentMonth}
            onMonthChange={setCurrentMonth}
          />
        </div>
        <div className="flex-1 min-w-0">
          <ObrigacoesDayList
            selectedDate={selectedDate}
            obrigacoes={obrigacoes}
          />
        </div>
      </div>
    </GlassPanel>
  );
}
