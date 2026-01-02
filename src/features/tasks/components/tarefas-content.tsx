'use client';

import { useEffect, useState } from 'react';
import { DataShell, DataTableToolbar, DataTable } from '@/components/shared/data-shell';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { columns } from './tasks/columns';
import { actionListarTarefas } from '../actions/tarefas-actions';
import type { Tarefa } from '../domain';
import { mapStatusDBToFrontend, mapPrioridadeToFrontend } from '../domain';
import type { Task } from '../data/schema';
import type { Table as TanstackTable } from '@tanstack/react-table';

/**
 * Converte Tarefa do banco para Task do frontend
 */
function tarefaToTask(tarefa: Tarefa): Task {
  const status = mapStatusDBToFrontend(tarefa.status);
  const priority = mapPrioridadeToFrontend(tarefa.prioridade);
  
  // Mapear status para labels do frontend
  const statusMap: Record<string, string> = {
    todo: 'todo',
    'in-progress': 'in progress',
    done: 'done',
    canceled: 'canceled',
  };
  
  const labelMap: Record<string, string> = {
    todo: 'bug',
    'in-progress': 'feature',
    done: 'documentation',
    canceled: 'bug',
  };
  
  return {
    id: `TASK-${tarefa.id}`,
    title: tarefa.titulo,
    status: statusMap[status] || 'todo',
    label: labelMap[status] || 'bug',
    priority: priority as string, // 'low' | 'medium' | 'high' como string
  };
}

export function TarefasContent() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [table, setTable] = useState<TanstackTable<Task> | null>(null);

  useEffect(() => {
    async function loadTarefas() {
      try {
        setLoading(true);
        setError(null);
        const result = await actionListarTarefas({ pagina: 1, limite: 100 });
        
        if (result.success) {
          const tasksData = result.data.data.map(tarefaToTask);
          setTasks(tasksData);
        } else {
          setError('Erro ao carregar tarefas');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro ao carregar tarefas');
      } finally {
        setLoading(false);
      }
    }

    loadTarefas();
  }, []);

  if (loading) {
    return <div className="flex items-center justify-center h-64">Carregando tarefas...</div>;
  }

  if (error) {
    return <div className="flex items-center justify-center h-64 text-destructive">{error}</div>;
  }

  return (
    <DataShell
      header={
        table ? (
          <DataTableToolbar
            table={table}
            searchPlaceholder="Buscar tarefas..."
            actionButton={{
              label: 'Nova Tarefa',
              onClick: () => {
                // TODO: Implementar abertura de dialog para criar tarefa
                console.log('Abrir dialog de nova tarefa');
              },
            }}
          />
        ) : null
      }
    >
      <div className="relative border-t">
        <DataTable
          data={tasks}
          columns={columns}
          isLoading={loading}
          error={error || undefined}
          emptyMessage="Nenhuma tarefa encontrada."
          hideTableBorder
          hidePagination
          onTableReady={(t) => setTable(t as TanstackTable<Task>)}
        />
      </div>
    </DataShell>
  );
}
