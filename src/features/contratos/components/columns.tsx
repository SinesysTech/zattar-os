'use client';

/**
 * CONTRATOS FEATURE - Definição de Colunas
 *
 * Colunas da tabela de contratos no padrão DataShell/TanStack Table.
 */

import * as React from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import Link from 'next/link';
import { DataTableColumnHeader } from '@/components/shared/data-shell';
import { Button } from '@/components/ui/button';
import { AppBadge } from '@/components/ui/app-badge';
import { SemanticBadge } from '@/components/ui/semantic-badge';
import { ParteBadge } from '@/components/ui/parte-badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Eye, Pencil, MoreHorizontal, FileText } from 'lucide-react';
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
  onGerarPeca,
}: {
  contrato: Contrato;
  onEdit: (contrato: Contrato) => void;
  onView: (contrato: Contrato) => void;
  onGerarPeca: (contrato: Contrato) => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <MoreHorizontal className="h-4 w-4" />
          <span className="sr-only">Ações do contrato</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => onView(contrato)}>
          <Eye className="h-4 w-4 mr-2" />
          Visualizar
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onEdit(contrato)}>
          <Pencil className="h-4 w-4 mr-2" />
          Editar
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => onGerarPeca(contrato)}>
          <FileText className="h-4 w-4 mr-2" />
          Gerar Peça
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
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
  onView: (contrato: Contrato) => void,
  onGerarPeca: (contrato: Contrato) => void
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
        const statusAtual = contrato.statusHistorico?.[0] ?? null;
        const dataEstagio = statusAtual?.changedAt ?? contrato.updatedAt ?? contrato.cadastradoEm;
        const motivo = statusAtual?.reason ?? null;
        return (
          <div className="flex flex-col gap-1">
            <SemanticBadge category="status_contrato" value={contrato.status}>
              {STATUS_CONTRATO_LABELS[contrato.status]}
            </SemanticBadge>
            <span className="text-xs text-muted-foreground">{formatarData(dataEstagio)}</span>
            {motivo ? (
              <span className="text-xs text-muted-foreground truncate max-w-42.5">
                {motivo}
              </span>
            ) : null}
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

        const clienteNome = clientesMap.get(contrato.clienteId)?.nome || `Cliente #${contrato.clienteId}`;

        // Fallback importante: alguns contratos legados/importados podem não ter o cliente registrado em `contrato_partes`.
        // Nesse caso, usamos `cliente_id` como fonte de verdade para exibir o nome do cliente.
        const autoraNome = (() => {
          if (contrato.papelClienteNoContrato === 'autora') {
            return partesAutoras.length > 0 ? getParteNome(partesAutoras[0]) : clienteNome;
          }
          return partesAutoras.length > 0 ? getParteNome(partesAutoras[0]) : null;
        })();

        const reNome = (() => {
          if (contrato.papelClienteNoContrato === 're') {
            return partesRe.length > 0 ? getParteNome(partesRe[0]) : clienteNome;
          }
          return partesRe.length > 0 ? getParteNome(partesRe[0]) : null;
        })();
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
                <ParteBadge polo="ATIVO" className="text-xs px-1.5 py-0.5">
                  {autoraNome || '-'}
                  {autoraNome && partesAutoras.length > 1 && ` e outros (${partesAutoras.length})`}
                </ParteBadge>
              </div>
              <div className="flex items-center gap-1 text-xs leading-relaxed">
                <ParteBadge polo="PASSIVO" className="text-xs px-1.5 py-0.5">
                  {reNome || '-'}
                  {reNome && partesRe.length > 1 && ` e outros (${partesRe.length})`}
                </ParteBadge>
              </div>
            </div>
          </div>
        );
      },
    },
    {
      id: 'processos',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Processos" />
      ),
      meta: {
        align: 'left',
        headerLabel: 'Processos',
      },
      size: 220,
      enableSorting: false,
      cell: ({ row }) => {
        const contrato = row.original;
        const processos = contrato.processos ?? [];

        if (!processos.length) {
          return <span className="text-sm text-muted-foreground">-</span>;
        }

        const shown = processos.slice(0, 2);
        const remaining = processos.length - shown.length;

        return (
          <div className="flex flex-wrap items-center gap-1.5 max-w-[min(92vw,13.75rem)]">
            {shown.map((p) => {
              const numero = p.processo?.numeroProcesso ?? null;
              const label = numero || `Processo #${p.processoId}`;
              return (
                <Link key={p.id} href={`/processos/${p.processoId}`} className="inline-flex">
                  <AppBadge variant="outline" className="text-xs px-2 py-0">
                    {label}
                  </AppBadge>
                </Link>
              );
            })}
            {remaining > 0 ? (
              <AppBadge variant="outline" className="text-xs px-2 py-0 text-muted-foreground">
                +{remaining}
              </AppBadge>
            ) : null}
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
          <span className="text-sm text-muted-foreground truncate block max-w-50">
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
              onGerarPeca={onGerarPeca}
            />
          </div>
        );
      },
    },
  ];
}
