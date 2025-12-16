'use client';

/**
 * CONTRATOS FEATURE - Definição de Colunas
 *
 * Colunas da tabela de contratos no padrão DataShell/TanStack Table.
 */

import * as React from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { DataTableColumnHeader } from '@/components/shared/data-shell';
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
// COMPONENTE DE AÇÕES
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
// FACTORY FUNCTION DE COLUNAS
// =============================================================================

export function getContratosColumns(
  clientesMap: Map<number, ClienteInfo>,
  onEdit: (contrato: Contrato) => void,
  onView: (contrato: Contrato) => void
): ColumnDef<Contrato>[] {
  return [
    {
      accessorKey: 'id',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="ID" />
      ),
      meta: {
        align: 'left',
        headerLabel: 'ID',
      },
      size: 80,
      enableSorting: true,
      cell: ({ row }) => {
        const contrato = row.original;
        return (
          <span className="text-sm font-medium text-muted-foreground">
            #{contrato.id}
          </span>
        );
      },
    },
    {
      accessorKey: 'dataContratacao',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Data" />
      ),
      meta: {
        align: 'left',
        headerLabel: 'Data Contratação',
      },
      size: 110,
      enableSorting: true,
      cell: ({ row }) => {
        const contrato = row.original;
        return (
          <span className="text-sm">
            {formatarData(contrato.dataContratacao)}
          </span>
        );
      },
    },
    {
      id: 'cliente',
      header: 'Cliente',
      meta: {
        align: 'left',
        headerLabel: 'Cliente',
      },
      size: 200,
      enableSorting: false,
      cell: ({ row }) => {
        const contrato = row.original;
        const cliente = clientesMap.get(contrato.clienteId);
        return (
          <div className="flex flex-col justify-center">
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
      accessorKey: 'tipoContrato',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Tipo" />
      ),
      meta: {
        align: 'left',
        headerLabel: 'Tipo de Contrato',
      },
      size: 130,
      enableSorting: true,
      cell: ({ row }) => {
        const contrato = row.original;
        return (
          <Badge variant={getTipoContratoVariant(contrato.tipoContrato)}>
            {TIPO_CONTRATO_LABELS[contrato.tipoContrato]}
          </Badge>
        );
      },
    },
    {
      accessorKey: 'tipoCobranca',
      header: 'Cobrança',
      meta: {
        align: 'left',
        headerLabel: 'Tipo de Cobrança',
      },
      size: 110,
      enableSorting: false,
      cell: ({ row }) => {
        const contrato = row.original;
        return (
          <span className="text-sm">
            {TIPO_COBRANCA_LABELS[contrato.tipoCobranca]}
          </span>
        );
      },
    },
    {
      accessorKey: 'status',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Status" />
      ),
      meta: {
        align: 'left',
        headerLabel: 'Status',
      },
      size: 130,
      enableSorting: true,
      cell: ({ row }) => {
        const contrato = row.original;
        return (
          <Badge variant={getStatusVariant(contrato.status)}>
            {STATUS_CONTRATO_LABELS[contrato.status]}
          </Badge>
        );
      },
    },
    {
      id: 'actions',
      header: 'Ações',
      meta: {
        align: 'center',
      },
      size: 100,
      enableSorting: false,
      enableHiding: false,
      cell: ({ row }) => {
        const contrato = row.original;
        return (
          <div className="flex items-center justify-center">
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
