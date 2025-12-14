'use client';

import type { ColumnDef } from '@tanstack/react-table';
import { Pencil } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DataTableColumnHeader } from '@/components/shared/data-shell/data-table-column-header';
import type { TribunalConfigDb } from '@/features/captura';

type Params = {
  onEdit?: (tribunal: TribunalConfigDb) => void;
};

export function criarColunasTribunais({ onEdit }: Params): ColumnDef<TribunalConfigDb>[] {
  return [
    {
      accessorKey: 'tribunal_codigo',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Código" />,
      cell: ({ row }) => <Badge variant="outline">{row.original.tribunal_codigo}</Badge>,
    },
    {
      accessorKey: 'tribunal_nome',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Tribunal" />,
      cell: ({ row }) => <span className="text-sm">{row.original.tribunal_nome}</span>,
    },
    {
      accessorKey: 'tipo_acesso',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Acesso" />,
      cell: ({ row }) => <span className="text-sm">{row.original.tipo_acesso}</span>,
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


