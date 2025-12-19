'use client';

import * as React from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { Eye, Pencil, Power } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TribunalBadge } from '@/components/ui/tribunal-badge';
import { DataTableColumnHeader } from '@/components/shared/data-shell/data-table-column-header';
import { getSemanticBadgeVariant, GRAU_LABELS } from '@/lib/design-system';
import type { Credencial } from '@/features/captura/types';

type Params = {
  onViewAdvogado?: (credencial: Credencial) => void;
  onEdit?: (credencial: Credencial) => void;
  onToggleStatus?: (credencial: Credencial) => void;
};

export function criarColunasCredenciais({ onViewAdvogado, onEdit, onToggleStatus }: Params): ColumnDef<Credencial>[] {
  return [
    {
      accessorKey: 'advogado_nome',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Advogado" />,
      cell: ({ row }) => (
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">{row.original.advogado_nome}</p>
          <p className="truncate text-xs text-muted-foreground">
            {row.original.advogado_oab}/{row.original.advogado_uf_oab} • CPF {row.original.advogado_cpf}
          </p>
        </div>
      ),
    },
    {
      accessorKey: 'tribunal',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Tribunal" />,
      cell: ({ row }) => <TribunalBadge codigo={row.original.tribunal} />,
    },
    {
      accessorKey: 'grau',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Grau" />,
      cell: ({ row }) => (
        <Badge variant={getSemanticBadgeVariant('grau', row.original.grau)}>
          {GRAU_LABELS[row.original.grau] ?? row.original.grau}
        </Badge>
      ),
    },
    {
      accessorKey: 'active',
      header: 'Status',
      cell: ({ row }) => (
        <Badge variant={getSemanticBadgeVariant('status', row.original.active ? 'ATIVO' : 'INATIVO')}>
          {row.original.active ? 'Ativa' : 'Inativa'}
        </Badge>
      ),
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <div className="flex justify-end gap-1">
          <Button variant="ghost" size="icon" onClick={() => onViewAdvogado?.(row.original)} aria-label="Ver advogado">
            <Eye className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => onEdit?.(row.original)} aria-label="Editar credencial">
            <Pencil className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => onToggleStatus?.(row.original)} aria-label="Ativar/desativar">
            <Power className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];
}


