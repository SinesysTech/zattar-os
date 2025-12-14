'use client';

import * as React from 'react';
import type { ColumnDef } from '@tanstack/react-table';

import { DataShell, DataTable } from '@/components/shared/data-shell';
import { DataTableColumnHeader } from '@/components/shared/data-shell/data-table-column-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';

import type { Agendamento } from '@/features/captura/types/agendamentos-types';

type ApiOk = { success: true; data: { agendamentos: Agendamento[] } | { data: Agendamento[] } | Agendamento[] };

function isApiOk(value: unknown): value is ApiOk {
  return !!value && typeof value === 'object' && 'success' in value && (value as { success?: unknown }).success === true;
}

function extractAgendamentos(payload: ApiOk['data']): Agendamento[] {
  if (Array.isArray(payload)) return payload;
  if ('agendamentos' in payload && Array.isArray((payload as { agendamentos?: unknown }).agendamentos)) {
    return (payload as { agendamentos: Agendamento[] }).agendamentos;
  }
  if ('data' in payload && Array.isArray((payload as { data?: unknown }).data)) {
    return (payload as { data: Agendamento[] }).data;
  }
  return [];
}

function formatTipoCaptura(tipo: string): string {
  switch (tipo) {
    case 'acervo_geral':
      return 'Acervo geral';
    case 'arquivados':
      return 'Arquivados';
    case 'audiencias':
      return 'Audiências';
    case 'pendentes':
      return 'Pendentes';
    default:
      return tipo;
  }
}

export function AgendamentosList() {
  const [data, setData] = React.useState<Agendamento[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const fetchAgendamentos = React.useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/captura/agendamentos');
      if (!res.ok) throw new Error('Erro ao listar agendamentos');
      const json: unknown = await res.json();
      if (!isApiOk(json)) throw new Error('Resposta inválida ao listar agendamentos');

      const agendamentos = extractAgendamentos(json.data);
      setData(agendamentos);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Erro ao listar agendamentos';
      setError(msg);
      setData([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchAgendamentos();
  }, [fetchAgendamentos]);

  const columns = React.useMemo<ColumnDef<Agendamento>[]>(
    () => [
      {
        accessorKey: 'tipo_captura',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Tipo" />
        ),
        cell: ({ row }) => (
          <Badge variant="outline">{formatTipoCaptura(row.original.tipo_captura)}</Badge>
        ),
      },
      {
        accessorKey: 'advogado_id',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Advogado ID" />
        ),
        cell: ({ row }) => <span className="text-sm">{row.original.advogado_id}</span>,
      },
      {
        accessorKey: 'horario',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Horário" />
        ),
        cell: ({ row }) => <span className="text-sm tabular-nums">{row.original.horario}</span>,
      },
      {
        accessorKey: 'proxima_execucao',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Próxima execução" />
        ),
        cell: ({ row }) => (
          <span className="text-sm">
            {row.original.proxima_execucao ? new Date(row.original.proxima_execucao).toLocaleString('pt-BR') : '-'}
          </span>
        ),
      },
      {
        accessorKey: 'ativo',
        header: 'Status',
        cell: ({ row }) =>
          row.original.ativo ? (
            <Badge variant="success">Ativo</Badge>
          ) : (
            <Badge variant="neutral">Inativo</Badge>
          ),
      },
      {
        id: 'actions',
        header: '',
        cell: ({ row }) => (
          <div className="flex justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={async () => {
                try {
                  const res = await fetch(`/api/captura/agendamentos/${row.original.id}/executar`, { method: 'POST' });
                  if (!res.ok) throw new Error('Falha ao executar agendamento');
                  toast.success('Agendamento disparado');
                } catch (e) {
                  toast.error(e instanceof Error ? e.message : 'Erro ao executar agendamento');
                }
              }}
            >
              Executar
            </Button>
          </div>
        ),
      },
    ],
    []
  );

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <DataShell>
      <div className="relative border-t">
        <DataTable
          data={data}
          columns={columns}
          isLoading={isLoading}
          error={error}
          emptyMessage="Nenhum agendamento encontrado."
          hideTableBorder
          hidePagination
        />
      </div>
    </DataShell>
  );
}


