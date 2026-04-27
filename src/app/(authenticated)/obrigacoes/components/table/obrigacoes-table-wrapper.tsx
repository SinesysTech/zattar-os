'use client';

/**
 * ObrigacoesTableWrapper — Lista em Glass rows com paginação server-side
 *
 * Simplificado: toolbar (busca + filtros + botão Nova + view toggle) vive em
 * ObrigacoesContent. Este wrapper só consome `busca` e `filters` via props.
 */

import { cn } from '@/lib/utils';
import * as React from 'react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';

import { TablePagination } from '@/components/shared/table-pagination';
import { WeekNavigator, type WeekNavigatorProps } from '@/components/shared';
import { useDebounce } from '@/hooks/use-debounce';

import type {
  AcordoComParcelas,
  ListarAcordosParams,
  ObrigacaoComDetalhes,
  StatusObrigacao,
} from '../../domain';
import { actionListarAcordos } from '../../actions';

import { ObrigacoesGlassList } from '../shared/obrigacoes-glass-list';
import type { ObrigacoesFilterBarFilters } from '../shared/obrigacoes-filter-bar';
import { ObrigacaoDetalhesDialog } from '../dialogs/obrigacao-detalhes-dialog';

interface ObrigacoesTableWrapperProps {
  busca?: string;
  filters?: ObrigacoesFilterBarFilters;
  refreshCounter?: number;
  fixedDate?: Date;
  weekNavigatorProps?: Omit<WeekNavigatorProps, 'className'>;
}

export function ObrigacoesTableWrapper({
  busca = '',
  filters,
  refreshCounter = 0,
  fixedDate,
  weekNavigatorProps,
}: ObrigacoesTableWrapperProps) {
  const router = useRouter();

  // Paginação
  const [pageIndex, setPageIndex] = React.useState(0);
  const [pageSize, setPageSize] = React.useState(50);
  const [total, setTotal] = React.useState(0);
  const [totalPages, setTotalPages] = React.useState(0);

  // Data
  const [isLoading, setIsLoading] = React.useState(false);
  const [, setError] = React.useState<string | null>(null);
  const [acordos, setAcordos] = React.useState<AcordoComParcelas[]>([]);

  // Dialog detalhes
  const [detalhesItem, setDetalhesItem] =
    React.useState<ObrigacaoComDetalhes | null>(null);
  const [isDetalhesOpen, setIsDetalhesOpen] = React.useState(false);

  const buscaDebounced = useDebounce(busca, 500);

  // Reset pageIndex quando filtros/busca mudam
  React.useEffect(() => {
    setPageIndex(0);
  }, [buscaDebounced, filters, fixedDate]);

  const refetch = React.useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const params: ListarAcordosParams = {
        pagina: pageIndex + 1,
        limite: pageSize,
        busca: buscaDebounced || undefined,
      };

      if (filters && filters.status !== 'todos') params.status = filters.status;
      if (filters?.tipo) params.tipo = filters.tipo;
      if (filters?.direcao) params.direcao = filters.direcao;

      if (fixedDate) {
        const dateStr = format(fixedDate, 'yyyy-MM-dd');
        params.dataInicio = dateStr;
        params.dataFim = dateStr;
      }

      const result = await actionListarAcordos(params);
      if (!result.success)
        throw new Error(result.error || 'Erro ao listar obrigações');

      const responseData = result.data as {
        acordos: AcordoComParcelas[];
        total: number;
        totalPaginas: number;
      };
      setAcordos(responseData.acordos);
      setTotal(responseData.total);
      setTotalPages(responseData.totalPaginas);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [pageIndex, pageSize, buscaDebounced, filters, fixedDate]);

  React.useEffect(() => {
    refetch();
  }, [refetch, refreshCounter]);

  const handleVerDetalhes = React.useCallback(
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

  return (
    <div className={cn(/* design-system-escape: space-y-3 sem token DS */ "space-y-3")}>
      {weekNavigatorProps && (
        <WeekNavigator
          weekDays={weekNavigatorProps.weekDays}
          selectedDate={weekNavigatorProps.selectedDate}
          onDateSelect={weekNavigatorProps.onDateSelect}
          onPreviousWeek={weekNavigatorProps.onPreviousWeek}
          onNextWeek={weekNavigatorProps.onNextWeek}
          onToday={weekNavigatorProps.onToday}
          isCurrentWeek={weekNavigatorProps.isCurrentWeek}
        />
      )}

      <ObrigacoesGlassList
        acordos={acordos}
        isLoading={isLoading}
        onViewDetail={handleVerDetalhes}
      />

      {totalPages > 0 && (
        <TablePagination
          pageIndex={pageIndex}
          pageSize={pageSize}
          total={total}
          totalPages={totalPages}
          onPageChange={setPageIndex}
          onPageSizeChange={(size) => {
            setPageSize(size);
            setPageIndex(0);
          }}
          isLoading={isLoading}
        />
      )}

      <ObrigacaoDetalhesDialog
        obrigacao={detalhesItem}
        open={isDetalhesOpen}
        onOpenChange={setIsDetalhesOpen}
      />
    </div>
  );
}
