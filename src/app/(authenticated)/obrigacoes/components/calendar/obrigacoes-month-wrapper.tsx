'use client';

/**
 * ObrigacoesMonthWrapper
 *
 * View mensal: calendário compacto (coluna esquerda) + lista do dia selecionado.
 * Alinhado ao Glass Briefing: SearchInput + ObrigacoesFilterBar + GlassPanel container.
 */

import * as React from 'react';
import { startOfMonth, endOfMonth, format } from 'date-fns';
import { Plus } from 'lucide-react';

import { GlassPanel } from '@/components/shared/glass-panel';
import { TemporalViewLoading, TemporalViewError } from '@/components/shared';
import { SearchInput } from '@/components/dashboard/search-input';
import { Button } from '@/components/ui/button';
import { useDebounce } from '@/hooks/use-debounce';

import type { AcordoComParcelas } from '../../domain';
import { actionListarObrigacoesPorPeriodo } from '../../actions';

import {
  ObrigacoesFilterBar,
  type ObrigacoesFilterBarFilters,
} from '../shared/obrigacoes-filter-bar';
import { ObrigacoesCalendarCompact } from './obrigacoes-calendar-compact';
import { ObrigacoesDayList } from './obrigacoes-day-list';
import { NovaObrigacaoDialog } from '../dialogs/nova-obrigacao-dialog';

interface ObrigacoesMonthWrapperProps {
  viewModeSlot?: React.ReactNode;
}

export function ObrigacoesMonthWrapper({ viewModeSlot }: ObrigacoesMonthWrapperProps) {
  // Calendar state
  const [selectedDate, setSelectedDate] = React.useState<Date>(new Date());
  const [currentMonth, setCurrentMonth] = React.useState<Date>(new Date());

  // Filter state
  const [busca, setBusca] = React.useState('');
  const [filters, setFilters] = React.useState<ObrigacoesFilterBarFilters>({
    status: 'todos',
    tipo: null,
    direcao: null,
  });

  // Dialog state
  const [isCreateDialogOpen, setIsCreateDialogOpen] = React.useState(false);

  // Data state
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
        status: filters.status !== 'todos' ? filters.status : undefined,
        tipo: filters.tipo ?? undefined,
        direcao: filters.direcao ?? undefined,
        busca: buscaDebounced || undefined,
      });

      if (!result.success) throw new Error(result.error || 'Erro ao listar obrigações');
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

  return (
    <div className="flex flex-col gap-4 h-full min-h-0">
      {/* Toolbar */}
      <div className="flex items-center gap-3 flex-wrap">
        <SearchInput
          value={busca}
          onChange={setBusca}
          placeholder="Buscar obrigações..."
        />
        <ObrigacoesFilterBar filters={filters} onChange={setFilters} />
        <div className="ml-auto flex items-center gap-2">
          {viewModeSlot}
          <Button
            size="sm"
            className="h-8 text-xs font-medium cursor-pointer"
            onClick={() => setIsCreateDialogOpen(true)}
          >
            <Plus className="size-3.5 mr-1" />
            Nova obrigação
          </Button>
        </div>
      </div>

      {/* Calendar + Day List */}
      <div className="flex-1 min-h-0">
        {isLoading ? (
          <TemporalViewLoading message="Carregando obrigações..." />
        ) : error ? (
          <TemporalViewError
            message={`Erro ao carregar obrigações: ${error}`}
            onRetry={fetchData}
          />
        ) : (
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
                  onAddObrigacao={() => setIsCreateDialogOpen(true)}
                />
              </div>
            </div>
          </GlassPanel>
        )}
      </div>

      <NovaObrigacaoDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        onSuccess={fetchData}
      />
    </div>
  );
}
