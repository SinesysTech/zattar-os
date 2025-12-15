'use client';

/**
 * CONTRATOS FEATURE - ContratosTable
 *
 * Tabela responsiva de contratos com:
 * - Colunas: ID, Data Contratação, Cliente, Área, Tipo, Cobrança, Status, Ações
 * - Ordenação e filtros
 * - Ações de visualizar e editar
 */

import * as React from 'react';
import { ResponsiveTable, ResponsiveTableColumn } from '@/components/ui/responsive-table';
import { DataTableColumnHeader } from '@/components/shared/data-shell/data-table-column-header';
import { Button } from '@/components/ui/button';
import { ButtonGroup } from '@/components/ui/button-group';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Eye, Pencil } from 'lucide-react';
import type { Contrato, ClienteInfo } from '../domain';
import {
  TIPO_CONTRATO_LABELS,
  TIPO_COBRANCA_LABELS,
  STATUS_CONTRATO_LABELS,
  POLO_PROCESSUAL_LABELS,
} from '../domain';
import { getStatusVariant, getTipoContratoVariant, formatarData } from '../utils';

// =============================================================================
// TIPOS
// =============================================================================

interface ContratosTableProps {
  contratos: Contrato[];
  clientesMap: Map<number, ClienteInfo>;
  partesContrariasMap?: Map<number, ClienteInfo>;
  onEdit: (contrato: Contrato) => void;
  onView: (contrato: Contrato) => void;
  isLoading?: boolean;
  error?: string | null;
  pagination?: {
    pageIndex: number;
    pageSize: number;
    total: number;
    totalPages: number;
    onPageChange: (page: number) => void;
    onPageSizeChange: (size: number) => void;
  };
}

// =============================================================================
// COMPONENTES AUXILIARES
// =============================================================================

function ContratoActions({
  contrato,
  onEdit,
  onView,
}: {
  contrato: Contrato;
  onEdit: (contrato: Contrato) => void;
  onView: (contrato: Contrato) => void;
}) {
  return (
    <ButtonGroup>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => onView(contrato)}
          >
            <Eye className="h-4 w-4" />
            <span className="sr-only">Visualizar contrato</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent>Visualizar</TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => onEdit(contrato)}
          >
            <Pencil className="h-4 w-4" />
            <span className="sr-only">Editar contrato</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent>Editar</TooltipContent>
      </Tooltip>
    </ButtonGroup>
  );
}

// =============================================================================
// COLUNAS DA TABELA
// =============================================================================

function criarColunas(
  clientesMap: Map<number, ClienteInfo>,
  onEdit: (contrato: Contrato) => void,
  onView: (contrato: Contrato) => void
): ResponsiveTableColumn<Contrato>[] {
  return [
    {
      id: 'id',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="ID" />
      ),
      enableSorting: true,
      accessorKey: 'id',
      size: 80,
      priority: 1,
      sticky: true,
      cardLabel: 'ID',
      meta: { align: 'left' },
      cell: ({ row }) => {
        const contrato = row.original;
        return (
          <div className="min-h-10 flex items-center">
            <span className="text-sm font-medium text-muted-foreground">
              #{contrato.id}
            </span>
          </div>
        );
      },
    },
    {
      id: 'dataContratacao',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Data" />
      ),
      enableSorting: true,
      accessorKey: 'dataContratacao',
      size: 110,
      priority: 2,
      cardLabel: 'Data Contratação',
      meta: { align: 'left' },
      cell: ({ row }) => {
        const contrato = row.original;
        return (
          <div className="min-h-10 flex items-center">
            <span className="text-sm">
              {formatarData(contrato.dataContratacao)}
            </span>
          </div>
        );
      },
    },
    {
      id: 'cliente',
      header: () => (
        <div className="text-sm font-medium">Cliente</div>
      ),
      enableSorting: false,
      size: 200,
      priority: 3,
      cardLabel: 'Cliente',
      meta: { align: 'left' },
      cell: ({ row }) => {
        const contrato = row.original;
        const cliente = clientesMap.get(contrato.clienteId);
        return (
          <div className="min-h-10 flex flex-col justify-center">
            <span className="text-sm font-medium truncate">
              {cliente?.nome || `Cliente #${contrato.clienteId}`}
            </span>
            <span className="text-xs text-muted-foreground">
              {POLO_PROCESSUAL_LABELS[contrato.poloCliente]}
            </span>
          </div>
        );
      },
    },
    {
      id: 'tipoContrato',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Tipo" />
      ),
      enableSorting: true,
      accessorKey: 'tipoContrato',
      size: 130,
      priority: 5,
      cardLabel: 'Tipo de Contrato',
      meta: { align: 'left' },
      cell: ({ row }) => {
        const contrato = row.original;
        return (
          <div className="min-h-10 flex items-center">
            <Badge variant={getTipoContratoVariant(contrato.tipoContrato)}>
              {TIPO_CONTRATO_LABELS[contrato.tipoContrato]}
            </Badge>
          </div>
        );
      },
    },
    {
      id: 'tipoCobranca',
      header: () => (
        <div className="text-sm font-medium">Cobrança</div>
      ),
      enableSorting: false,
      size: 110,
      priority: 6,
      cardLabel: 'Tipo de Cobrança',
      meta: { align: 'left' },
      cell: ({ row }) => {
        const contrato = row.original;
        return (
          <div className="min-h-10 flex items-center">
            <span className="text-sm">
              {TIPO_COBRANCA_LABELS[contrato.tipoCobranca]}
            </span>
          </div>
        );
      },
    },
    {
      id: 'status',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Status" />
      ),
      enableSorting: true,
      accessorKey: 'status',
      size: 130,
      priority: 3,
      cardLabel: 'Status',
      meta: { align: 'left' },
      cell: ({ row }) => {
        const contrato = row.original;
        return (
          <div className="min-h-10 flex items-center">
            <Badge variant={getStatusVariant(contrato.status)}>
              {STATUS_CONTRATO_LABELS[contrato.status]}
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
      size: 100,
      priority: 7,
      cardLabel: 'Ações',
      cell: ({ row }) => {
        const contrato = row.original;
        return (
          <div className="min-h-10 flex items-center justify-center">
            <ContratoActions
              contrato={contrato}
              onEdit={onEdit}
              onView={onView}
            />
          </div>
        );
      },
    },
  ];
}

// =============================================================================
// COMPONENTE PRINCIPAL
// =============================================================================

export function ContratosTable({
  contratos,
  clientesMap,
  onEdit,
  onView,
  isLoading,
  error,
  pagination,
}: ContratosTableProps) {
  const colunas = React.useMemo(
    () => criarColunas(clientesMap, onEdit, onView),
    [clientesMap, onEdit, onView]
  );

  return (
    <ResponsiveTable
      data={contratos}
      columns={colunas}
      pagination={pagination}
      sorting={undefined}
      isLoading={isLoading}
      error={error}
      mobileLayout="cards"
      stickyFirstColumn={true}
      emptyMessage="Nenhum contrato encontrado."
      rowActions={[
        {
          label: 'Visualizar',
          icon: <Eye className="h-4 w-4" />,
          onClick: (row) => onView(row),
        },
        {
          label: 'Editar',
          icon: <Pencil className="h-4 w-4" />,
          onClick: (row) => onEdit(row),
        },
      ]}
    />
  );
}
