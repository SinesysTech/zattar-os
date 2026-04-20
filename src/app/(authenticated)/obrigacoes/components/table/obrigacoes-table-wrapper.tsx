'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { Plus } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { SearchInput } from '@/components/dashboard/search-input';
import { TablePagination } from '@/components/shared/table-pagination';
import { WeekNavigator, type WeekNavigatorProps } from '@/components/shared';
import { useDebounce } from '@/hooks/use-debounce';

import type { PaginatedResponse } from '@/types';
import type {
  AcordoComParcelas,
  ListarAcordosParams,
  ObrigacaoComDetalhes,
  StatusObrigacao,
  TipoObrigacao,
  DirecaoPagamento,
} from '../../domain';
import { actionListarAcordos } from '../../actions';

import {
  ObrigacoesFilterBar,
  type ObrigacoesFilterBarFilters,
} from '../shared/obrigacoes-filter-bar';
import { ObrigacoesGlassList } from '../shared/obrigacoes-glass-list';
import { ObrigacaoDetalhesDialog } from '../dialogs/obrigacao-detalhes-dialog';
import { NovaObrigacaoDialog } from '../dialogs/nova-obrigacao-dialog';

interface ObrigacoesTableWrapperProps {
  initialData?: PaginatedResponse<AcordoComParcelas>;
  fixedDate?: Date;
  hideDateFilters?: boolean;
  weekNavigatorProps?: Omit<WeekNavigatorProps, 'className'>;
  viewModeSlot?: React.ReactNode;
}

export function ObrigacoesTableWrapper({
  initialData,
  fixedDate,
  weekNavigatorProps,
  viewModeSlot,
}: ObrigacoesTableWrapperProps) {
  const router = useRouter();

  // Paginação
  const [pageIndex, setPageIndex] = React.useState(0);
  const [pageSize, setPageSize] = React.useState(
    initialData?.pagination?.limit || 10,
  );
  const [total, setTotal] = React.useState(initialData?.pagination?.total || 0);
  const [totalPages, setTotalPages] = React.useState(
    initialData?.pagination?.totalPages || 0,
  );

  // Loading / Data
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [acordos, setAcordos] = React.useState<AcordoComParcelas[]>(
    initialData?.data || [],
  );

  // Filtros
  const [busca, setBusca] = React.useState('');
  const [filters, setFilters] = React.useState<ObrigacoesFilterBarFilters>({
    status: 'todos',
    tipo: null,
    direcao: null,
  });

  // Dialogs
  const [isNovoDialogOpen, setIsNovoDialogOpen] = React.useState(false);
  const [detalhesItem, setDetalhesItem] =
    React.useState<ObrigacaoComDetalhes | null>(null);
  const [isDetalhesOpen, setIsDetalhesOpen] = React.useState(false);

  const buscaDebounced = useDebounce(busca, 500);

  const refetch = React.useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const params: ListarAcordosParams = {
        pagina: pageIndex + 1,
        limite: pageSize,
        busca: buscaDebounced || undefined,
      };

      if (filters.status !== 'todos') params.status = filters.status;
      if (filters.tipo) params.tipo = filters.tipo as TipoObrigacao;
      if (filters.direcao)
        params.direcao = filters.direcao as DirecaoPagamento;

      if (fixedDate) {
        const dateStr = format(fixedDate, 'yyyy-MM-dd');
        params.dataInicio = dateStr;
        params.dataFim = dateStr;
      }

      const result = await actionListarAcordos(params);
      if (!result.success) {
        throw new Error(result.error || 'Erro ao listar obrigações');
      }

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

  const isFirstRender = React.useRef(true);

  React.useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      if (initialData) return;
    }
    refetch();
  }, [refetch, initialData]);

  const handleSucessoOperacao = React.useCallback(() => {
    refetch();
    router.refresh();
  }, [refetch, router]);

  const handleVerDetalhes = (acordo: AcordoComParcelas) => {
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
  };

  const handleFiltersChange = React.useCallback(
    (next: ObrigacoesFilterBarFilters) => {
      setFilters(next);
      setPageIndex(0);
    },
    [],
  );

  return (
    <div className="flex flex-col gap-4 h-full min-h-0">
      {/* Toolbar: busca + filtros + view switcher + ação */}
      <div className="flex items-center gap-3 flex-wrap">
        <SearchInput
          value={busca}
          onChange={(value) => {
            setBusca(value);
            setPageIndex(0);
          }}
          placeholder="Buscar obrigações..."
        />

        <ObrigacoesFilterBar
          filters={filters}
          onChange={handleFiltersChange}
        />

        <div className="ml-auto flex items-center gap-2">
          {viewModeSlot}
          <Button
            size="sm"
            className="h-8 text-xs font-medium cursor-pointer"
            onClick={() => setIsNovoDialogOpen(true)}
          >
            <Plus className="size-3.5 mr-1" />
            Nova obrigação
          </Button>
        </div>
      </div>

      {/* Week navigator (se aplicável) */}
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

      {/* Error banner */}
      {error && (
        <div className="rounded-lg border border-destructive/20 bg-destructive/5 px-4 py-3 text-xs text-destructive">
          {error}
        </div>
      )}

      {/* Lista */}
      <div className="flex-1 min-h-0 overflow-auto">
        <ObrigacoesGlassList
          acordos={acordos}
          isLoading={isLoading}
          onViewDetail={handleVerDetalhes}
        />
      </div>

      {/* Paginação */}
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

      {/* Dialogs */}
      <ObrigacaoDetalhesDialog
        obrigacao={detalhesItem}
        open={isDetalhesOpen}
        onOpenChange={setIsDetalhesOpen}
      />

      <NovaObrigacaoDialog
        open={isNovoDialogOpen}
        onOpenChange={setIsNovoDialogOpen}
        onSuccess={handleSucessoOperacao}
      />
    </div>
  );
}
