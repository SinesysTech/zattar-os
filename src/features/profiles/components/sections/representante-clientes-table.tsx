'use client';

import * as React from 'react';
import Link from 'next/link';
import { User, Building2 } from 'lucide-react';
import { ColumnDef } from '@tanstack/react-table';

import { DataTable } from '@/components/shared/data-shell/data-table';
import { SemanticBadge } from '@/components/ui/semantic-badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { ProfileData } from '../../configs/types';

interface ClienteVinculo {
  cliente_id: number;
  nome: string;
  cpf_cnpj?: string;
  tipo_pessoa?: 'pf' | 'pj';
  total_processos?: number;
  ultimo_processo?: string;
}

interface RepresentanteClientesTableProps {
  data: ProfileData;
  title?: string;
}

export function RepresentanteClientesTable({ data, title = 'Carteira de Clientes' }: RepresentanteClientesTableProps) {

  const clientes = React.useMemo(() => (data.clientes || []) as ClienteVinculo[], [data.clientes]);

  const columns = React.useMemo<ColumnDef<ClienteVinculo>[]>(
    () => [
      {
        accessorKey: 'nome',
        header: 'Nome',
        meta: { align: 'left' },
        cell: ({ row }) => {
          const cliente = row.original;
          const isPF = cliente.tipo_pessoa === 'pf';
          return (
            <Link
              href={`/app/partes/clientes/${cliente.cliente_id}`}
              className="text-primary hover:underline flex items-center gap-2"
              aria-label={`Ver detalhes de ${cliente.nome}`}
            >
              {isPF ? <User className="h-4 w-4" /> : <Building2 className="h-4 w-4" />}
              <span className="text-sm font-medium">{cliente.nome}</span>
            </Link>
          );
        },
      },
      {
        accessorKey: 'cpf_cnpj',
        header: 'CPF/CNPJ',
        meta: { align: 'left' },
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground font-mono">
            {row.original.cpf_cnpj || '-'}
          </span>
        ),
      },
      {
        accessorKey: 'tipo_pessoa',
        header: 'Tipo',
        meta: { align: 'center' },
        cell: ({ row }) => {
          const tipo = row.original.tipo_pessoa;
          if (!tipo) return '-';
          return (
            <SemanticBadge category="parte" value={tipo}>
              {tipo === 'pf' ? 'PF' : 'PJ'}
            </SemanticBadge>
          );
        },
      },
      {
        accessorKey: 'total_processos',
        header: 'Processos',
        meta: { align: 'center' },
        cell: ({ row }) => (
          <span className="text-sm font-medium text-foreground">
            {row.original.total_processos ?? 0}
          </span>
        ),
      },
      {
        accessorKey: 'ultimo_processo',
        header: 'Ultimo Processo',
        meta: { align: 'left' },
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground font-mono">
            {row.original.ultimo_processo || '-'}
          </span>
        ),
      },
    ],
    []
  );

  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Tabela */}
        <DataTable
          data={clientes}
          columns={columns}
          density="standard"
          striped={true}
          emptyMessage="Nenhum cliente vinculado a este representante."
          ariaLabel="Clientes do representante"
        />
      </CardContent>
    </Card>
  );
}
