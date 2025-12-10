'use client';

import { ColumnDef } from '@tanstack/react-table';
import { DataTableColumnHeader } from '@/components/ui/data-table-column-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { User, Edit, Power } from 'lucide-react';
import type { Credencial } from '@/app/_lib/types/credenciais';

/**
 * Formata data ISO para formato brasileiro (DD/MM/YYYY)
 */
const formatarData = (dataISO: string | null | undefined): string => {
  if (!dataISO) return '-';
  try {
    const data = new Date(dataISO);
    // Verificar se a data é válida
    if (isNaN(data.getTime())) {
      return '-';
    }
    return data.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  } catch {
    return '-';
  }
};

/**
 * Formata o grau do tribunal
 */
const formatarGrau = (grau: string): string => {
  const graus: Record<string, string> = {
    primeiro_grau: '1º Grau',
    segundo_grau: '2º Grau',
    tribunal_superior: 'Tribunal Superior',
  };
  return graus[grau] || grau;
};

interface CredenciaisColumnsProps {
  onViewAdvogado: (credencial: Credencial) => void;
  onEdit: (credencial: Credencial) => void;
  onToggleStatus: (credencial: Credencial) => void;
}

/**
 * Cria as colunas da tabela de credenciais
 */
export function criarColunasCredenciais({
  onViewAdvogado,
  onEdit,
  onToggleStatus,
}: CredenciaisColumnsProps): ColumnDef<Credencial>[] {
  return [
    {
      accessorKey: 'advogado_nome',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Advogado" />
      ),
      enableSorting: true,
      cell: ({ row }) => {
        const credencial = row.original;
        return (
          <div className="flex flex-col">
            <span className="text-sm font-medium">{credencial.advogado_nome}</span>
            <span className="text-xs text-muted-foreground">
              OAB: {credencial.advogado_oab}/{credencial.advogado_uf_oab}
            </span>
          </div>
        );
      },
    },
    {
      accessorKey: 'advogado_cpf',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="CPF" />
      ),
      enableSorting: true,
      size: 140,
      cell: ({ row }) => (
        <div className="text-sm font-mono">{row.getValue('advogado_cpf')}</div>
      ),
    },
    {
      accessorKey: 'tribunal',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Tribunal" />
      ),
      enableSorting: true,
      size: 100,
      cell: ({ row }) => (
        <div className="text-sm font-semibold">{row.getValue('tribunal')}</div>
      ),
    },
    {
      accessorKey: 'grau',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Grau" />
      ),
      enableSorting: true,
      size: 100,
      cell: ({ row }) => (
        <div className="text-sm">{formatarGrau(row.getValue('grau'))}</div>
      ),
    },
    {
      accessorKey: 'active',
      header: ({ column }) => (
        <div className="flex items-center justify-center">
          <DataTableColumnHeader column={column} title="Status" />
        </div>
      ),
      enableSorting: true,
      size: 100,
      cell: ({ row }) => {
        const active = row.getValue('active') as boolean | null | undefined;
        const isActive = active === true;
        return (
          <div className="flex justify-center">
            <Badge tone={isActive ? 'success' : 'neutral'} variant={isActive ? 'soft' : 'outline'}>
              {isActive ? 'Ativo' : 'Inativo'}
            </Badge>
          </div>
        );
      },
    },
    {
      accessorKey: 'created_at',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Data Criação" />
      ),
      enableSorting: true,
      size: 120,
      cell: ({ row }) => (
        <div className="text-sm">{formatarData(row.getValue('created_at'))}</div>
      ),
    },
    {
      id: 'actions',
      header: () => <div className="text-center">Ações</div>,
      size: 180,
      cell: ({ row }) => {
        const credencial = row.original;
        return (
          <div className="flex items-center justify-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onViewAdvogado(credencial)}
              title="Ver Advogado"
            >
              <User className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEdit(credencial)}
              title="Editar Credencial"
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onToggleStatus(credencial)}
              title={credencial.active ? 'Desativar' : 'Ativar'}
            >
              <Power
                className={`h-4 w-4 ${credencial.active ? 'text-green-600' : 'text-gray-400'}`}
              />
            </Button>
          </div>
        );
      },
    },
  ];
}
