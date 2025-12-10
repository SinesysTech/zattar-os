'use client';

/**
 * Página de Contas a Pagar
 * Lista e gerencia contas a pagar do escritório
 */

import * as React from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useDebounce } from '@/app/_lib/hooks/use-debounce';
import { DataTable } from '@/components/ui/data-table';
import { DataTableColumnHeader } from '@/components/ui/data-table-column-header';
import { TableToolbar } from '@/components/ui/table-toolbar';
import { ExportButton } from '@/components/financeiro/export-button';
import {
  buildContasPagarFilterOptions,
  buildContasPagarFilterGroups,
  parseContasPagarFilters,
} from './components/contas-pagar-toolbar-filters';
import { AlertasVencimento } from './components/alertas-vencimento';
import { PagarContaDialog } from './components/pagar-conta-dialog';
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
import { useContasPagar, cancelarConta, excluirConta } from '@/app/_lib/hooks/use-contas-pagar';
import { useContasBancarias } from '@/app/_lib/hooks/use-contas-bancarias';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import type { ColumnDef } from '@tanstack/react-table';
import type {
  ContaPagarComDetalhes,
  StatusContaPagar,
} from '@/backend/types/financeiro/contas-pagar.types';

// ============================================================================
// Constantes e Helpers
// ============================================================================

type BadgeTone = 'primary' | 'neutral' | 'info' | 'success' | 'warning' | 'danger' | 'muted';

const STATUS_CONFIG: Record<StatusContaPagar, { label: string; tone: BadgeTone }> = {
  pendente: { label: 'Pendente', tone: 'warning' },
  confirmado: { label: 'Pago', tone: 'success' },
  cancelado: { label: 'Cancelado', tone: 'neutral' },
  estornado: { label: 'Estornado', tone: 'danger' },
};

const formatarValor = (valor: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(valor);
};

const formatarData = (data: string | null): string => {
  if (!data) return '-';
  return format(new Date(data), 'dd/MM/yyyy', { locale: ptBR });
};

const isVencida = (conta: ContaPagarComDetalhes): boolean => {
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
  conta: ContaPagarComDetalhes;
  onPagar: (conta: ContaPagarComDetalhes) => void;
  onEditar: (conta: ContaPagarComDetalhes) => void;
  onCancelar: (conta: ContaPagarComDetalhes) => void;
  onExcluir: (conta: ContaPagarComDetalhes) => void;
  onVerDetalhes: (conta: ContaPagarComDetalhes) => void;
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
  onPagar: (conta: ContaPagarComDetalhes) => void,
  onEditar: (conta: ContaPagarComDetalhes) => void,
  onCancelar: (conta: ContaPagarComDetalhes) => void,
  onExcluir: (conta: ContaPagarComDetalhes) => void,
  onVerDetalhes: (conta: ContaPagarComDetalhes) => void
): ColumnDef<ContaPagarComDetalhes>[] {
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
              {conta.recorrente && (
                <Repeat className="h-3 w-3 text-muted-foreground" aria-label="Recorrente" />
              )}
            </div>
            {conta.fornecedor && (
              <span className="text-xs text-muted-foreground">
                {conta.fornecedor.nomeFantasia || conta.fornecedor.razaoSocial}
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
        const categoria = row.getValue('categoria') as string | null;
        return (
          <div className="min-h-10 flex items-center justify-center">
            {categoria ? (
              <Badge variant="outline" className="capitalize">
                {categoria.replace(/_/g, ' ')}
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
              <Badge tone="danger" variant="soft" className="ml-2">
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
        const status = row.getValue('status') as StatusContaPagar;
        const config = STATUS_CONFIG[status];
        return (
          <div className="min-h-10 flex items-center justify-center">
            <Badge tone={config.tone} variant="soft">
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
  const [busca, setBusca] = React.useState('');
  const [pagina, setPagina] = React.useState(0);
  const [limite, setLimite] = React.useState(50);
  const [selectedFilterIds, setSelectedFilterIds] = React.useState<string[]>(['status_pendente']);

  // Estados de dialogs
  const [pagarDialogOpen, setPagarDialogOpen] = React.useState(false);
  const [selectedConta, setSelectedConta] = React.useState<ContaPagarComDetalhes | null>(null);
  const [cancelarDialogOpen, setCancelarDialogOpen] = React.useState(false);
  const [excluirDialogOpen, setExcluirDialogOpen] = React.useState(false);

  // Preparar opções de filtros
  const filterOptions = React.useMemo(() => buildContasPagarFilterOptions(), []);
  const filterGroups = React.useMemo(() => buildContasPagarFilterGroups(), []);

  // Debounce da busca
  const buscaDebounced = useDebounce(busca, 500);

  // Parâmetros de busca
  const params = React.useMemo(() => {
    const parsedFilters = parseContasPagarFilters(selectedFilterIds);
    return {
      pagina: pagina + 1,
      limite,
      busca: buscaDebounced || undefined,
      ...parsedFilters,
      incluirResumo: true,
    };
  }, [pagina, limite, buscaDebounced, selectedFilterIds]);

  // Hook de dados
  const { contasPagar, paginacao, resumoVencimentos, isLoading, error, refetch } = useContasPagar(params);

  // Contas bancárias para os selects
  const { contasBancarias } = useContasBancarias();

  // Handlers
  const handleFilterIdsChange = React.useCallback((selectedIds: string[]) => {
    setSelectedFilterIds(selectedIds);
    setPagina(0);
  }, []);

  const handlePagar = React.useCallback((conta: ContaPagarComDetalhes) => {
    setSelectedConta(conta);
    setPagarDialogOpen(true);
  }, []);

  const handleEditar = React.useCallback(() => {
    // TODO: Implementar dialog de edição
    toast.info('Funcionalidade de edição em desenvolvimento');
  }, []);

  const handleCancelar = React.useCallback((conta: ContaPagarComDetalhes) => {
    setSelectedConta(conta);
    setCancelarDialogOpen(true);
  }, []);

  const handleExcluir = React.useCallback((conta: ContaPagarComDetalhes) => {
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
      const resultado = await cancelarConta(selectedConta.id);
      if (!resultado.success) {
        throw new Error(resultado.error);
      }
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
      const resultado = await excluirConta(selectedConta.id);
      if (!resultado.success) {
        throw new Error(resultado.error);
      }
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
    setPagina(0);
  }, []);

  const handleFiltrarHoje = React.useCallback(() => {
    setSelectedFilterIds(['status_pendente', 'vencimento_hoje']);
    setPagina(0);
  }, []);

  const handleFiltrar7Dias = React.useCallback(() => {
    setSelectedFilterIds(['status_pendente', 'vencimento_7dias']);
    setPagina(0);
  }, []);

  const handleFiltrar30Dias = React.useCallback(() => {
    setSelectedFilterIds(['status_pendente', 'vencimento_30dias']);
    setPagina(0);
  }, []);

  // Definir colunas
  const colunas = React.useMemo(
    () =>
      criarColunas(handlePagar, handleEditar, handleCancelar, handleExcluir, handleVerDetalhes),
    [handlePagar, handleEditar, handleCancelar, handleExcluir, handleVerDetalhes]
  );

  const isSearching = busca !== buscaDebounced && busca.length > 0;

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

      {/* Toolbar */}
      <TableToolbar
        searchValue={busca}
        onSearchChange={(value) => {
          setBusca(value);
          setPagina(0);
        }}
        isSearching={isSearching}
        searchPlaceholder="Buscar por descrição, documento ou categoria..."
        filterOptions={filterOptions}
        filterGroups={filterGroups}
        selectedFilters={selectedFilterIds}
        onFiltersChange={handleFilterIdsChange}
        filterButtonsMode="buttons"
        onNewClick={() => toast.info('Funcionalidade de criação em desenvolvimento')}
        newButtonTooltip="Nova Conta a Pagar"
      />

      {/* Mensagem de erro */}
      {error && (
        <div className="rounded-md bg-destructive/15 p-4 text-sm text-destructive">
          <p className="font-semibold">Erro ao carregar contas a pagar:</p>
          <p>{error}</p>
        </div>
      )}

      {/* Tabela */}
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
              onPageChange: setPagina,
              onPageSizeChange: setLimite,
            }
            : undefined
        }
        sorting={undefined}
        isLoading={isLoading}
        error={error}
        emptyMessage="Nenhuma conta a pagar encontrada."
      />

      {/* Dialog de Pagamento */}
      <PagarContaDialog
        open={pagarDialogOpen}
        onOpenChange={setPagarDialogOpen}
        conta={selectedConta}
        contasBancarias={contasBancarias}
        onSuccess={refetch}
      />

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
