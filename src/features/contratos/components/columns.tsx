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
  partesContrariasMap: Map<number, ClienteInfo>,
  onEdit: (contrato: Contrato) => void,
  onView: (contrato: Contrato) => void
): ColumnDef<Contrato>[] {
  const getParteNome = (parte: { tipoEntidade: string; entidadeId: number; nomeSnapshot?: string | null }) => {
    if (parte.nomeSnapshot) return parte.nomeSnapshot;
    if (parte.tipoEntidade === 'cliente') {
      return clientesMap.get(parte.entidadeId)?.nome || `Cliente #${parte.entidadeId}`;
    }
    if (parte.tipoEntidade === 'parte_contraria') {
      return partesContrariasMap.get(parte.entidadeId)?.nome || `Parte Contrária #${parte.entidadeId}`;
    }
    return `Entidade #${parte.entidadeId}`;
  };

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
      accessorKey: 'cadastradoEm',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Data" />
      ),
      meta: {
        align: 'left',
        headerLabel: 'Cadastrado em',
      },
      size: 110,
      enableSorting: true,
      cell: ({ row }) => {
        const contrato = row.original;
        return (
          <span className="text-sm">
            {formatarData(contrato.cadastradoEm)}
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
        const partesAutoras = (contrato.partes ?? []).filter((p) => p.papelContratual === 'autora');
        const partesRe = (contrato.partes ?? []).filter((p) => p.papelContratual === 're');
        const parteAutoraNome = partesAutoras.length > 0 ? getParteNome(partesAutoras[0]) : null;
        const parteReNome = partesRe.length > 0 ? getParteNome(partesRe[0]) : null;

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
                {partesAutoras.length > 1 && ` e outros (${partesAutoras.length})`}
              </Badge>
            )}

            {/* Terceira linha: Parte Ré */}
            {parteReNome && (
              <Badge variant="destructive" className="text-xs">
                {parteReNome}
                {partesRe.length > 1 && ` e outros (${partesRe.length})`}
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
