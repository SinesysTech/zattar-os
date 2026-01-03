
'use client';

import * as React from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useDebounce } from '@/hooks/use-debounce';
import { DataPagination, DataShell, DataTable } from '@/components/shared/data-shell';
import { DataTableColumnHeader } from '@/components/shared/data-shell/data-table-column-header';
import { DataTableToolbar } from '@/components/shared/data-shell/data-table-toolbar';
import { SalarioFormDialog } from './salario-form-dialog';
import type { Table as TanstackTable } from '@tanstack/react-table';
import { AppBadge as Badge } from '@/components/ui/app-badge';
import { Button } from '@/components/ui/button';
import {
  MoreHorizontal,
  Pencil,
  History,
  XCircle,
  Trash2,
  Plus,
  CalendarOff,
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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useSalarios, encerrarVigenciaSalario, inativarSalario, excluirSalario } from '../../hooks';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import type { ColumnDef } from '@tanstack/react-table';
import type { SalarioComDetalhes } from '../../types';

// ============================================================================
// Constantes e Helpers
// ============================================================================

const formatarValor = (valor: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(valor);
};

const formatarData = (data: string | null): string => {
  if (!data) return '-';
  const date = new Date(data);
  // Adjust for timezone if needed, or assume UTC date string
  return format(date, 'dd/MM/yyyy', { locale: ptBR });
};

const isVigente = (salario: SalarioComDetalhes): boolean => {
  if (!salario.ativo) return false;
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const inicio = new Date(salario.dataInicioVigencia);
  inicio.setHours(0, 0, 0, 0);
  if (inicio > hoje) return false; 
  if (salario.dataFimVigencia) {
    const fim = new Date(salario.dataFimVigencia);
    fim.setHours(0, 0, 0, 0);
    return fim >= hoje;
  }
  return true;
};

// ============================================================================
// Componente de Ações
// ============================================================================

function SalariosActions({
  salario,
  onEditar,
  onEncerrarVigencia,
  onInativar,
  onExcluir,
  onVerHistorico,
}: {
  salario: SalarioComDetalhes;
  onEditar: (salario: SalarioComDetalhes) => void;
  onEncerrarVigencia: (salario: SalarioComDetalhes) => void;
  onInativar: (salario: SalarioComDetalhes) => void;
  onExcluir: (salario: SalarioComDetalhes) => void;
  onVerHistorico: (salario: SalarioComDetalhes) => void;
}) {
  const vigente = isVigente(salario);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <MoreHorizontal className="h-4 w-4" />
          <span className="sr-only">Ações do salário</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => onVerHistorico(salario)}>
          <History className="mr-2 h-4 w-4" />
          Ver Histórico (Legacy Page)
        </DropdownMenuItem>
        {salario.ativo && (
          <>
            <DropdownMenuItem onClick={() => onEditar(salario)}>
              <Pencil className="mr-2 h-4 w-4" />
              Editar
            </DropdownMenuItem>
            {vigente && (
              <DropdownMenuItem onClick={() => onEncerrarVigencia(salario)}>
                <CalendarOff className="mr-2 h-4 w-4" />
                Encerrar Vigência
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => onInativar(salario)} className="text-amber-600">
              <XCircle className="mr-2 h-4 w-4" />
              Inativar
            </DropdownMenuItem>
          </>
        )}
        <DropdownMenuItem onClick={() => onExcluir(salario)} className="text-destructive">
          <Trash2 className="mr-2 h-4 w-4" />
          Excluir
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// ============================================================================
// Definição das Colunas
// ============================================================================

function criarColunas(
  onEditar: (salario: SalarioComDetalhes) => void,
  onEncerrarVigencia: (salario: SalarioComDetalhes) => void,
  onInativar: (salario: SalarioComDetalhes) => void,
  onExcluir: (salario: SalarioComDetalhes) => void,
  onVerHistorico: (salario: SalarioComDetalhes) => void
): ColumnDef<SalarioComDetalhes>[] {
  return [
    {
      accessorKey: 'usuario',
      header: ({ column }) => (
        <div className="flex items-center justify-start">
          <DataTableColumnHeader column={column} title="Funcionário" />
        </div>
      ),
      enableSorting: true,
      size: 200,
      cell: ({ row }) => {
        const salario = row.original;
        return (
          <div className="min-h-10 flex flex-col justify-center">
            <span className="text-sm font-medium">
              {salario.usuario?.nomeExibicao || `Usuário ${salario.usuarioId}`}
            </span>
            {salario.cargo && (
              <span className="text-xs text-muted-foreground">
                {salario.cargo.nome}
              </span>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: 'salarioBruto',
      header: ({ column }) => (
        <div className="flex items-center justify-end">
          <DataTableColumnHeader column={column} title="Salário Bruto" />
        </div>
      ),
      enableSorting: true,
      size: 130,
      cell: ({ row }) => (
        <div className="text-right font-medium">
          {formatarValor(row.original.salarioBruto)}
        </div>
      ),
    },
    {
      accessorKey: 'dataInicioVigencia',
      header: ({ column }) => (
        <div className="flex items-center justify-center">
          <DataTableColumnHeader column={column} title="Início Vigência" />
        </div>
      ),
      enableSorting: true,
      size: 130,
      cell: ({ row }) => (
        <div className="text-center">
          {formatarData(row.original.dataInicioVigencia)}
        </div>
      ),
    },
    {
      accessorKey: 'dataFimVigencia',
      header: ({ column }) => (
        <div className="flex items-center justify-center">
          <DataTableColumnHeader column={column} title="Fim Vigência" />
        </div>
      ),
      enableSorting: true,
      size: 130,
      cell: ({ row }) => {
        const salario = row.original;
        const vigente = isVigente(salario);
        return (
          <div className="text-center">
            {salario.dataFimVigencia ? (
              formatarData(salario.dataFimVigencia)
            ) : vigente ? (
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                Vigente
              </Badge>
            ) : (
              '-'
            )}
          </div>
        );
      },
    },
    {
      accessorKey: 'ativo',
      header: ({ column }) => (
        <div className="flex items-center justify-center">
          <DataTableColumnHeader column={column} title="Status" />
        </div>
      ),
      enableSorting: true,
      size: 100,
      cell: ({ row }) => {
        const salario = row.original;
        const vigente = isVigente(salario);
        return (
          <div className="flex justify-center">
            {salario.ativo ? (
              vigente ? (
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                  Ativo
                </Badge>
              ) : (
                <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">
                  Encerrado
                </Badge>
              )
            ) : (
              <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                Inativo
              </Badge>
            )}
          </div>
        );
      },
    },
    {
      id: 'actions',
      header: () => <div className="text-center">Ações</div>,
      size: 60,
      cell: ({ row }) => (
        <div className="flex justify-center">
          <SalariosActions
            salario={row.original}
            onEditar={onEditar}
            onEncerrarVigencia={onEncerrarVigencia}
            onInativar={onInativar}
            onExcluir={onExcluir}
            onVerHistorico={onVerHistorico}
          />
        </div>
      ),
    },
  ];
}

// ============================================================================
// Componente Principal
// ============================================================================

export function SalariosList() {
  const router = useRouter();

  // Estado da instância da tabela e densidade
  const [table, setTable] = React.useState<TanstackTable<SalarioComDetalhes> | null>(null);
  const [density, setDensity] = React.useState<'compact' | 'standard' | 'relaxed'>('standard');

  // Estados de filtros
  const [busca, setBusca] = React.useState('');
  const [pagina, setPagina] = React.useState(1);

  const buscaDebounced = useDebounce(busca, 500);

  // Estados de dialogs
  const [formDialogOpen, setFormDialogOpen] = React.useState(false);
  const [salarioParaEditar, setSalarioParaEditar] = React.useState<SalarioComDetalhes | null>(null);
  const [alertDialogOpen, setAlertDialogOpen] = React.useState(false);
  const [acao, setAcao] = React.useState<'inativar' | 'excluir' | null>(null);
  const [salarioSelecionado, setSalarioSelecionado] = React.useState<SalarioComDetalhes | null>(null);
  const [encerrarDialogOpen, setEncerrarDialogOpen] = React.useState(false);
  const [dataFimVigencia, setDataFimVigencia] = React.useState('');

  // Hook de busca
  const { salarios, paginacao, totais, isLoading, error, refetch } = useSalarios({
    pagina,
    limite: 50,
    busca: buscaDebounced || undefined,
    ordenarPor: 'data_inicio_vigencia',
    ordem: 'desc',
    incluirTotais: true,
  });

  // Handlers
  const handleEditar = React.useCallback((salario: SalarioComDetalhes) => {
    setSalarioParaEditar(salario);
    setFormDialogOpen(true);
  }, []);

  const handleNovo = React.useCallback(() => {
    setSalarioParaEditar(null);
    setFormDialogOpen(true);
  }, []);

  const handleEncerrarVigencia = React.useCallback((salario: SalarioComDetalhes) => {
    setSalarioSelecionado(salario);
    setDataFimVigencia(format(new Date(), 'yyyy-MM-dd'));
    setEncerrarDialogOpen(true);
  }, []);

  const handleConfirmarEncerramento = React.useCallback(async () => {
    if (!salarioSelecionado || !dataFimVigencia) return;

    const result = await encerrarVigenciaSalario(salarioSelecionado.id, dataFimVigencia);

    if (result.success) {
      toast.success('Vigência encerrada com sucesso');
      setEncerrarDialogOpen(false);
      setSalarioSelecionado(null);
      refetch();
    } else {
      toast.error(result.error || 'Erro ao encerrar vigência');
    }
  }, [salarioSelecionado, dataFimVigencia, refetch]);

  const handleInativar = React.useCallback((salario: SalarioComDetalhes) => {
    setSalarioSelecionado(salario);
    setAcao('inativar');
    setAlertDialogOpen(true);
  }, []);

  const handleExcluir = React.useCallback((salario: SalarioComDetalhes) => {
    setSalarioSelecionado(salario);
    setAcao('excluir');
    setAlertDialogOpen(true);
  }, []);

  const handleConfirmarAcao = React.useCallback(async () => {
    if (!salarioSelecionado || !acao) return;

    let result;
    if (acao === 'inativar') {
      result = await inativarSalario(salarioSelecionado.id);
    } else {
      result = await excluirSalario(salarioSelecionado.id);
    }

    if (result.success) {
      toast.success(acao === 'inativar' ? 'Salário inativado' : 'Salário excluído');
      setAlertDialogOpen(false);
      setSalarioSelecionado(null);
      setAcao(null);
      refetch();
    } else {
      toast.error(result.error || `Erro ao ${acao} salário`);
    }
  }, [salarioSelecionado, acao, refetch]);

  const handleVerHistorico = React.useCallback((salario: SalarioComDetalhes) => {
    router.push(`/rh/salarios/usuario/${salario.usuarioId}`);
  }, [router]);

  const handleFormSuccess = React.useCallback(() => {
    setFormDialogOpen(false);
    setSalarioParaEditar(null);
    refetch();
  }, [refetch]);

  // Colunas
  const colunas = React.useMemo(
    () => criarColunas(handleEditar, handleEncerrarVigencia, handleInativar, handleExcluir, handleVerHistorico),
    [handleEditar, handleEncerrarVigencia, handleInativar, handleExcluir, handleVerHistorico]
  );

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Cards de Resumo */}
      {totais && (
        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-lg border bg-card p-4">
            <p className="text-sm text-muted-foreground">Total Funcionários com Salário</p>
            <p className="text-2xl font-bold">{totais.totalFuncionarios}</p>
          </div>
          <div className="rounded-lg border bg-card p-4">
            <p className="text-sm text-muted-foreground">Custo Mensal Bruto</p>
            <p className="text-2xl font-bold text-green-600">{formatarValor(totais.totalBrutoMensal)}</p>
          </div>
        </div>
      )}

      <DataShell
        header={
          <DataTableToolbar
            table={table}
            density={density}
            onDensityChange={setDensity}
            searchValue={busca}
            onSearchValueChange={setBusca}
            searchPlaceholder="Buscar por funcionário ou observações..."
            actionButton={{
              label: 'Novo Salário',
              onClick: handleNovo,
            }}
          />
        }
        footer={
          paginacao && paginacao.totalPaginas > 0 ? (
            <DataPagination
              pageIndex={pagina - 1}
              pageSize={50}
              total={paginacao.total}
              totalPages={paginacao.totalPaginas}
              onPageChange={(pageIndex) => setPagina(pageIndex + 1)}
              onPageSizeChange={() => { }}
              isLoading={isLoading}
            />
          ) : null
        }
      >
        <div className="relative border-t">
          <DataTable
            columns={colunas}
            data={salarios}
            isLoading={isLoading}
            error={error}
            pagination={
              paginacao
                ? {
                    pageIndex: pagina - 1,
                    pageSize: 50,
                    total: paginacao.total,
                    totalPages: paginacao.totalPaginas,
                    onPageChange: (pageIndex) => setPagina(pageIndex + 1),
                    onPageSizeChange: () => { },
                  }
                : undefined
            }
            hideTableBorder={true}
            hidePagination={true}
            onTableChange={setTable}
            density={density}
          />
        </div>
      </DataShell>

      {/* Dialog de Formulário */}
      <SalarioFormDialog
        open={formDialogOpen}
        onOpenChange={setFormDialogOpen}
        salario={salarioParaEditar}
        onSuccess={handleFormSuccess}
      />

      {/* Dialog de Encerramento de Vigência */}
      <Dialog open={encerrarDialogOpen} onOpenChange={setEncerrarDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Encerrar Vigência</DialogTitle>
            <DialogDescription>
              Informe a data de fim da vigência para o salário de{' '}
              <strong>{salarioSelecionado?.usuario?.nomeExibicao}</strong>
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="dataFimVigencia">Data de Fim</Label>
            <Input
              id="dataFimVigencia"
              type="date"
              value={dataFimVigencia}
              onChange={(e) => setDataFimVigencia(e.target.value)}
              className="mt-2"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEncerrarDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleConfirmarEncerramento} disabled={!dataFimVigencia}>
              Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Alert Dialog de Confirmação */}
      <AlertDialog open={alertDialogOpen} onOpenChange={setAlertDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {acao === 'inativar' ? 'Inativar Salário' : 'Excluir Salário'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {acao === 'inativar'
                ? `Tem certeza que deseja inativar o salário de ${salarioSelecionado?.usuario?.nomeExibicao}? O registro será mantido para histórico.`
                : `Tem certeza que deseja excluir o salário de ${salarioSelecionado?.usuario?.nomeExibicao}? Esta ação não pode ser desfeita.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmarAcao}
              className={acao === 'excluir' ? 'bg-destructive text-destructive-foreground' : ''}
            >
              {acao === 'inativar' ? 'Inativar' : 'Excluir'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
