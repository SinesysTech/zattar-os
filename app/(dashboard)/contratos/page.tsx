'use client';

// Página de contratos - Lista contratos do sistema

import * as React from 'react';
import { useDebounce } from '@/hooks/use-debounce';
import { DataTable } from '@/components/data-table';
import { DataTableColumnHeader } from '@/components/data-table-column-header';
import { ContratosFiltrosAvancados } from '@/components/contratos-filtros-avancados';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ContratoViewSheet } from '@/components/contratos/contrato-view-sheet';
import { ContratoEditSheet } from '@/components/contratos/contrato-edit-sheet';
import { ContratoCreateSheet } from '@/components/contratos/contrato-create-sheet';
import { Eye, Pencil, Plus } from 'lucide-react';
import { useContratos } from '@/lib/hooks/use-contratos';
import type { ColumnDef } from '@tanstack/react-table';
import type { Contrato } from '@/backend/contratos/services/persistence/contrato-persistence.service';
import type { ContratosFilters } from '@/lib/types/contratos';
import {
  formatarAreaDireito,
  formatarTipoContrato,
  formatarTipoCobranca,
  formatarStatusContrato,
  formatarData,
  getStatusBadgeVariant,
  getTipoContratoBadgeVariant,
} from '@/lib/utils/format-contratos';

/**
 * Componente de ações para cada contrato
 */
function ContratoActions({
  contrato,
  onEditSuccess,
}: {
  contrato: Contrato;
  onEditSuccess: () => void;
}) {
  const [viewOpen, setViewOpen] = React.useState(false);
  const [editOpen, setEditOpen] = React.useState(false);

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        onClick={() => setViewOpen(true)}
      >
        <Eye className="h-4 w-4" />
        <span className="sr-only">Visualizar contrato</span>
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        onClick={() => setEditOpen(true)}
      >
        <Pencil className="h-4 w-4" />
        <span className="sr-only">Editar contrato</span>
      </Button>
      <ContratoViewSheet
        open={viewOpen}
        onOpenChange={setViewOpen}
        contrato={contrato}
      />
      <ContratoEditSheet
        open={editOpen}
        onOpenChange={setEditOpen}
        contrato={contrato}
        onSuccess={onEditSuccess}
      />
    </>
  );
}

/**
 * Define as colunas da tabela de contratos
 */
function criarColunas(onEditSuccess: () => void): ColumnDef<Contrato>[] {
  return [
    {
      accessorKey: 'id',
      header: ({ column }) => (
        <div className="flex items-center justify-center">
          <DataTableColumnHeader column={column} title="ID" />
        </div>
      ),
      enableSorting: true,
      size: 80,
      cell: ({ row }) => (
        <div className="min-h-[2.5rem] flex items-center justify-center text-sm font-medium">
          #{row.getValue('id')}
        </div>
      ),
    },
    {
      accessorKey: 'dataContratacao',
      header: ({ column }) => (
        <div className="flex items-center justify-center">
          <DataTableColumnHeader column={column} title="Data" />
        </div>
      ),
      enableSorting: true,
      size: 120,
      cell: ({ row }) => (
        <div className="min-h-[2.5rem] flex items-center justify-center text-sm">
          {formatarData(row.getValue('dataContratacao'))}
        </div>
      ),
    },
    {
      accessorKey: 'areaDireito',
      header: ({ column }) => (
        <div className="flex items-center justify-center">
          <DataTableColumnHeader column={column} title="Área de Direito" />
        </div>
      ),
      enableSorting: true,
      size: 150,
      cell: ({ row }) => (
        <div className="min-h-[2.5rem] flex items-center justify-center">
          <Badge variant="outline">
            {formatarAreaDireito(row.getValue('areaDireito'))}
          </Badge>
        </div>
      ),
    },
    {
      accessorKey: 'tipoContrato',
      header: ({ column }) => (
        <div className="flex items-center justify-center">
          <DataTableColumnHeader column={column} title="Tipo" />
        </div>
      ),
      enableSorting: true,
      size: 150,
      cell: ({ row }) => {
        const tipo = row.getValue('tipoContrato') as Contrato['tipoContrato'];
        return (
          <div className="min-h-[2.5rem] flex items-center justify-center">
            <Badge variant={getTipoContratoBadgeVariant(tipo)}>
              {formatarTipoContrato(tipo)}
            </Badge>
          </div>
        );
      },
    },
    {
      accessorKey: 'tipoCobranca',
      header: ({ column }) => (
        <div className="flex items-center justify-center">
          <DataTableColumnHeader column={column} title="Cobrança" />
        </div>
      ),
      enableSorting: true,
      size: 120,
      cell: ({ row }) => (
        <div className="min-h-[2.5rem] flex items-center justify-center text-sm">
          {formatarTipoCobranca(row.getValue('tipoCobranca'))}
        </div>
      ),
    },
    {
      accessorKey: 'clienteId',
      header: ({ column }) => (
        <div className="flex items-center justify-center">
          <DataTableColumnHeader column={column} title="Cliente" />
        </div>
      ),
      enableSorting: true,
      size: 100,
      cell: ({ row }) => (
        <div className="min-h-[2.5rem] flex items-center justify-center text-sm">
          ID: {row.getValue('clienteId')}
        </div>
      ),
    },
    {
      accessorKey: 'status',
      header: ({ column }) => (
        <div className="flex items-center justify-center">
          <DataTableColumnHeader column={column} title="Status" />
        </div>
      ),
      enableSorting: true,
      size: 140,
      cell: ({ row }) => {
        const status = row.getValue('status') as Contrato['status'];
        return (
          <div className="min-h-[2.5rem] flex items-center justify-center">
            <Badge variant={getStatusBadgeVariant(status)}>
              {formatarStatusContrato(status)}
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
      size: 120,
      cell: ({ row }) => {
        const contrato = row.original;
        return (
          <div className="min-h-[2.5rem] flex items-center justify-center gap-2">
            <ContratoActions contrato={contrato} onEditSuccess={onEditSuccess} />
          </div>
        );
      },
    },
  ];
}

export default function ContratosPage() {
  const [busca, setBusca] = React.useState('');
  const [pagina, setPagina] = React.useState(0);
  const [limite, setLimite] = React.useState(50);
  const [filtros, setFiltros] = React.useState<ContratosFilters>({});
  const [createOpen, setCreateOpen] = React.useState(false);

  // Debounce da busca
  const buscaDebounced = useDebounce(busca, 500);

  // Parâmetros para buscar contratos
  const params = React.useMemo(() => {
    return {
      pagina: pagina + 1, // API usa 1-indexed
      limite,
      busca: buscaDebounced || undefined,
      ...filtros,
    };
  }, [pagina, limite, buscaDebounced, filtros]);

  const { contratos, paginacao, isLoading, error, refetch } = useContratos(params);

  // Função para atualizar após edição ou criação
  const handleEditSuccess = React.useCallback(() => {
    refetch();
  }, [refetch]);

  const colunas = React.useMemo(() => criarColunas(handleEditSuccess), [handleEditSuccess]);

  const handleFiltersChange = React.useCallback((newFilters: ContratosFilters) => {
    setFiltros(newFilters);
    setPagina(0); // Resetar para primeira página ao aplicar filtros
  }, []);

  const handleFiltersReset = React.useCallback(() => {
    setFiltros({});
    setPagina(0);
  }, []);

  return (
    <div className="space-y-4">
      {/* Barra de busca e filtros */}
      <div className="flex items-center gap-4 justify-between">
        <div className="flex items-center gap-2">
          <Input
            placeholder="Buscar por observações..."
            value={busca}
            onChange={(e) => {
              setBusca(e.target.value);
              setPagina(0); // Resetar para primeira página ao buscar
            }}
            className="max-w-sm"
          />
          <ContratosFiltrosAvancados
            filters={filtros}
            onFiltersChange={handleFiltersChange}
            onReset={handleFiltersReset}
          />
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Novo Contrato
        </Button>
      </div>

      {/* Tabela */}
      <DataTable
        data={contratos}
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
        emptyMessage="Nenhum contrato encontrado."
      />

      {/* Sheet para criação */}
      <ContratoCreateSheet
        open={createOpen}
        onOpenChange={setCreateOpen}
        onSuccess={handleEditSuccess}
      />
    </div>
  );
}
