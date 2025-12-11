
'use client';

/**
 * Página de Contas a Receber
 * Lista e gerencia contas a receber do escritório
 */

import * as React from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useDebounce } from '@/hooks/use-debounce';
import { DataTable } from '@/components/ui/data-table';
import { DataTableColumnHeader } from '@/components/ui/data-table-column-header';
import { TableToolbar } from '@/components/ui/table-toolbar';
import { ExportButton } from '@/features/financeiro/components/export-button';
import {
  buildContasReceberFilterOptions,
  buildContasReceberFilterGroups,
  parseContasReceberFilters,
} from '@/features/financeiro/components/contas-receber/contas-receber-toolbar-filters';
import { AlertasInadimplencia } from '@/features/financeiro/components/contas-receber/alertas-inadimplencia';
import { ReceberContaDialog } from '@/features/financeiro/components/contas-receber/receber-conta-dialog';
import { ContaReceberFormDialog } from '@/features/financeiro/components/contas-receber/conta-receber-form-dialog';
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
  FileText,
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
import { useContasReceber, cancelarConta, excluirConta } from '@/features/financeiro';
import { useContasBancarias } from '@/features/financeiro';
import { useClientes } from '@/app/_lib/hooks/use-clientes';
import { useContratos } from '@/features/contratos';
import { usePlanoContasAnaliticas } from '@/features/financeiro';
import { useCentrosCustoAtivos } from '@/features/financeiro';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import type { ColumnDef } from '@tanstack/react-table';
import type {
  ContaReceberComDetalhes,
  StatusContaReceber,
  OrigemContaReceber,
} from '@/features/financeiro/types/contas-receber.types';

// ============================================================================
// Constantes e Helpers
// ============================================================================

type BadgeVariant = 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning';

const STATUS_CONFIG: Record<StatusContaReceber, { label: string; tone: BadgeVariant }> = {
  pendente: { label: 'Pendente', tone: 'warning' },
  confirmado: { label: 'Recebido', tone: 'success' },
  cancelado: { label: 'Cancelado', tone: 'secondary' },
  estornado: { label: 'Estornado', tone: 'destructive' },
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

const isVencida = (conta: ContaReceberComDetalhes): boolean => {
  if (conta.status !== 'pendente' || !conta.dataVencimento) return false;
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  return new Date(conta.dataVencimento) < hoje;
};

// ============================================================================
// Componente de Ações
// ============================================================================

function ContasReceberActions({
  conta,
  onReceber,
  onEditar,
  onCancelar,
  onExcluir,
  onVerDetalhes,
}: {
  conta: ContaReceberComDetalhes;
  onReceber: (conta: ContaReceberComDetalhes) => void;
  onEditar: (conta: ContaReceberComDetalhes) => void;
  onCancelar: (conta: ContaReceberComDetalhes) => void;
  onExcluir: (conta: ContaReceberComDetalhes) => void;
  onVerDetalhes: (conta: ContaReceberComDetalhes) => void;
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
            <DropdownMenuItem onClick={() => onReceber(conta)}>
              <CreditCard className="mr-2 h-4 w-4" />
              Receber
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
  onReceber: (conta: ContaReceberComDetalhes) => void,
  onEditar: (conta: ContaReceberComDetalhes) => void,
  onCancelar: (conta: ContaReceberComDetalhes) => void,
  onExcluir: (conta: ContaReceberComDetalhes) => void,
  onVerDetalhes: (conta: ContaReceberComDetalhes) => void
): ColumnDef<ContaReceberComDetalhes>[] {
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
            {conta.cliente && (
              <span className="text-xs text-muted-foreground">
                {conta.cliente.nomeFantasia || conta.cliente.razaoSocial}
              </span>
            )}
            {conta.contrato && (
              <span className="text-xs text-blue-600 flex items-center gap-1">
                <FileText className="h-3 w-3" />
                {conta.contrato.numero}
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
      size: 150,
      cell: ({ row }) => {
        const categoria = row.getValue('categoria') as string | null;
        return (
          <div className="min-h-10 flex items-center justify-center">
            {categoria ? (
              <Badge variant="outline" className="capitalize text-xs">
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
          <div className="min-h-10 flex items-center justify-end font-mono text-sm font-medium text-green-600">
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
        const status = row.getValue('status') as StatusContaReceber;
        const config = STATUS_CONFIG[status];
        return (
          <div className="min-h-10 flex items-center justify-center">
            <Badge variant={config.tone}>
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
            <ContasReceberActions
              conta={conta}
              onReceber={onReceber}
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

export default function ContasReceberPage() {
  // Estados de filtros e busca
  const [busca, setBusca] = React.useState('');
  const [pagina, setPagina] = React.useState(0);
  const [limite, setLimite] = React.useState(50);
  const [selectedFilterIds, setSelectedFilterIds] = React.useState<string[]>(['status_pendente']);

  // Estados de dialogs
  const [receberDialogOpen, setReceberDialogOpen] = React.useState(false);
  const [formDialogOpen, setFormDialogOpen] = React.useState(false);
  const [selectedConta, setSelectedConta] = React.useState<ContaReceberComDetalhes | null>(null);
  const [cancelarDialogOpen, setCancelarDialogOpen] = React.useState(false);
  const [excluirDialogOpen, setExcluirDialogOpen] = React.useState(false);

  // Router para navegação
  const router = useRouter();

  // Preparar opções de filtros
  const filterOptions = React.useMemo(() => buildContasReceberFilterOptions(), []);
  const filterGroups = React.useMemo(() => buildContasReceberFilterGroups(), []);

  // Debounce da busca
  const buscaDebounced = useDebounce(busca, 500);

  // Parâmetros de busca
  const params = React.useMemo(() => {
    const parsedFilters = parseContasReceberFilters(selectedFilterIds);
    return {
      pagina: pagina + 1,
      limite,
      busca: buscaDebounced || undefined,
      ...parsedFilters,
      origem: parsedFilters.origem as OrigemContaReceber | undefined,
      incluirResumo: true,
    };
  }, [pagina, limite, buscaDebounced, selectedFilterIds]);

  // Hook de dados
  const { contasReceber, paginacao, resumoInadimplencia, isLoading, error, refetch } = useContasReceber(params);

  // Dados auxiliares para os formulários
  const { contasBancarias } = useContasBancarias();
  const { clientes } = useClientes({ limite: 500, ativo: true });
  const { contratos } = useContratos({ limite: 500 });
  const { planoContas } = usePlanoContasAnaliticas();
  const { centrosCusto } = useCentrosCustoAtivos();

  // Handlers
  const handleFilterIdsChange = React.useCallback((selectedIds: string[]) => {
    setSelectedFilterIds(selectedIds);
    setPagina(0);
  }, []);

  const handleReceber = React.useCallback((conta: ContaReceberComDetalhes) => {
    setSelectedConta(conta);
    setReceberDialogOpen(true);
  }, []);

  const handleEditar = React.useCallback((conta: ContaReceberComDetalhes) => {
    setSelectedConta(conta);
    setFormDialogOpen(true);
  }, []);

  const handleNovaConta = React.useCallback(() => {
    setSelectedConta(null);
    setFormDialogOpen(true);
  }, []);

  const handleCancelar = React.useCallback((conta: ContaReceberComDetalhes) => {
    setSelectedConta(conta);
    setCancelarDialogOpen(true);
  }, []);

  const handleExcluir = React.useCallback((conta: ContaReceberComDetalhes) => {
    setSelectedConta(conta);
    setExcluirDialogOpen(true);
  }, []);

  const handleVerDetalhes = React.useCallback((conta: ContaReceberComDetalhes) => {
    router.push(`/financeiro/contas-receber/${conta.id}`);
  }, [router]);

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
      criarColunas(handleReceber, handleEditar, handleCancelar, handleExcluir, handleVerDetalhes),
    [handleReceber, handleEditar, handleCancelar, handleExcluir, handleVerDetalhes]
  );

  const isSearching = busca !== buscaDebounced && busca.length > 0;

  return (
    <div className="space-y-3">
      {/* Alertas de Inadimplência */}
      <AlertasInadimplencia
        resumo={resumoInadimplencia}
        isLoading={isLoading}
        onFiltrarVencidas={handleFiltrarVencidas}
        onFiltrarHoje={handleFiltrarHoje}
        onFiltrar7Dias={handleFiltrar7Dias}
        onFiltrar30Dias={handleFiltrar30Dias}
      />

      <div className="flex justify-end">
        <ExportButton
          endpoint="/api/financeiro/contas-receber/exportar"
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
        searchPlaceholder="Buscar por descrição, cliente ou contrato..."
        filterOptions={filterOptions}
        filterGroups={filterGroups}
        selectedFilters={selectedFilterIds}
        onFiltersChange={handleFilterIdsChange}
        filterButtonsMode="buttons"
        onNewClick={handleNovaConta}
        newButtonTooltip="Nova Conta a Receber"
      />

      {/* Mensagem de erro */}
      {error && (
        <div className="rounded-md bg-destructive/15 p-4 text-sm text-destructive">
          <p className="font-semibold">Erro ao carregar contas a receber:</p>
          <p>{error}</p>
        </div>
      )}

      {/* Tabela */}
      <DataTable
        data={contasReceber}
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
        emptyMessage="Nenhuma conta a receber encontrada."
      />

      {/* Dialog de Recebimento */}
      <ReceberContaDialog
        open={receberDialogOpen}
        onOpenChange={setReceberDialogOpen}
        conta={selectedConta}
        contasBancarias={contasBancarias}
        onSuccess={refetch}
      />

      {/* Dialog de Criação/Edição */}
      <ContaReceberFormDialog
        open={formDialogOpen}
        onOpenChange={setFormDialogOpen}
        conta={selectedConta}
        contasBancarias={contasBancarias}
        planosContas={planoContas}
        centrosCusto={centrosCusto}
        clientes={clientes}
        contratos={contratos}
        onSuccess={refetch}
      />

      {/* Dialog de Cancelamento */}
      <AlertDialog open={cancelarDialogOpen} onOpenChange={setCancelarDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancelar Conta a Receber</AlertDialogTitle>
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
            <AlertDialogTitle>Excluir Conta a Receber</AlertDialogTitle>
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
