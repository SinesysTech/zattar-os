'use client';

/**
 * ObrigacoesSemanaWrapper — View de semana (thin)
 * ============================================================================
 * Busca acordos da semana (com parcelas) e renderiza ObrigacoesSemanaView.
 * Toolbar vive no ObrigacoesContent pai.
 * ============================================================================
 */

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { startOfWeek, endOfWeek, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

import {
  TemporalViewLoading,
  TemporalViewError,
} from '@/components/shared';
import { useDebounce } from '@/hooks/use-debounce';

import type { AcordoComParcelas, ObrigacaoComDetalhes, StatusObrigacao } from '../../domain';
import { actionListarObrigacoesPorPeriodo } from '../../actions';

import { ObrigacoesSemanaView } from './obrigacoes-semana-view';
import type { ObrigacoesFilterBarFilters } from './obrigacoes-filter-bar';
import { ObrigacaoDetalhesDialog } from '../dialogs/obrigacao-detalhes-dialog';

// =============================================================================
// TYPES
// =============================================================================

export interface ObrigacoesSemanaWrapperProps {
  busca: string;
  filters?: ObrigacoesFilterBarFilters;
  refreshCounter?: number;
  weekDate: Date;
  onWeekDateChange: (date: Date) => void;
}

// =============================================================================
// COMPONENT
// =============================================================================

export function ObrigacoesSemanaWrapper({
  busca,
  filters,
  refreshCounter = 0,
  weekDate,
  onWeekDateChange,
}: ObrigacoesSemanaWrapperProps) {
  const router = useRouter();

  const [acordos, setAcordos] = React.useState<AcordoComParcelas[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // Dialog state
  const [detalhesItem, setDetalhesItem] = React.useState<ObrigacaoComDetalhes | null>(null);
  const [isDetalhesOpen, setIsDetalhesOpen] = React.useState(false);

  const buscaDebounced = useDebounce(busca, 500);

  const fetchData = React.useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const start = startOfWeek(weekDate, { locale: ptBR, weekStartsOn: 1 });
      const end = endOfWeek(weekDate, { locale: ptBR, weekStartsOn: 1 });

      const result = await actionListarObrigacoesPorPeriodo({
        dataInicio: format(start, 'yyyy-MM-dd'),
        dataFim: format(end, 'yyyy-MM-dd'),
        incluirSemData: false,
        status: filters && filters.status !== 'todos' ? filters.status : undefined,
        tipo: filters?.tipo ?? undefined,
        direcao: filters?.direcao ?? undefined,
        busca: buscaDebounced || undefined,
      });

      if (!result.success) throw new Error(result.error || 'Erro ao listar obrigações');
      setAcordos(result.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setIsLoading(false);
    }
  }, [weekDate, filters, buscaDebounced]);

  React.useEffect(() => {
    fetchData();
  }, [fetchData, refreshCounter]);

  const handleViewDetail = React.useCallback(
    (acordo: AcordoComParcelas) => {
      // Mesma lógica do table-wrapper: navega e abre dialog
      router.push(`/obrigacoes/${acordo.id}`);
      const detalhes: ObrigacaoComDetalhes = {
        id: acordo.id,
        tipo: acordo.tipo,
        descricao: `Processo ${acordo.processo?.numero_processo || 'N/A'}`,
        valor: acordo.valorTotal,
        dataVencimento: acordo.dataVencimentoPrimeiraParcela,
        status: acordo.status as StatusObrigacao,
        statusSincronizacao: 'nao_aplicavel',
        diasAteVencimento: null,
        tipoEntidade: 'obrigacao',
        acordoId: acordo.id,
        processoId: acordo.processoId,
      };
      setDetalhesItem(detalhes);
      setIsDetalhesOpen(true);
    },
    [router],
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
      <ObrigacoesSemanaView
        acordos={acordos}
        currentDate={weekDate}
        onDateChange={onWeekDateChange}
        onViewDetail={handleViewDetail}
      />

      <ObrigacaoDetalhesDialog
        obrigacao={detalhesItem}
        open={isDetalhesOpen}
        onOpenChange={setIsDetalhesOpen}
      />
    </>
  );
}
