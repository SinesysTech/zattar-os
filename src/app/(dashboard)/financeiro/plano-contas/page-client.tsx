'use client';

/**
 * Página de Plano de Contas
 * Lista e gerencia contas contábeis do sistema
 *
 * REFATORADO: Migrado de TableToolbar (deprecated) para DataTableToolbar (Data Shell)
 */

import * as React from 'react';
import { useDebounce } from '@/hooks/use-debounce';
import {
  DataPagination,
  DataShell,
  DataTable,
  DataTableToolbar,
} from '@/components/shared/data-shell';
import { DataTableColumnHeader } from '@/components/shared/data-shell/data-table-column-header';
import { usePlanoContas } from '@/features/financeiro/hooks/use-plano-contas';
import { actionAtualizarConta } from '@/features/financeiro/actions/plano-contas';
import { PlanoContaCreateDialog } from '@/features/financeiro/components/plano-contas/plano-conta-create-dialog';
import { PlanoContaEditDialog } from '@/features/financeiro/components/plano-contas/plano-conta-edit-dialog';
import type {
  PlanoContaComPai,
  PlanoContasFilters,
  TipoContaContabil,
  NivelConta,
} from '@/features/financeiro/domain/plano-contas';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { FiltroContaContabil } from '@/features/financeiro/components/shared/filtros/filtro-conta-contabil';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, Pencil, Power } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import type { ColumnDef, Table as TanstackTable } from '@tanstack/react-table';

// Variantes do Badge para tipos de conta
type BadgeVariant = 'default' | 'secondary' | 'outline' | 'info' | 'success' | 'warning' | 'destructive' | 'neutral' | 'accent';
const TIPO_CONTA_VARIANTS: Record<TipoContaContabil, BadgeVariant> = {
  ativo: 'info',           // azul (sky)
  passivo: 'destructive',       // vermelho
  receita: 'success',      // verde (emerald)
  despesa: 'warning',      // amarelo (amber)
  patrimonio_liquido: 'default',  // roxo/primário
};

const TIPO_CONTA_LABELS: Record<TipoContaContabil, string> = {
  ativo: 'Ativo',
  passivo: 'Passivo',
  receita: 'Receita',
  despesa: 'Despesa',
  patrimonio_liquido: 'Patrimônio Líquido',
};

const NIVEL_LABELS: Record<NivelConta, string> = {
  sintetica: 'Sintética',
  analitica: 'Analítica',
};

/**
 * Define as colunas da tabela de plano de contas
 */
function criarColunas(
  onEdit: (conta: PlanoContaComPai) => void,
  onToggleStatus: (conta: PlanoContaComPai) => void
): ColumnDef<PlanoContaComPai>[] {
  return [
    {
      accessorKey: 'codigo',
      header: ({ column }) => (
        <div className="flex items-center justify-start">
          <DataTableColumnHeader column={column} title="Código" />
        </div>
      ),
      enableSorting: true,
      size: 120,
      meta: { align: 'left' as const, headerLabel: 'Código' },
      cell: ({ row }) => (
        <div className="flex items-center justify-start font-mono text-sm">
          {row.getValue('codigo')}
        </div>
      ),
    },
    {
      accessorKey: 'nome',
      header: ({ column }) => (
        <div className="flex items-center justify-start">
          <DataTableColumnHeader column={column} title="Nome" />
        </div>
      ),
      enableSorting: true,
      size: 300,
      meta: { align: 'left' as const, headerLabel: 'Nome' },
      cell: ({ row }) => {
        const conta = row.original;
        return (
          <div className="flex flex-col justify-center">
            <span className="text-sm">{conta.nome}</span>
            {conta.contaPai && (
              <span className="text-xs text-muted-foreground">
                Pai: {conta.contaPai.codigo} - {conta.contaPai.nome}
              </span>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: 'tipoConta',
      header: ({ column }) => (
        <div className="flex items-center justify-center">
          <DataTableColumnHeader column={column} title="Tipo" />
        </div>
      ),
      enableSorting: true,
      size: 140,
      meta: { align: 'center' as const, headerLabel: 'Tipo' },
      cell: ({ row }) => {
        const tipo = row.getValue('tipoConta') as TipoContaContabil;
        const variant = TIPO_CONTA_VARIANTS[tipo];
        return (
          <div className="flex items-center justify-center">
            <Badge variant={variant}>
              {TIPO_CONTA_LABELS[tipo]}
            </Badge>
          </div>
        );
      },
    },
    {
      accessorKey: 'nivel',
      header: ({ column }) => (
        <div className="flex items-center justify-center">
          <DataTableColumnHeader column={column} title="Nível" />
        </div>
      ),
      enableSorting: true,
      size: 100,
      meta: { align: 'center' as const, headerLabel: 'Nível' },
      cell: ({ row }) => {
        const nivel = row.getValue('nivel') as NivelConta;
        return (
          <div className="flex items-center justify-center">
            <Badge variant={nivel === 'sintetica' ? 'outline' : 'default'}>
              {NIVEL_LABELS[nivel]}
            </Badge>
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
      meta: { align: 'center' as const, headerLabel: 'Status' },
      cell: ({ row }) => {
        const ativo = row.getValue('ativo') as boolean;
        return (
          <div className="flex items-center justify-center">
            <Badge variant={ativo ? 'success' : 'outline'}>
              {ativo ? 'Ativo' : 'Inativo'}
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
      meta: { align: 'center' as const },
      cell: ({ row }) => {
        const conta = row.original;
        return (
          <div className="flex items-center justify-center">
            <PlanoContaActions
              conta={conta}
              onEdit={onEdit}
              onToggleStatus={onToggleStatus}
            />
          </div>
        );
      },
    },
  ];
}

/**
 * Componente de ações para cada conta
 */
function PlanoContaActions({
  conta,
  onEdit,
  onToggleStatus,
}: {
  conta: PlanoContaComPai;
  onEdit: (conta: PlanoContaComPai) => void;
  onToggleStatus: (conta: PlanoContaComPai) => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <MoreHorizontal className="h-4 w-4" />
          <span className="sr-only">Ações da conta</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => onEdit(conta)}>
          <Pencil className="mr-2 h-4 w-4" />
          Editar
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => onToggleStatus(conta)}>
          <Power className="mr-2 h-4 w-4" />
          {conta.ativo ? 'Desativar' : 'Ativar'}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default function PlanoContasPage() {
  // Estados de busca e paginação
  const [globalFilter, setGlobalFilter] = React.useState('');
  const [pageIndex, setPageIndex] = React.useState(0);
  const [pageSize, setPageSize] = React.useState(50);

  // Estados de filtros individuais
  const [tipoConta, setTipoConta] = React.useState<string>('');
  const [nivel, setNivel] = React.useState<string>('');
  const [ativo, setAtivo] = React.useState<string>('true');
  const [natureza, setNatureza] = React.useState<string>('');
  const [contaPaiId, setContaPaiId] = React.useState<string>('');

  // Estados do Data Shell
  const [table, setTable] = React.useState<TanstackTable<PlanoContaComPai> | undefined>(undefined);
  const [density, setDensity] = React.useState<'compact' | 'standard' | 'relaxed'>('standard');

  // Estados de dialogs
  const [createOpen, setCreateOpen] = React.useState(false);
  const [editOpen, setEditOpen] = React.useState(false);
  const [selectedConta, setSelectedConta] = React.useState<PlanoContaComPai | null>(null);

  // Debounce da busca
  const buscaDebounced = useDebounce(globalFilter, 500);

  // Preparar filtros para API
  const filtros = React.useMemo<PlanoContasFilters>(() => {
    const filters: PlanoContasFilters = {};

    if (tipoConta) filters.tipoConta = tipoConta as TipoContaContabil;
    if (nivel) filters.nivel = nivel as NivelConta;
    if (ativo !== '') filters.ativo = ativo === 'true';

    return filters;
  }, [tipoConta, nivel, ativo]);

  // Parâmetros para buscar plano de contas
  const params = React.useMemo(
    () => ({
      pagina: pageIndex + 1, // API usa 1-indexed
      limite: pageSize,
      busca: buscaDebounced || undefined,
      ...filtros,
      contaPaiId: contaPaiId ? Number(contaPaiId) : undefined,
    }),
    [pageIndex, pageSize, buscaDebounced, filtros, contaPaiId]
  );

  const { planoContas, paginacao, isLoading, error, mutate } = usePlanoContas(params);

  // Função para atualizar após operações
  const refetch = React.useCallback(() => {
    mutate();
  }, [mutate]);

  const handleCreateSuccess = React.useCallback(() => {
    refetch();
  }, [refetch]);

  const handleEdit = React.useCallback((conta: PlanoContaComPai) => {
    setSelectedConta(conta);
    setEditOpen(true);
  }, []);

  const handleToggleStatus = React.useCallback(
    async (conta: PlanoContaComPai) => {
      try {
        const result = await actionAtualizarConta({ id: conta.id, ativo: !conta.ativo });

        if (!result.success) {
          throw new Error(result.error || 'Erro ao alterar status');
        }

        toast.success(conta.ativo ? 'Conta desativada com sucesso!' : 'Conta ativada com sucesso!');
        refetch();
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Erro ao alterar status';
        toast.error(message);
      }
    },
    [refetch]
  );

  const handleExport = React.useCallback((format: 'csv' | 'xlsx' | 'json') => {
    // TODO: Implementar exportação usando dados da tabela filtrada
    toast.info(`Exportação para ${format.toUpperCase()} será implementada em breve`);
  }, []);

  const colunas = React.useMemo(
    () => criarColunas(handleEdit, handleToggleStatus),
    [handleEdit, handleToggleStatus]
  );

  return (
    <div className="space-y-3">
      <DataShell
        header={
          <DataTableToolbar
            table={table}
            density={density}
            onDensityChange={setDensity}
            searchValue={globalFilter}
            onSearchValueChange={(value) => {
              setGlobalFilter(value);
              setPageIndex(0);
            }}
            searchPlaceholder="Buscar por código ou nome..."
            actionButton={{
              label: 'Nova Conta',
              onClick: () => setCreateOpen(true),
            }}
            onExport={handleExport}
            filtersSlot={
              <>
                {/* Tipo de Conta */}
                <Select
                  value={tipoConta}
                  onValueChange={(val) => {
                    setTipoConta(val);
                    setPageIndex(0);
                  }}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Tipo de Conta" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Todos os tipos</SelectItem>
                    <SelectItem value="ativo">Ativo</SelectItem>
                    <SelectItem value="passivo">Passivo</SelectItem>
                    <SelectItem value="receita">Receita</SelectItem>
                    <SelectItem value="despesa">Despesa</SelectItem>
                    <SelectItem value="patrimonio_liquido">Patrimônio Líquido</SelectItem>
                  </SelectContent>
                </Select>

                {/* Nível */}
                <Select
                  value={nivel}
                  onValueChange={(val) => {
                    setNivel(val);
                    setPageIndex(0);
                  }}
                >
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Nível" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Todos os níveis</SelectItem>
                    <SelectItem value="sintetica">Sintética</SelectItem>
                    <SelectItem value="analitica">Analítica</SelectItem>
                  </SelectContent>
                </Select>

                {/* Natureza (NOVO) */}
                <Select
                  value={natureza}
                  onValueChange={(val) => {
                    setNatureza(val);
                    setPageIndex(0);
                  }}
                >
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Natureza" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Todas</SelectItem>
                    <SelectItem value="devedora">Devedora</SelectItem>
                    <SelectItem value="credora">Credora</SelectItem>
                  </SelectContent>
                </Select>

                {/* Status */}
                <Select
                  value={ativo}
                  onValueChange={(val) => {
                    setAtivo(val);
                    setPageIndex(0);
                  }}
                >
                  <SelectTrigger className="w-[130px]">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Todos</SelectItem>
                    <SelectItem value="true">Ativo</SelectItem>
                    <SelectItem value="false">Inativo</SelectItem>
                  </SelectContent>
                </Select>

                {/* Conta Pai (NOVO) */}
                <FiltroContaContabil
                  value={contaPaiId}
                  onChange={(val) => {
                    setContaPaiId(val);
                    setPageIndex(0);
                  }}
                  placeholder="Conta Pai"
                  className="w-[220px]"
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
            data={planoContas}
            columns={colunas}
            pagination={
              paginacao
                ? {
                  pageIndex: paginacao.pagina - 1, // Converter para 0-indexed
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
            density={density}
            onTableReady={(t) => setTable(t as TanstackTable<PlanoContaComPai>)}
            emptyMessage="Nenhuma conta encontrada."
            hideTableBorder={true}
            hidePagination={true}
          />
        </div>
      </DataShell>

      {/* Dialog para criação */}
      <PlanoContaCreateDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onSuccess={handleCreateSuccess}
      />

      {/* Dialog para edição */}
      {selectedConta && (
        <PlanoContaEditDialog
          open={editOpen}
          onOpenChange={setEditOpen}
          onSuccess={handleCreateSuccess}
          conta={selectedConta}
        />
      )}
    </div>
  );
}
