'use client';

/**
 * ObrigacoesMonthWrapper — View de mês (Glass Briefing, padrão expedientes/audiências).
 * ============================================================================
 * Busca acordos do mês e renderiza grid mensal via ObrigacoesGlassMonth.
 * Toolbar vive no ObrigacoesContent pai.
 * ============================================================================
 */

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { startOfMonth, endOfMonth, format } from 'date-fns';

import { TemporalViewLoading, TemporalViewError } from '@/components/shared';
import { useDebounce } from '@/hooks/use-debounce';

import type { AcordoComParcelas, ObrigacaoComDetalhes, StatusObrigacao } from '../../domain';
import { actionListarObrigacoesPorPeriodo } from '../../actions';

import type { ObrigacoesFilterBarFilters } from '../shared/obrigacoes-filter-bar';
import { ObrigacoesGlassMonth } from '../shared/obrigacoes-glass-month';
import { ObrigacaoDetalhesDialog } from '../dialogs/obrigacao-detalhes-dialog';

interface ObrigacoesMonthWrapperProps {
  busca?: string;
  filters?: ObrigacoesFilterBarFilters;
}

export function ObrigacoesMonthWrapper({
  busca = '',
  filters,
}: ObrigacoesMonthWrapperProps) {
  const router = useRouter();

  const [acordos, setAcordos] = React.useState<AcordoComParcelas[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // Detail dialog
  const [detalhesItem, setDetalhesItem] = React.useState<ObrigacaoComDetalhes | null>(null);
  const [isDetalhesOpen, setIsDetalhesOpen] = React.useState(false);

  // Month range (um mês de folga pra cobrir startOfWeek/endOfWeek)
  const [monthRange] = React.useState(() => {
    const now = new Date();
    return {
      start: startOfMonth(now),
      end: endOfMonth(now),
    };
  });

  const buscaDebounced = useDebounce(busca, 500);

  const fetchData = React.useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await actionListarObrigacoesPorPeriodo({
        dataInicio: format(monthRange.start, 'yyyy-MM-dd'),
        dataFim: format(monthRange.end, 'yyyy-MM-dd'),
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
  }, [monthRange, filters, buscaDebounced]);

  React.useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleViewDetail = React.useCallback(
    (acordo: AcordoComParcelas) => {
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
        direcao: acordo.direcao,
        processo: acordo.processo ?? null,
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
      <ObrigacoesGlassMonth
        acordos={acordos}
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
