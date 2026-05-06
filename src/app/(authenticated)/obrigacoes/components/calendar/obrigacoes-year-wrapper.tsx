'use client';

/**
 * ObrigacoesYearWrapper — View anual (Glass Briefing, padrão expedientes/audiências).
 * ============================================================================
 * Heatmap 12 meses com stats sidebar. Clique num dia abre  com parcelas.
 * Toolbar vive no ObrigacoesContent pai.
 * ============================================================================
 */

import * as React from 'react';
import { startOfYear, endOfYear, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

import { TemporalViewLoading, TemporalViewError } from '@/components/shared';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { SemanticBadge } from '@/components/ui/semantic-badge';
import { GlassPanel } from '@/components/shared/glass-panel';
import { useDebounce } from '@/hooks/use-debounce';
import { cn } from '@/lib/utils';

import type { AcordoComParcelas, Parcela } from '../../domain';
import { actionListarObrigacoesPorPeriodo } from '../../actions';

import type { ObrigacoesFilterBarFilters } from '../shared/obrigacoes-filter-bar';
import { ObrigacoesYearHeatmap } from '../shared/obrigacoes-year-heatmap';
import { Text } from '@/components/ui/typography';

interface ObrigacoesYearWrapperProps {
  busca?: string;
  filters?: ObrigacoesFilterBarFilters;
}

interface ParcelaDisplay {
  parcela: Parcela;
  acordo: AcordoComParcelas;
}

const CURRENCY = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
});

export function ObrigacoesYearWrapper({
  busca = '',
  filters,
}: ObrigacoesYearWrapperProps) {
  const [currentDate, setCurrentDate] = React.useState<Date>(new Date());
  const selectedYear = currentDate.getFullYear();

  // Dialog state
  const [dayDialogOpen, setDayDialogOpen] = React.useState(false);
  const [selectedDayParcelas, setSelectedDayParcelas] = React.useState<ParcelaDisplay[]>([]);
  const [selectedDayDate, setSelectedDayDate] = React.useState<Date | null>(null);

  // Data state
  const [acordos, setAcordos] = React.useState<AcordoComParcelas[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const buscaDebounced = useDebounce(busca, 500);

  const fetchData = React.useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const selectedDate = new Date(selectedYear, 0, 1);
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
      setAcordos(result.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setIsLoading(false);
    }
  }, [selectedYear, filters, buscaDebounced]);

  React.useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleDayClick = React.useCallback(
    (items: ParcelaDisplay[], date: Date) => {
      setSelectedDayParcelas(items);
      setSelectedDayDate(date);
      setDayDialogOpen(true);
    },
    [],
  );

  if (isLoading) return <TemporalViewLoading message="Carregando obrigações..." />;
  if (error)
    return (
      <TemporalViewError
        message={`Erro ao carregar obrigações: ${error}`}
        onRetry={fetchData}
      />
    );

  return (
    <>
      <ObrigacoesYearHeatmap
        acordos={acordos}
        currentDate={currentDate}
        onDateChange={setCurrentDate}
        onDayClick={handleDayClick}
      />

      {/* Dialog de parcelas do dia */}
      <Dialog open={dayDialogOpen} onOpenChange={setDayDialogOpen}>
        <DialogContent className=" max-w-lg">
          <DialogHeader>
            <DialogTitle className={cn( "text-body-sm font-medium")}>
              {selectedDayDate
                ? format(selectedDayDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })
                : ''}
            </DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh]">
            <div className={cn(/* design-system-escape: p-1 → usar <Inset> */ "stack-tight p-1")}>
              {selectedDayParcelas.map((item, idx) => (
                <GlassPanel
                  key={idx}
                  depth={1}
                  className={cn(
                    /* design-system-escape: px-4 padding direcional sem Inset equiv.; py-3 padding direcional sem Inset equiv. */ 'px-4 py-3 transition-colors',
                    item.parcela.status === 'atrasada' && 'border-destructive/20',
                  )}
                >
                  <div className={cn("flex items-center justify-between inline-medium")}>
                    <div className="flex-1 min-w-0">
                      <Text variant="caption" className="font-medium truncate">
                        Parcela {item.parcela.numeroParcela} ·{' '}
                        {item.acordo.processo?.numero_processo ||
                          `Acordo #${item.acordo.id}`}
                      </Text>
                      <div className={cn("flex items-center inline-tight mt-1")}>
                        <SemanticBadge
                          category="obrigacao_tipo"
                          value={item.acordo.tipo}
                          className={cn( "text-[9px] font-semibold")}
                        >
                          {item.acordo.tipo}
                        </SemanticBadge>
                        <span className="text-[10px] text-muted-foreground/60 capitalize">
                          {item.parcela.status}
                        </span>
                      </div>
                    </div>
                    <Text variant="caption" className="shrink-0 font-medium tabular-nums">
                      {CURRENCY.format(item.parcela.valorBrutoCreditoPrincipal)}
                    </Text>
                  </div>
                </GlassPanel>
              ))}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </>
  );
}
