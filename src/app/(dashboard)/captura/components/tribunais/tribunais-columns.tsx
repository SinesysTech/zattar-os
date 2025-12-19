'use client';

import type { ColumnDef } from '@tanstack/react-table';
import { Pencil } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TribunalBadge } from '@/components/ui/tribunal-badge';
import { DataTableColumnHeader } from '@/components/shared/data-shell/data-table-column-header';
import { getSemanticBadgeVariant } from '@/lib/design-system';
import type { TribunalConfigDb } from '@/features/captura';

type Params = {
  onEdit?: (tribunal: TribunalConfigDb) => void;
};

const TIPO_ACESSO_LABELS: Record<string, string> = {
  primeiro_grau: '1º Grau',
  segundo_grau: '2º Grau',
  unico: 'Único',
};

export function criarColunasTribunais({ onEdit }: Params): ColumnDef<TribunalConfigDb>[] {
  return [
    {
      accessorKey: 'tribunal_codigo',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Código" />,
      cell: ({ row }) => <TribunalBadge codigo={row.original.tribunal_codigo} />,
    },
    {
      accessorKey: 'tribunal_nome',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Tribunal" />,
      cell: ({ row }) => <span className="text-sm">{row.original.tribunal_nome}</span>,
    },
    {
      accessorKey: 'tipo_acesso',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Acesso" />,
      cell: ({ row }) => (
        <Badge variant={getSemanticBadgeVariant('grau', row.original.tipo_acesso)}>
          {TIPO_ACESSO_LABELS[row.original.tipo_acesso] ?? row.original.tipo_acesso}
        </Badge>
      ),
    },
    {
      accessorKey: 'url_base',
      header: ({ column }) => <DataTableColumnHeader column={column} title="URL base" />,
      cell: ({ row }) => (
        <span className="text-sm truncate block max-w-[320px]" title={row.original.url_base}>
          {row.original.url_base}
        </span>
      ),
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <div className="flex justify-end">
          <Button variant="ghost" size="icon" onClick={() => onEdit?.(row.original)} aria-label="Editar">
            <Pencil className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];
}


