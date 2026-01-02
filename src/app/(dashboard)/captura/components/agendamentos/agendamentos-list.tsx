'use client';

import * as React from 'react';
import type { ColumnDef, Table as TanstackTable } from '@tanstack/react-table';

import { DataShell, DataTable, DataTableToolbar } from '@/components/shared/data-shell';
import { DataTableColumnHeader } from '@/components/shared/data-shell/data-table-column-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { getSemanticBadgeVariant } from '@/lib/design-system';

import type { Agendamento } from '@/features/captura';

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
    case 'pericias':
      return 'Perícias';
    case 'combinada':
      return 'Captura unificada';
    default:
      return tipo;
  }
}

interface AgendamentosListProps {
  onNewClick?: () => void;
}

export function AgendamentosList({ onNewClick }: AgendamentosListProps) {
  const [data, setData] = React.useState<Agendamento[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [table, setTable] = React.useState<TanstackTable<Agendamento> | null>(null);

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
          <Badge variant="info">{formatTipoCaptura(row.original.tipo_captura)}</Badge>
        ),
        meta: { headerLabel: 'Tipo' },
      },
      {
        accessorKey: 'advogado_id',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Advogado ID" />
        ),
        cell: ({ row }) => <span className="text-sm">{row.original.advogado_id}</span>,
        meta: { headerLabel: 'Advogado ID' },
      },
      {
        accessorKey: 'horario',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Horário" />
        ),
        cell: ({ row }) => <span className="text-sm tabular-nums">{row.original.horario}</span>,
        meta: { headerLabel: 'Horário' },
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
        meta: { headerLabel: 'Próxima execução' },
      },
      {
        accessorKey: 'ativo',
        header: 'Status',
        cell: ({ row }) => (
          <Badge variant={getSemanticBadgeVariant('status', row.original.ativo ? 'ATIVO' : 'INATIVO')}>
            {row.original.ativo ? 'Ativo' : 'Inativo'}
          </Badge>
        ),
        meta: { headerLabel: 'Status' },
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
        meta: { headerLabel: 'Ações' },
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
    <DataShell
      header={
        table ? (
          <DataTableToolbar
            table={table}
            searchPlaceholder="Buscar agendamentos..."
            actionButton={
              onNewClick
                ? {
                    label: 'Novo Agendamento',
                    onClick: onNewClick,
                  }
                : undefined
            }
          />
        ) : (
          <div className="p-6" />
        )
      }
    >
      <div className="relative border-t">
        <DataTable
          data={data}
          columns={columns}
          isLoading={isLoading}
          error={error}
          emptyMessage="Nenhum agendamento encontrado."
          hideTableBorder
          hidePagination
          onTableReady={(t) => setTable(t as TanstackTable<Agendamento>)}
        />
      </div>
    </DataShell>
  );
}
