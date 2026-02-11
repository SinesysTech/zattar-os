'use client';

import * as React from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { MoreHorizontal, Pencil, Key, Trash2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import type { Advogado } from '@/features/advogados';

interface ColumnOptions {
  onEdit: (advogado: Advogado) => void;
  onDelete: (advogado: Advogado) => void;
  onViewCredenciais: (advogado: Advogado) => void;
}

export function criarColunasAdvogados({
  onEdit,
  onDelete,
  onViewCredenciais,
}: ColumnOptions): ColumnDef<Advogado>[] {
  return [
    {
      accessorKey: 'nome_completo',
      header: 'Nome',
      cell: ({ row }) => {
        return (
          <div className="font-medium">
            {row.original.nome_completo}
          </div>
        );
      },
      meta: { align: 'left' as const },
    },
    {
      accessorKey: 'cpf',
      header: 'CPF',
      cell: ({ row }) => {
        const cpf = row.original.cpf;
        // Formatar CPF: 000.000.000-00
        const formatted = cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
        return <span className="font-mono text-sm">{formatted}</span>;
      },
      meta: { align: 'left' as const },
    },
    {
      accessorKey: 'oab',
      header: 'OAB',
      cell: ({ row }) => {
        return (
          <div className="flex items-center gap-1">
            <span className="font-mono">{row.original.oab}</span>
            <Badge variant="outline" className="text-xs">
              {row.original.uf_oab}
            </Badge>
          </div>
        );
      },
      meta: { align: 'left' as const },
    },
    {
      accessorKey: 'uf_oab',
      header: 'UF',
      cell: ({ row }) => {
        return <Badge variant="secondary">{row.original.uf_oab}</Badge>;
      },
      meta: { align: 'left' as const },
    },
    {
      id: 'acoes',
      header: 'Ações',
      cell: ({ row }) => {
        const advogado = row.original;

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
                <span className="sr-only">Abrir menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit(advogado)}>
                <Pencil className="mr-2 h-4 w-4" />
                Editar
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onViewCredenciais(advogado)}>
                <Key className="mr-2 h-4 w-4" />
                Ver Credenciais
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => onDelete(advogado)}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Excluir
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
      meta: { align: 'left' as const },
    },
  ];
}
