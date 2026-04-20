'use client';

/**
 * ObrigacoesYearWrapper — Glass Briefing
 *
 * View anual: grid 12 meses. Clique num dia abre glass-dialog com parcelas.
 * Simplificado: toolbar vive em ObrigacoesContent; este wrapper consome
 * `busca` e `filters` via props.
 */

import * as React from 'react';
import { startOfYear, endOfYear, format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

import { GlassPanel } from '@/components/shared/glass-panel';
import {
  YearFilterPopover,
  TemporalViewLoading,
  TemporalViewError,
  YearCalendarGrid,
} from '@/components/shared';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { SemanticBadge } from '@/components/ui/semantic-badge';
import { useDebounce } from '@/hooks/use-debounce';
import { cn } from '@/lib/utils';

import type { AcordoComParcelas, Parcela } from '../../domain';
import { actionListarObrigacoesPorPeriodo } from '../../actions';

import type { ObrigacoesFilterBarFilters } from '../shared/obrigacoes-filter-bar';

interface ObrigacoesYearWrapperProps {
  busca?: string;
  filters?: ObrigacoesFilterBarFilters;
}

const CURRENCY = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
});

export function ObrigacoesYearWrapper({
  busca = '',
  filters,
}: ObrigacoesYearWrapperProps) {
  const [selectedYear, setSelectedYear] = React.useState(
    new Date().getFullYear(),
  );
  const selectedDate = React.useMemo(
    () => new Date(selectedYear, 0, 1),
    [selectedYear],
  );

  const [dayDialogOpen, setDayDialogOpen] = React.useState(false);
  const [selectedDayParcelas, setSelectedDayParcelas] = React.useState<
    { parcela: Parcela; acordo: AcordoComParcelas }[]
  >([]);
  const [selectedDayDate, setSelectedDayDate] = React.useState<Date | null>(
    null,
  );

  const [obrigacoes, setObrigacoes] = React.useState<AcordoComParcelas[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const buscaDebounced = useDebounce(busca, 500);

  const fetchData = React.useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await actionListarObrigacoesPorPeriodo({
        dataInicio: format(startOfYear(selectedDate), 'yyyy-MM-dd'),
        dataFim: format(endOfYear(selectedDate), 'yyyy-MM-dd'),
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
  }, [selectedDate, filters, buscaDebounced]);

  React.useEffect(() => {
    fetchData();
  }, [fetchData]);

  const parcelasPorDia = React.useMemo(() => {
    const mapa = new Map<
      string,
      { parcela: Parcela; acordo: AcordoComParcelas }[]
    >();
    obrigacoes.forEach((acordo) => {
      acordo.parcelas?.forEach((parcela) => {
        if (!parcela.dataVencimento) return;
        const d = parseISO(parcela.dataVencimento);
        if (d.getFullYear() !== selectedYear) return;
        const key = `${d.getMonth()}-${d.getDate()}`;
        const existing = mapa.get(key) || [];
        existing.push({ parcela, acordo });
        mapa.set(key, existing);
      });
    });
    return mapa;
  }, [obrigacoes, selectedYear]);

  const hasDayContent = React.useCallback(
    (mes: number, dia: number) => parcelasPorDia.has(`${mes}-${dia}`),
    [parcelasPorDia],
  );

  const handleDiaClick = React.useCallback(
    (mes: number, dia: number) => {
      const key = `${mes}-${dia}`;
      const items = parcelasPorDia.get(key);
      if (items && items.length > 0) {
        setSelectedDayParcelas(items);
        setSelectedDayDate(new Date(selectedYear, mes, dia));
        setDayDialogOpen(true);
      }
    },
    [parcelasPorDia, selectedYear],
  );

  return (
    <div className="flex flex-col gap-3 h-full min-h-0">
      <div className="flex items-center gap-2">
        <YearFilterPopover
          selectedYear={selectedYear}
          onYearChange={setSelectedYear}
        />
      </div>

      <div className="flex-1 min-h-0">
        {isLoading ? (
          <TemporalViewLoading message="Carregando obrigações..." />
        ) : error ? (
          <TemporalViewError
            message={`Erro ao carregar obrigações: ${error}`}
            onRetry={fetchData}
          />
        ) : (
          <GlassPanel depth={1} className="h-full overflow-auto">
            <YearCalendarGrid
              year={selectedYear}
              hasDayContent={hasDayContent}
              onDayClick={handleDiaClick}
              className="p-6"
            />
          </GlassPanel>
        )}
      </div>

      <Dialog open={dayDialogOpen} onOpenChange={setDayDialogOpen}>
        <DialogContent className="glass-dialog max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-sm font-medium">
              {selectedDayDate
                ? format(selectedDayDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })
                : ''}
            </DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh]">
            <div className="space-y-2 p-1">
              {selectedDayParcelas.map((item, idx) => (
                <GlassPanel
                  key={idx}
                  depth={1}
                  className={cn(
                    'px-4 py-3 transition-colors',
                    item.parcela.status === 'atrasada' && 'border-destructive/20',
                  )}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate">
                        Parcela {item.parcela.numeroParcela} ·{' '}
                        {item.acordo.processo?.numero_processo ||
                          `Acordo #${item.acordo.id}`}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <SemanticBadge
                          category="obrigacao_tipo"
                          value={item.acordo.tipo}
                          className="text-[9px] font-semibold"
                        >
                          {item.acordo.tipo}
                        </SemanticBadge>
                        <span className="text-[10px] text-muted-foreground/60 capitalize">
                          {item.parcela.status}
                        </span>
                      </div>
                    </div>
                    <div className="shrink-0 text-xs font-medium tabular-nums">
                      {CURRENCY.format(item.parcela.valorBrutoCreditoPrincipal)}
                    </div>
                  </div>
                </GlassPanel>
              ))}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
}
