'use client';

/**
 * Página de Plano de Contas
 * Lista e gerencia contas contábeis do sistema
 */

import * as React from 'react';
import { useDebounce } from '@/app/_lib/hooks/use-debounce';
import { DataTable } from '@/components/ui/data-table';
import { DataTableColumnHeader } from '@/components/ui/data-table-column-header';
import { TableToolbar } from '@/components/ui/table-toolbar';
import {
  buildPlanoContasFilterOptions,
  buildPlanoContasFilterGroups,
  parsePlanoContasFilters,
} from '@/features/financeiro/components/plano-contas/plano-contas-toolbar-filters';
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
import { usePlanoContas } from '@/features/financeiro/hooks/use-plano-contas';
import { actionAtualizarConta } from '@/features/financeiro/actions/plano-contas';
import { PlanoContaCreateDialog } from '@/features/financeiro/components/plano-contas/plano-conta-create-dialog';
import { PlanoContaEditDialog } from '@/features/financeiro/components/plano-contas/plano-conta-edit-dialog';
import { toast } from 'sonner';
import { ExportButton } from '@/features/financeiro/components/export-button';
import type { ColumnDef } from '@tanstack/react-table';
import type {
  PlanoContaComPai,
  PlanoContasFilters,
  TipoContaContabil,
  NivelConta,
} from '@/features/financeiro/types/plano-contas';

// Tons do Badge para tipos de conta
type BadgeTone = 'primary' | 'neutral' | 'info' | 'success' | 'warning' | 'danger' | 'muted';
const TIPO_CONTA_TONES: Record<TipoContaContabil, BadgeTone> = {
  ativo: 'info',           // azul (sky)
  passivo: 'danger',       // vermelho
  receita: 'success',      // verde (emerald)
  despesa: 'warning',      // amarelo (amber)
  patrimonio_liquido: 'primary',  // roxo/primário
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
      meta: { align: 'left' },
      cell: ({ row }) => (
        <div className="min-h-10 flex items-center justify-start font-mono text-sm">
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
      meta: { align: 'left' },
      cell: ({ row }) => {
        const conta = row.original;
        return (
          <div className="min-h-10 flex flex-col justify-center">
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
      cell: ({ row }) => {
        const tipo = row.getValue('tipoConta') as TipoContaContabil;
        const tone = TIPO_CONTA_TONES[tipo];
        return (
          <div className="min-h-10 flex items-center justify-center">
            <Badge tone={tone} variant="soft">
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
      cell: ({ row }) => {
        const nivel = row.getValue('nivel') as NivelConta;
        return (
          <div className="min-h-10 flex items-center justify-center">
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
      cell: ({ row }) => {
        const ativo = row.getValue('ativo') as boolean;
        return (
          <div className="min-h-10 flex items-center justify-center">
            <Badge tone={ativo ? 'success' : 'neutral'} variant={ativo ? 'soft' : 'outline'}>
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
      cell: ({ row }) => {
        const conta = row.original;
        return (
          <div className="min-h-10 flex items-center justify-center">
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
  const [busca, setBusca] = React.useState('');
  const [pagina, setPagina] = React.useState(0);
  const [limite, setLimite] = React.useState(50);
  const [filtros, setFiltros] = React.useState<PlanoContasFilters>({ ativo: true });
  const [selectedFilterIds, setSelectedFilterIds] = React.useState<string[]>(['ativo_true']);
  const [createOpen, setCreateOpen] = React.useState(false);
  const [editOpen, setEditOpen] = React.useState(false);
  const [selectedConta, setSelectedConta] = React.useState<PlanoContaComPai | null>(null);

  // Preparar opções e grupos de filtros
  const filterOptions = React.useMemo(() => buildPlanoContasFilterOptions(), []);
  const filterGroups = React.useMemo(() => buildPlanoContasFilterGroups(), []);

  // Debounce da busca
  const buscaDebounced = useDebounce(busca, 500);

  // Parâmetros para buscar plano de contas
  const params = React.useMemo(
    () => ({
      pagina: pagina + 1, // API usa 1-indexed
      limite,
      busca: buscaDebounced || undefined,
      tipoConta: filtros.tipoConta,
      nivel: filtros.nivel,
      ativo: filtros.ativo,
    }),
    [pagina, limite, buscaDebounced, filtros.tipoConta, filtros.nivel, filtros.ativo]
  );

  const { planoContas, paginacao, isLoading, error, mutate } = usePlanoContas(params);

  // Definir se está buscando (debounced)
  const isSearching = busca !== buscaDebounced && busca.length > 0;

  // Função para atualizar após operações
  const refetch = React.useCallback(() => {
    mutate();
  }, [mutate]);

  const handleCreateSuccess = React.useCallback(() => {
    refetch();
  }, [refetch]);

  const handleFilterIdsChange = React.useCallback((selectedIds: string[]) => {
    setSelectedFilterIds(selectedIds);
    const newFilters = parsePlanoContasFilters(selectedIds);
    setFiltros(newFilters);
    setPagina(0);
  }, []);

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

  const colunas = React.useMemo(
    () => criarColunas(handleEdit, handleToggleStatus),
    [handleEdit, handleToggleStatus]
  );

  return (
    <div className="space-y-3">
      {/* Toolbar com busca, filtros e ações */}
      <TableToolbar
        searchValue={busca}
        onSearchChange={(value) => {
          setBusca(value);
          setPagina(0);
        }}
        isSearching={isSearching}
        searchPlaceholder="Buscar por código ou nome..."
        filterOptions={filterOptions}
        filterGroups={filterGroups}
        selectedFilters={selectedFilterIds}
        onFiltersChange={handleFilterIdsChange}
        filterButtonsMode="buttons"
        onNewClick={() => setCreateOpen(true)}
        newButtonTooltip="Nova Conta"
      />
      <div className="flex justify-end">
        <ExportButton
          endpoint="/api/financeiro/plano-contas/exportar"
          opcoes={[
            { label: 'Exportar PDF', formato: 'pdf' },
            { label: 'Exportar CSV', formato: 'csv' },
          ]}
        />
      </div>

      {/* Mensagem de erro */}
      {error && (
        <div className="rounded-md bg-destructive/15 p-4 text-sm text-destructive">
          <p className="font-semibold">Erro ao carregar plano de contas:</p>
          <p>{error}</p>
        </div>
      )}

      {/* Tabela */}
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
              onPageChange: setPagina,
              onPageSizeChange: setLimite,
            }
            : undefined
        }
        sorting={undefined}
        isLoading={isLoading}
        error={error}
        emptyMessage="Nenhuma conta encontrada."
      />

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
