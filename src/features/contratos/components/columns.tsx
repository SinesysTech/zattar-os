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
import { SemanticBadge } from '@/components/ui/semantic-badge';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Eye, Pencil } from 'lucide-react';
import type { Contrato } from '../domain';
import type { ClienteInfo } from '../types';
import {
  TIPO_CONTRATO_LABELS,
  TIPO_COBRANCA_LABELS,
  STATUS_CONTRATO_LABELS,
} from '../domain';
import { formatarData } from '../utils';

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
          <SemanticBadge category="status_contrato" value={contrato.status}>
            {STATUS_CONTRATO_LABELS[contrato.status]}
          </SemanticBadge>
        );
      },
    },
    {
      id: 'detalhes',
      header: 'Detalhes',
      meta: {
        align: 'center',
        headerLabel: 'Detalhes',
      },
      size: 300,
      enableSorting: false,
      cell: ({ row }) => {
        const contrato = row.original;
        const parteAutoraNome = contrato.parteAutora && contrato.parteAutora.length > 0
          ? contrato.parteAutora[0].nome
          : null;
        const parteReNome = contrato.parteRe && contrato.parteRe.length > 0
          ? contrato.parteRe[0].nome
          : null;

        return (
          <div className="flex flex-col items-center justify-center gap-1.5">
            {/* Primeira linha: Tipo de Contrato e Tipo de Cobrança */}
            <div className="flex items-center gap-1.5 flex-wrap justify-center">
              <SemanticBadge category="tipo_contrato" value={contrato.tipoContrato} className="text-xs">
                {TIPO_CONTRATO_LABELS[contrato.tipoContrato]}
              </SemanticBadge>
              <SemanticBadge category="tipo_cobranca" value={contrato.tipoCobranca} className="text-xs">
                {TIPO_COBRANCA_LABELS[contrato.tipoCobranca]}
              </SemanticBadge>
            </div>

            {/* Segunda linha: Parte Autora */}
            {parteAutoraNome && (
              <Badge variant="success" className="text-xs">
                {parteAutoraNome}
                {contrato.qtdeParteAutora > 1 && ` e outros (${contrato.qtdeParteAutora})`}
              </Badge>
            )}

            {/* Terceira linha: Parte Ré */}
            {parteReNome && (
              <Badge variant="destructive" className="text-xs">
                {parteReNome}
                {contrato.qtdeParteRe > 1 && ` e outros (${contrato.qtdeParteRe})`}
              </Badge>
            )}
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
          <SemanticBadge category="tipo_contrato" value={contrato.tipoContrato}>
            {TIPO_CONTRATO_LABELS[contrato.tipoContrato]}
          </SemanticBadge>
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
          <SemanticBadge category="tipo_cobranca" value={contrato.tipoCobranca}>
            {TIPO_COBRANCA_LABELS[contrato.tipoCobranca]}
          </SemanticBadge>
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
    {
      accessorKey: 'segmentoId',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Segmento" />
      ),
      meta: {
        align: 'left',
        headerLabel: 'Segmento',
      },
      size: 120,
      enableSorting: true,
      cell: ({ row }) => {
        const contrato = row.original;
        return (
          <span className="text-sm text-muted-foreground">
            {contrato.segmentoId ? `#${contrato.segmentoId}` : '-'}
          </span>
        );
      },
    },
    {
      accessorKey: 'dataAssinatura',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Data Assinatura" />
      ),
      meta: {
        align: 'left',
        headerLabel: 'Data Assinatura',
      },
      size: 130,
      enableSorting: true,
      cell: ({ row }) => {
        const contrato = row.original;
        return (
          <span className="text-sm">
            {contrato.dataAssinatura ? formatarData(contrato.dataAssinatura) : '-'}
          </span>
        );
      },
    },
    {
      accessorKey: 'dataDistribuicao',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Data Distribuição" />
      ),
      meta: {
        align: 'left',
        headerLabel: 'Data Distribuição',
      },
      size: 140,
      enableSorting: true,
      cell: ({ row }) => {
        const contrato = row.original;
        return (
          <span className="text-sm">
            {contrato.dataDistribuicao ? formatarData(contrato.dataDistribuicao) : '-'}
          </span>
        );
      },
    },
    {
      accessorKey: 'dataDesistencia',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Data Desistência" />
      ),
      meta: {
        align: 'left',
        headerLabel: 'Data Desistência',
      },
      size: 140,
      enableSorting: true,
      cell: ({ row }) => {
        const contrato = row.original;
        return (
          <span className="text-sm">
            {contrato.dataDesistencia ? formatarData(contrato.dataDesistencia) : '-'}
          </span>
        );
      },
    },
    {
      accessorKey: 'responsavelId',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Responsável" />
      ),
      meta: {
        align: 'left',
        headerLabel: 'Responsável',
      },
      size: 120,
      enableSorting: true,
      cell: ({ row }) => {
        const contrato = row.original;
        return (
          <span className="text-sm text-muted-foreground">
            {contrato.responsavelId ? `#${contrato.responsavelId}` : '-'}
          </span>
        );
      },
    },
    {
      accessorKey: 'observacoes',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Observações" />
      ),
      meta: {
        align: 'left',
        headerLabel: 'Observações',
      },
      size: 200,
      enableSorting: false,
      cell: ({ row }) => {
        const contrato = row.original;
        return (
          <span className="text-sm text-muted-foreground truncate block max-w-[200px]">
            {contrato.observacoes || '-'}
          </span>
        );
      },
    },
    {
      accessorKey: 'createdAt',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Criado em" />
      ),
      meta: {
        align: 'left',
        headerLabel: 'Criado em',
      },
      size: 150,
      enableSorting: true,
      cell: ({ row }) => {
        const contrato = row.original;
        return (
          <span className="text-sm text-muted-foreground">
            {formatarData(contrato.createdAt)}
          </span>
        );
      },
    },
    {
      accessorKey: 'updatedAt',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Atualizado em" />
      ),
      meta: {
        align: 'left',
        headerLabel: 'Atualizado em',
      },
      size: 150,
      enableSorting: true,
      cell: ({ row }) => {
        const contrato = row.original;
        return (
          <span className="text-sm text-muted-foreground">
            {formatarData(contrato.updatedAt)}
          </span>
        );
      },
    },
  ];
}
