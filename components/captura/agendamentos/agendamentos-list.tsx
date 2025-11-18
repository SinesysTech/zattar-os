'use client';

import * as React from 'react';
import { DataTable } from '@/components/data-table';
import { DataTableColumnHeader } from '@/components/data-table-column-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAgendamentos } from '@/lib/hooks/use-agendamentos';
import { deletarAgendamento, executarAgendamento } from '@/lib/api/agendamentos';
import type { ColumnDef } from '@tanstack/react-table';
import type { Agendamento, TipoCaptura } from '@/backend/types/captura/agendamentos-types';
import { Play, Pause, Trash2, Edit } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { atualizarAgendamento } from '@/lib/api/agendamentos';

/**
 * Formata data e hora ISO para formato brasileiro (DD/MM/YYYY HH:mm)
 */
const formatarDataHora = (dataISO: string | null): string => {
  if (!dataISO) return '-';
  try {
    const data = new Date(dataISO);
    return data.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '-';
  }
};

/**
 * Formata tipo de captura para exibição
 */
const formatarTipoCaptura = (tipo: TipoCaptura): string => {
  const tipos: Record<TipoCaptura, string> = {
    acervo_geral: 'Acervo Geral',
    arquivados: 'Arquivados',
    audiencias: 'Audiências',
    pendentes: 'Pendentes',
  };
  return tipos[tipo] || tipo;
};

/**
 * Formata periodicidade para exibição
 */
const formatarPeriodicidade = (periodicidade: string, diasIntervalo: number | null): string => {
  if (periodicidade === 'diario') {
    return 'Diário';
  } else if (periodicidade === 'a_cada_N_dias' && diasIntervalo) {
    return `A cada ${diasIntervalo} dia(s)`;
  }
  return periodicidade;
};

interface AgendamentosListProps {
  onEdit?: (agendamento: Agendamento) => void;
  onRefresh?: () => void;
}

export function AgendamentosList({ onEdit, onRefresh }: AgendamentosListProps) {
  const [pagina, setPagina] = React.useState(1);
  const [limite, setLimite] = React.useState(50);
  const { agendamentos, paginacao, isLoading, error, refetch } = useAgendamentos({
    pagina,
    limite,
    ordenar_por: 'proxima_execucao',
    ordem: 'asc',
  });

  const handleToggleAtivo = async (agendamento: Agendamento) => {
    try {
      await atualizarAgendamento(agendamento.id, {
        ativo: !agendamento.ativo,
      });
      refetch();
      if (onRefresh) onRefresh();
    } catch (error) {
      console.error('Erro ao atualizar agendamento:', error);
    }
  };

  const handleExecutar = async (agendamento: Agendamento) => {
    try {
      await executarAgendamento(agendamento.id);
      refetch();
      if (onRefresh) onRefresh();
    } catch (error) {
      console.error('Erro ao executar agendamento:', error);
    }
  };

  const handleDeletar = async (agendamento: Agendamento) => {
    try {
      await deletarAgendamento(agendamento.id);
      refetch();
      if (onRefresh) onRefresh();
    } catch (error) {
      console.error('Erro ao deletar agendamento:', error);
    }
  };

  const colunas: ColumnDef<Agendamento>[] = React.useMemo(
    () => [
      {
        accessorKey: 'id',
        header: ({ column }) => (
          <div className="flex items-center justify-center">
            <DataTableColumnHeader column={column} title="ID" />
          </div>
        ),
        size: 80,
        cell: ({ row }) => (
          <div className="text-center text-sm font-mono">{row.getValue('id')}</div>
        ),
      },
      {
        accessorKey: 'tipo_captura',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Tipo" />,
        size: 140,
        cell: ({ row }) => (
          <div className="text-sm">{formatarTipoCaptura(row.getValue('tipo_captura'))}</div>
        ),
      },
      {
        accessorKey: 'advogado_id',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Advogado ID" />
        ),
        size: 120,
        cell: ({ row }) => (
          <div className="text-sm text-center">
            #{row.getValue('advogado_id')}
          </div>
        ),
      },
      {
        accessorKey: 'periodicidade',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Periodicidade" />
        ),
        size: 150,
        cell: ({ row }) => {
          const periodicidade = row.getValue('periodicidade') as string;
          const diasIntervalo = row.original.dias_intervalo;
          return (
            <div className="text-sm">{formatarPeriodicidade(periodicidade, diasIntervalo)}</div>
          );
        },
      },
      {
        accessorKey: 'horario',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Horário" />
        ),
        size: 100,
        cell: ({ row }) => (
          <div className="text-sm">{row.getValue('horario')}</div>
        ),
      },
      {
        accessorKey: 'ativo',
        header: ({ column }) => (
          <div className="flex items-center justify-center">
            <DataTableColumnHeader column={column} title="Status" />
          </div>
        ),
        size: 100,
        cell: ({ row }) => (
          <div className="flex justify-center">
            <Badge variant={row.getValue('ativo') ? 'default' : 'secondary'}>
              {row.getValue('ativo') ? 'Ativo' : 'Inativo'}
            </Badge>
          </div>
        ),
      },
      {
        accessorKey: 'ultima_execucao',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Última Execução" />
        ),
        size: 180,
        cell: ({ row }) => (
          <div className="text-sm">{formatarDataHora(row.getValue('ultima_execucao'))}</div>
        ),
      },
      {
        accessorKey: 'proxima_execucao',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Próxima Execução" />
        ),
        size: 180,
        cell: ({ row }) => (
          <div className="text-sm font-medium">
            {formatarDataHora(row.getValue('proxima_execucao'))}
          </div>
        ),
      },
      {
        id: 'acoes',
        header: 'Ações',
        size: 200,
        cell: ({ row }) => {
          const agendamento = row.original;
          return (
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleToggleAtivo(agendamento)}
                title={agendamento.ativo ? 'Desativar' : 'Ativar'}
              >
                {agendamento.ativo ? (
                  <Pause className="h-4 w-4" />
                ) : (
                  <Play className="h-4 w-4" />
                )}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleExecutar(agendamento)}
                title="Executar agora"
              >
                <Play className="h-4 w-4" />
              </Button>
              {onEdit && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onEdit(agendamento)}
                  title="Editar"
                >
                  <Edit className="h-4 w-4" />
                </Button>
              )}
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="ghost" size="sm" title="Deletar">
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                    <AlertDialogDescription>
                      Tem certeza que deseja deletar este agendamento? Esta ação não pode ser desfeita.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => handleDeletar(agendamento)}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      Deletar
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          );
        },
      },
    ],
    [onEdit, refetch, onRefresh]
  );

  return (
    <DataTable
      data={agendamentos}
      columns={colunas}
      pagination={
        paginacao
          ? {
              pageIndex: paginacao.pagina - 1,
              pageSize: paginacao.limite,
              total: paginacao.total,
              totalPages: paginacao.totalPaginas,
              onPageChange: setPagina,
              onPageSizeChange: setLimite,
            }
          : undefined
      }
      sorting={undefined}
      isLoading={isLoading}
      error={error}
      emptyMessage="Nenhum agendamento encontrado."
    />
  );
}

