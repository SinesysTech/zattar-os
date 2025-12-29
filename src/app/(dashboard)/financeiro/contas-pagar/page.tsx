'use client';

/**
 * Página de Contas a Pagar
 * Lista e gerencia contas a pagar do escritório
 */

import * as React from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useDebounce } from '@/hooks/use-debounce';
import { DataPagination, DataShell, DataTable } from '@/components/shared/data-shell';
import { DataTableColumnHeader } from '@/components/shared/data-shell/data-table-column-header';
import { TableToolbar } from '@/components/ui/table-toolbar';
import {
  AlertasVencimento,
  buildContasPagarFilterGroups,
  buildContasPagarFilterOptions,
  cancelarConta,
  excluirConta,
  ExportButton,
  FiltroCentroCusto,
  FiltroCliente,
  FiltroContaContabil,
  type Lancamento,
  type StatusLancamento,
  PagarContaDialog,
  parseContasPagarFilters,
  useContasBancarias,
  useContasPagar,
} from '@/features/financeiro';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  MoreHorizontal,
  CreditCard,
  Pencil,
  XCircle,
  Eye,
  Repeat,
  Trash2,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { ColumnDef } from '@tanstack/react-table';

// ============================================================================
// Constantes e Helpers
// ============================================================================

type BadgeVariant = 'default' | 'secondary' | 'outline' | 'info' | 'success' | 'warning' | 'destructive' | 'neutral' | 'accent';

const STATUS_CONFIG: Record<StatusLancamento, { label: string; variant: BadgeVariant }> = {
  pendente: { label: 'Pendente', variant: 'warning' },
  confirmado: { label: 'Pago', variant: 'success' },
  cancelado: { label: 'Cancelado', variant: 'outline' },
  estornado: { label: 'Estornado', variant: 'destructive' },
};

const formatarValor = (valor: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(valor);
};

const formatarData = (data: string | null | undefined): string => {
  if (!data) return '-';
  return format(new Date(data), 'dd/MM/yyyy', { locale: ptBR });
};

const isVencida = (conta: Lancamento): boolean => {
  if (conta.status !== 'pendente' || !conta.dataVencimento) return false;
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  return new Date(conta.dataVencimento) < hoje;
};

// ============================================================================
// Componente de Ações
// ============================================================================

function ContasPagarActions({
  conta,
  onPagar,
  onEditar,
  onCancelar,
  onExcluir,
  onVerDetalhes,
}: {
  conta: Lancamento;
  onPagar: (conta: Lancamento) => void;
  onEditar: (conta: Lancamento) => void;
  onCancelar: (conta: Lancamento) => void;
  onExcluir: (conta: Lancamento) => void;
  onVerDetalhes: (conta: Lancamento) => void;
}) {
  const isPendente = conta.status === 'pendente';

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <MoreHorizontal className="h-4 w-4" />
          <span className="sr-only">Ações da conta</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => onVerDetalhes(conta)}>
          <Eye className="mr-2 h-4 w-4" />
          Ver Detalhes
        </DropdownMenuItem>
        {isPendente && (
          <>
            <DropdownMenuItem onClick={() => onPagar(conta)}>
              <CreditCard className="mr-2 h-4 w-4" />
              Pagar
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onEditar(conta)}>
              <Pencil className="mr-2 h-4 w-4" />
              Editar
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => onCancelar(conta)} className="text-amber-600">
              <XCircle className="mr-2 h-4 w-4" />
              Cancelar
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onExcluir(conta)} className="text-destructive">
              <Trash2 className="mr-2 h-4 w-4" />
              Excluir
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// ============================================================================
// Definição das Colunas
// ============================================================================

function criarColunas(
  onPagar: (conta: Lancamento) => void,
  onEditar: (conta: Lancamento) => void,
  onCancelar: (conta: Lancamento) => void,
  onExcluir: (conta: Lancamento) => void,
  onVerDetalhes: (conta: Lancamento) => void
): ColumnDef<Lancamento>[] {
  return [
    {
      accessorKey: 'descricao',
      header: ({ column }) => (
        <div className="flex items-center justify-start">
          <DataTableColumnHeader column={column} title="Descrição" />
        </div>
      ),
      enableSorting: true,
      size: 280,
      meta: { align: 'left' },
      cell: ({ row }) => {
        const conta = row.original;
        return (
          <div className="min-h-10 flex flex-col justify-center">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">{conta.descricao}</span>
              {conta.recorrencia && (
                <Repeat className="h-3 w-3 text-muted-foreground" aria-label="Recorrente" />
              )}
            </div>
            {conta.entidade && (
              <span className="text-xs text-muted-foreground">
                {conta.entidade.nome}
              </span>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: 'categoria',
      header: ({ column }) => (
        <div className="flex items-center justify-center">
          <DataTableColumnHeader column={column} title="Categoria" />
        </div>
      ),
      enableSorting: true,
      size: 120,
      cell: ({ row }) => {
        const categoria = row.original.categoria;
        return (
          <div className="min-h-10 flex items-center justify-center">
            {categoria ? (
              <Badge variant="outline" className="capitalize">
                {categoria}
              </Badge>
            ) : (
              <span className="text-muted-foreground">-</span>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: 'valor',
      header: ({ column }) => (
        <div className="flex items-center justify-end">
          <DataTableColumnHeader column={column} title="Valor" />
        </div>
      ),
      enableSorting: true,
      size: 120,
      cell: ({ row }) => {
        const valor = row.getValue('valor') as number;
        return (
          <div className="min-h-10 flex items-center justify-end font-mono text-sm font-medium">
            {formatarValor(valor)}
          </div>
        );
      },
    },
    {
      accessorKey: 'dataVencimento',
      header: ({ column }) => (
        <div className="flex items-center justify-center">
          <DataTableColumnHeader column={column} title="Vencimento" />
        </div>
      ),
      enableSorting: true,
      size: 120,
      cell: ({ row }) => {
        const conta = row.original;
        const vencida = isVencida(conta);
        return (
          <div
            className={cn(
              'min-h-10 flex items-center justify-center text-sm',
              vencida && 'text-destructive font-medium'
            )}
          >
            {formatarData(conta.dataVencimento)}
            {vencida && (
              <Badge variant="destructive" className="ml-2">
                Vencida
              </Badge>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: 'status',
      header: ({ column }) => (
        <div className="flex items-center justify-center">
          <DataTableColumnHeader column={column} title="Status" />
        </div>
      ),
      enableSorting: true,
      size: 100,
      cell: ({ row }) => {
        const status = row.getValue('status') as StatusLancamento;
        const config = STATUS_CONFIG[status];
        return (
          <div className="min-h-10 flex items-center justify-center">
            <Badge variant={config.variant}>
              {config.label}
            </Badge>
          </div>
        );
      },
    },
    {
      id: 'acoes',
      header: () => (
        <div className="flex items-center justify-center">
          <div className="text-sm font-medium">Ações</div>
        </div>
      ),
      enableSorting: false,
      size: 80,
      cell: ({ row }) => {
        const conta = row.original;
        return (
          <div className="min-h-10 flex items-center justify-center">
            <ContasPagarActions
              conta={conta}
              onPagar={onPagar}
              onEditar={onEditar}
              onCancelar={onCancelar}
              onExcluir={onExcluir}
              onVerDetalhes={onVerDetalhes}
            />
          </div>
        );
      },
    },
  ];
}

// ============================================================================
// Página Principal
// ============================================================================

export default function ContasPagarPage() {
  // Estados de filtros e busca
  const [globalFilter, setGlobalFilter] = React.useState('');
  const [pageIndex, setPageIndex] = React.useState(0);
  const [pageSize, setPageSize] = React.useState(50);

  // Estados de filtros individuais
  const [formaPagamento, setFormaPagamento] = React.useState<string>('');
  const [contaContabilId, setContaContabilId] = React.useState<string>('');
  const [centroCustoId, setCentroCustoId] = React.useState<string>('');
  const [fornecedorId, setFornecedorId] = React.useState<string>('');

  const [selectedFilterIds, setSelectedFilterIds] = React.useState<string[]>(['status_pendente']);

  // Estados de dialogs
  const [pagarDialogOpen, setPagarDialogOpen] = React.useState(false);
  const [selectedConta, setSelectedConta] = React.useState<Lancamento | null>(null);
  const [cancelarDialogOpen, setCancelarDialogOpen] = React.useState(false);
  const [excluirDialogOpen, setExcluirDialogOpen] = React.useState(false);

  // Debounce da busca
  const globalFilterDebounced = useDebounce(globalFilter, 500);

  const filterOptions = React.useMemo(() => buildContasPagarFilterOptions(), []);
  const filterGroups = React.useMemo(() => buildContasPagarFilterGroups(), []);

  // Parâmetros de busca
  const params = React.useMemo(() => {
    const parsedFilters = parseContasPagarFilters(selectedFilterIds);
    return {
      pagina: pageIndex + 1,
      limite: pageSize,
      busca: globalFilterDebounced || undefined,
      ...parsedFilters,
      formaPagamento: formaPagamento || undefined,
      contaContabilId: contaContabilId ? Number(contaContabilId) : undefined,
      centroCustoId: centroCustoId ? Number(centroCustoId) : undefined,
      fornecedorId: fornecedorId ? Number(fornecedorId) : undefined,
      incluirResumo: true,
    };
  }, [pageIndex, pageSize, globalFilterDebounced, selectedFilterIds, formaPagamento, contaContabilId, centroCustoId, fornecedorId]);

  // Hook de dados
  const { contasPagar, paginacao, resumoVencimentos, isLoading, error, refetch } = useContasPagar(params);

  // Contas bancárias para os selects
  const { contasBancarias } = useContasBancarias();

  const handlePagar = React.useCallback((conta: Lancamento) => {
    setSelectedConta(conta);
    setPagarDialogOpen(true);
  }, []);

  const handleEditar = React.useCallback(() => {
    // TODO: Implementar dialog de edição
    toast.info('Funcionalidade de edição em desenvolvimento');
  }, []);

  const handleCancelar = React.useCallback((conta: Lancamento) => {
    setSelectedConta(conta);
    setCancelarDialogOpen(true);
  }, []);

  const handleExcluir = React.useCallback((conta: Lancamento) => {
    setSelectedConta(conta);
    setExcluirDialogOpen(true);
  }, []);

  const handleVerDetalhes = React.useCallback(() => {
    // TODO: Implementar navegação para página de detalhes
    toast.info('Funcionalidade de detalhes em desenvolvimento');
  }, []);

  const handleConfirmCancelar = React.useCallback(async () => {
    if (!selectedConta) return;

    try {
      await cancelarConta(selectedConta.id);
      toast.success('Conta cancelada com sucesso');
      setCancelarDialogOpen(false);
      refetch();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao cancelar conta';
      toast.error(message);
    }
  }, [selectedConta, refetch]);

  const handleConfirmExcluir = React.useCallback(async () => {
    if (!selectedConta) return;

    try {
      await excluirConta(selectedConta.id);
      toast.success('Conta excluída com sucesso');
      setExcluirDialogOpen(false);
      refetch();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao excluir conta';
      toast.error(message);
    }
  }, [selectedConta, refetch]);

  // Handlers para alertas
  const handleFiltrarVencidas = React.useCallback(() => {
    setSelectedFilterIds(['status_pendente', 'vencimento_vencidas']);
    setPageIndex(0);
  }, []);

  const handleFiltrarHoje = React.useCallback(() => {
    setSelectedFilterIds(['status_pendente', 'vencimento_hoje']);
    setPageIndex(0);
  }, []);

  const handleFiltrar7Dias = React.useCallback(() => {
    setSelectedFilterIds(['status_pendente', 'vencimento_7dias']);
    setPageIndex(0);
  }, []);

  const handleFiltrar30Dias = React.useCallback(() => {
    setSelectedFilterIds(['status_pendente', 'vencimento_30dias']);
    setPageIndex(0);
  }, []);

  // Definir colunas
  const colunas = React.useMemo(
    () =>
      criarColunas(handlePagar, handleEditar, handleCancelar, handleExcluir, handleVerDetalhes),
    [handlePagar, handleEditar, handleCancelar, handleExcluir, handleVerDetalhes]
  );

  const isSearching = globalFilter !== globalFilterDebounced && globalFilter.length > 0;

  return (
    <div className="space-y-3">
      {/* Alertas de Vencimento */}
      <AlertasVencimento
        resumo={resumoVencimentos}
        isLoading={isLoading}
        onFiltrarVencidas={handleFiltrarVencidas}
        onFiltrarHoje={handleFiltrarHoje}
        onFiltrar7Dias={handleFiltrar7Dias}
        onFiltrar30Dias={handleFiltrar30Dias}
      />

      <div className="flex justify-end">
        <ExportButton
          endpoint="/api/financeiro/contas-pagar/exportar"
          filtros={{
            status: params.status ? params.status.toString() : '',
            dataInicio: params.dataVencimentoInicio || '',
            dataFim: params.dataVencimentoFim || '',
          }}
          opcoes={[
            { label: 'Exportar PDF', formato: 'pdf' },
            { label: 'Exportar CSV', formato: 'csv' },
          ]}
        />
      </div>

      <DataShell
        header={
          <TableToolbar
            variant="integrated"
            searchValue={globalFilter}
            onSearchChange={(value) => {
              setGlobalFilter(value);
              setPageIndex(0);
            }}
            isSearching={isSearching}
            searchPlaceholder="Buscar por descrição, documento ou categoria..."
            filterOptions={filterOptions}
            filterGroups={filterGroups}
            selectedFilters={selectedFilterIds}
            onFiltersChange={(filters) => {
              setSelectedFilterIds(filters);
              setPageIndex(0);
            }}
            filterButtonsMode="buttons"
            onNewClick={() => toast.info('Funcionalidade de criação em desenvolvimento')}
            newButtonTooltip="Nova Conta a Pagar"
            extraButtons={
              <>
                <Select
                  value={formaPagamento}
                  onValueChange={(value) => {
                    setFormaPagamento(value === '__all__' ? '' : value);
                    setPageIndex(0);
                  }}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Forma Pagamento" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__all__">Todas as formas</SelectItem>
                    <SelectItem value="dinheiro">Dinheiro</SelectItem>
                    <SelectItem value="pix">PIX</SelectItem>
                    <SelectItem value="transferencia">Transferência</SelectItem>
                    <SelectItem value="ted">TED</SelectItem>
                    <SelectItem value="doc">DOC</SelectItem>
                    <SelectItem value="debito">Débito</SelectItem>
                    <SelectItem value="credito">Crédito</SelectItem>
                    <SelectItem value="boleto">Boleto</SelectItem>
                    <SelectItem value="cheque">Cheque</SelectItem>
                  </SelectContent>
                </Select>
                <FiltroContaContabil
                  value={contaContabilId}
                  onChange={(value) => {
                    setContaContabilId(value);
                    setPageIndex(0);
                  }}
                  tiposConta={['despesa']}
                  placeholder="Conta Contábil"
                  className="w-[200px]"
                />
                <FiltroCentroCusto
                  value={centroCustoId}
                  onChange={(value) => {
                    setCentroCustoId(value);
                    setPageIndex(0);
                  }}
                  placeholder="Centro de Custo"
                  className="w-[180px]"
                />
                <FiltroCliente
                  value={fornecedorId}
                  onChange={(value) => {
                    setFornecedorId(value);
                    setPageIndex(0);
                  }}
                  tipo="fornecedor"
                  placeholder="Fornecedor"
                  className="w-[200px]"
                />
              </>
            }
          />
        }
        footer={
          paginacao ? (
            <DataPagination
              pageIndex={paginacao.pagina - 1}
              pageSize={paginacao.limite}
              total={paginacao.total}
              totalPages={paginacao.totalPaginas}
              onPageChange={setPageIndex}
              onPageSizeChange={setPageSize}
              isLoading={isLoading}
            />
          ) : null
        }
      >
        <div className="relative border-t">
          <DataTable
            data={contasPagar}
            columns={colunas}
            pagination={
              paginacao
                ? {
                  pageIndex: paginacao.pagina - 1,
                  pageSize: paginacao.limite,
                  total: paginacao.total,
                  totalPages: paginacao.totalPaginas,
                  onPageChange: setPageIndex,
                  onPageSizeChange: setPageSize,
                }
                : undefined
            }
            sorting={undefined}
            isLoading={isLoading}
            error={error}
            emptyMessage="Nenhuma conta a pagar encontrada."
            hideTableBorder={true}
            hidePagination={true}
          />
        </div>
      </DataShell>

      {/* Dialog de Pagamento */}
      {selectedConta && (
        <PagarContaDialog
          open={pagarDialogOpen}
          onOpenChange={setPagarDialogOpen}
          conta={selectedConta}
          contasBancarias={contasBancarias}
          onSuccess={refetch}
        />
      )}

      {/* Dialog de Cancelamento */}
      <AlertDialog open={cancelarDialogOpen} onOpenChange={setCancelarDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancelar Conta a Pagar</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja cancelar esta conta?
              {selectedConta && (
                <span className="block mt-2 font-medium text-foreground">
                  {selectedConta.descricao} - {formatarValor(selectedConta.valor)}
                </span>
              )}
              <span className="block mt-2 text-amber-600">
                A conta será marcada como cancelada mas permanecerá no histórico.
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Voltar</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmCancelar}>Cancelar Conta</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog de Exclusão */}
      <AlertDialog open={excluirDialogOpen} onOpenChange={setExcluirDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Conta a Pagar</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir permanentemente esta conta?
              {selectedConta && (
                <span className="block mt-2 font-medium text-foreground">
                  {selectedConta.descricao} - {formatarValor(selectedConta.valor)}
                </span>
              )}
              <span className="block mt-2 text-destructive font-medium">
                Esta ação não pode ser desfeita!
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Voltar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmExcluir}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir Permanentemente
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
