'use client';

import { ColumnDef } from '@tanstack/react-table';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Eye, Pencil } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { ButtonGroup } from '@/components/ui/button-group';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { DataTableColumnHeader } from '@/components/shared/data-shell/data-table-column-header';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

import type { Audiencia } from '../domain';
import { GRAU_TRIBUNAL_LABELS } from '../domain';
import { AudienciaStatusBadge } from './audiencia-status-badge';
import { AudienciaModalidadeBadge } from './audiencia-modalidade-badge';

// Types
export interface AudienciaComResponsavel extends Audiencia {
  responsavelNome?: string | null;
  responsavelAvatar?: string | null;
}

// Actions Component
function AudienciaActions({
  audiencia,
  onView,
  onEdit,
}: {
  audiencia: AudienciaComResponsavel;
  onView: (audiencia: AudienciaComResponsavel) => void;
  onEdit: (audiencia: AudienciaComResponsavel) => void;
}) {
  return (
    <ButtonGroup>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => onView(audiencia)}
          >
            <Eye className="h-4 w-4" />
            <span className="sr-only">Visualizar audiência</span>
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
            onClick={() => onEdit(audiencia)}
          >
            <Pencil className="h-4 w-4" />
            <span className="sr-only">Editar audiência</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent>Editar</TooltipContent>
      </Tooltip>
    </ButtonGroup>
  );
}

// Helper functions
function formatarDataHora(dataISO: string): string {
  try {
    const data = new Date(dataISO);
    return format(data, 'dd/MM/yyyy HH:mm', { locale: ptBR });
  } catch {
    return '-';
  }
}

function getInitials(name: string | null | undefined): string {
  if (!name) return 'SR';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

// Factory function for columns
export function getAudienciasColumns(
  onView: (audiencia: AudienciaComResponsavel) => void,
  onEdit: (audiencia: AudienciaComResponsavel) => void
): ColumnDef<AudienciaComResponsavel>[] {
  return [
    {
      accessorKey: 'dataInicio',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Data/Hora" />
      ),
      meta: {
        align: 'left' as const,
        headerLabel: 'Data/Hora',
      },
      size: 160,
      cell: ({ row }) => {
        const audiencia = row.original;
        return (
          <div className="flex flex-col gap-1">
            <span className="font-medium">
              {formatarDataHora(audiencia.dataInicio)}
            </span>
            {audiencia.status && (
              <AudienciaStatusBadge status={audiencia.status} />
            )}
          </div>
        );
      },
      enableSorting: true,
    },
    {
      accessorKey: 'numeroProcesso',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Processo" />
      ),
      meta: {
        align: 'left' as const,
        headerLabel: 'Processo',
      },
      size: 200,
      cell: ({ row }) => {
        const audiencia = row.original;
        const grauLabel = GRAU_TRIBUNAL_LABELS[audiencia.grau] || audiencia.grau;
        return (
          <div className="flex flex-col">
            <span className="font-medium">{audiencia.numeroProcesso}</span>
            <span className="text-xs text-muted-foreground">
              {audiencia.trt} - {grauLabel}
            </span>
          </div>
        );
      },
      enableSorting: true,
    },
    {
      accessorKey: 'tipoDescricao',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Tipo" />
      ),
      meta: {
        align: 'left' as const,
        headerLabel: 'Tipo',
      },
      size: 180,
      cell: ({ row }) => {
        const audiencia = row.original;
        return (
          <span className="text-sm">
            {audiencia.tipoDescricao || 'Não informado'}
          </span>
        );
      },
      enableSorting: true,
    },
    {
      id: 'partes',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Partes" />
      ),
      meta: {
        align: 'left' as const,
        headerLabel: 'Partes',
      },
      size: 220,
      cell: ({ row }) => {
        const audiencia = row.original;
        return (
          <div className="flex flex-col">
            <span className="text-sm truncate max-w-[200px]" title={audiencia.poloAtivoNome || undefined}>
              {audiencia.poloAtivoNome || 'Não informado'}
            </span>
            <span className="text-xs text-muted-foreground truncate max-w-[200px]" title={audiencia.poloPassivoNome || undefined}>
              vs {audiencia.poloPassivoNome || 'Não informado'}
            </span>
          </div>
        );
      },
      enableSorting: false,
    },
    {
      accessorKey: 'modalidade',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Modalidade" />
      ),
      meta: {
        align: 'center' as const,
        headerLabel: 'Modalidade',
      },
      size: 120,
      cell: ({ row }) => {
        const audiencia = row.original;
        return audiencia.modalidade ? (
          <div className="flex justify-center">
            <AudienciaModalidadeBadge modalidade={audiencia.modalidade} />
          </div>
        ) : (
          <span className="text-muted-foreground text-sm">-</span>
        );
      },
      enableSorting: true,
    },
    {
      id: 'responsavel',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Responsável" />
      ),
      meta: {
        align: 'left' as const,
        headerLabel: 'Responsável',
      },
      size: 180,
      cell: ({ row }) => {
        const audiencia = row.original;
        const nome = audiencia.responsavelNome;

        if (!audiencia.responsavelId) {
          return (
            <span className="text-muted-foreground text-sm">
              Sem responsável
            </span>
          );
        }

        return (
          <div className="flex items-center gap-2">
            <Avatar className="h-7 w-7">
              <AvatarFallback className="text-xs">
                {getInitials(nome)}
              </AvatarFallback>
            </Avatar>
            <span className="text-sm truncate max-w-[120px]" title={nome || undefined}>
              {nome || `Usuário ${audiencia.responsavelId}`}
            </span>
          </div>
        );
      },
      enableSorting: false,
    },
    {
      id: 'actions',
      header: 'Ações',
      meta: {
        align: 'center' as const,
        headerLabel: 'Ações',
      },
      size: 100,
      cell: ({ row }) => (
        <div className="flex items-center justify-center">
          <AudienciaActions
            audiencia={row.original}
            onView={onView}
            onEdit={onEdit}
          />
        </div>
      ),
      enableSorting: false,
      enableHiding: false,
    },
  ];
}
