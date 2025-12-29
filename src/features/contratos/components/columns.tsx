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
import { AppBadge } from '@/components/ui/app-badge';
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
  usuariosMap: Map<number, ClienteInfo>,
  segmentosMap: Map<number, { nome: string }>,
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
      accessorKey: 'cadastradoEm',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Cadastro" />
      ),
      meta: {
        align: 'center',
        headerLabel: 'Cadastro',
      },
      size: 140,
      enableSorting: true,
      cell: ({ row }) => {
        const contrato = row.original;
        return (
          <div className="flex flex-col gap-1 items-center text-center">
            <span className="font-medium">{formatarData(contrato.cadastradoEm)}</span>
          </div>
        );
      },
    },
    {
      id: 'estagio',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Estágio" />
      ),
      meta: {
        align: 'left',
        headerLabel: 'Estágio',
      },
      size: 170,
      enableSorting: false,
      cell: ({ row }) => {
        const contrato = row.original;
        const dataEstagio = contrato.statusHistorico?.[0]?.changedAt ?? contrato.updatedAt ?? contrato.cadastradoEm;
        return (
          <div className="flex flex-col gap-1">
            <SemanticBadge category="status_contrato" value={contrato.status}>
              {STATUS_CONTRATO_LABELS[contrato.status]}
            </SemanticBadge>
            <span className="text-xs text-muted-foreground">{formatarData(dataEstagio)}</span>
          </div>
        );
      },
    },
    {
      id: 'partes',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Partes" />
      ),
      meta: {
        align: 'left',
        headerLabel: 'Partes',
      },
      size: 360,
      enableSorting: false,
      cell: ({ row }) => {
        const contrato = row.original;
        const partesAutoras = (contrato.partes ?? []).filter((p) => p.papelContratual === 'autora');
        const partesRe = (contrato.partes ?? []).filter((p) => p.papelContratual === 're');

        const autoraNome = partesAutoras.length > 0 ? getParteNome(partesAutoras[0]) : null;
        const reNome = partesRe.length > 0 ? getParteNome(partesRe[0]) : null;
        const segmentoNome = contrato.segmentoId
          ? segmentosMap.get(contrato.segmentoId)?.nome
          : null;

        return (
          <div className="min-h-10 flex flex-col items-start justify-center gap-1.5 max-w-[min(92vw,23.75rem)]">
            <div className="flex items-center gap-1.5 flex-wrap">
              <SemanticBadge category="tipo_contrato" value={contrato.tipoContrato} className="text-xs">
                {TIPO_CONTRATO_LABELS[contrato.tipoContrato]}
              </SemanticBadge>
              <SemanticBadge category="tipo_cobranca" value={contrato.tipoCobranca} className="text-xs">
                {TIPO_COBRANCA_LABELS[contrato.tipoCobranca]}
              </SemanticBadge>
              {segmentoNome && (
                <AppBadge variant="outline" className="text-xs px-2 py-0">
                  {segmentoNome}
                </AppBadge>
              )}
            </div>

            <div className="flex flex-col gap-0.5">
              <div className="flex items-center gap-1 text-xs leading-relaxed">
                <AppBadge variant="success" className="text-xs px-1.5 py-0" tone="soft">
                  {autoraNome || '-'}
                  {autoraNome && partesAutoras.length > 1 && ` e outros (${partesAutoras.length})`}
                </AppBadge>
              </div>
              <div className="flex items-center gap-1 text-xs leading-relaxed">
                <AppBadge variant="destructive" className="text-xs px-1.5 py-0" tone="soft">
                  {reNome || '-'}
                  {reNome && partesRe.length > 1 && ` e outros (${partesRe.length})`}
                </AppBadge>
              </div>
            </div>
          </div>
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
      size: 180,
      enableSorting: true,
      cell: ({ row }) => {
        const contrato = row.original;
        const nome = contrato.responsavelId
          ? usuariosMap.get(contrato.responsavelId)?.nome
          : null;
        return (
          <span className="text-sm text-muted-foreground">
            {nome || (contrato.responsavelId ? `Usuário #${contrato.responsavelId}` : '-')}
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
