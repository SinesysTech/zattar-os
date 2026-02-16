'use client';

import React, { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { Clock, Zap, Hash } from 'lucide-react';
import type { DifyExecucaoWorkflow } from '../../domain';
import { STATUS_EXECUCAO_LABELS, StatusExecucao } from '../../domain';

interface WorkflowHistoryProps {
  className?: string;
}

export function WorkflowHistory({ className }: WorkflowHistoryProps) {
  const [execucoes, setExecucoes] = useState<DifyExecucaoWorkflow[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const { actionListarExecucoesDify } = await import(
          '../../actions/workflow-actions'
        );
        const result = await actionListarExecucoesDify({ limite: 20, offset: 0 });

        if (result.success && result.data) {
          setExecucoes(result.data.data);
          setTotal(result.data.total);
        }
      } catch {
        // Silently fail
      } finally {
        setIsLoading(false);
      }
    }

    load();
  }, []);

  const statusVariant: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
    [StatusExecucao.Running]: 'secondary',
    [StatusExecucao.Succeeded]: 'default',
    [StatusExecucao.Failed]: 'destructive',
    [StatusExecucao.Stopped]: 'outline',
  };

  if (isLoading) {
    return (
      <Card className={cn(className)}>
        <CardHeader>
          <CardTitle className="text-base">Histórico de Execuções</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground">Carregando...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn(className)}>
      <CardHeader>
        <CardTitle className="text-base">
          Histórico de Execuções
          {total > 0 && (
            <span className="ml-2 text-xs text-muted-foreground font-normal">
              ({total} total)
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {execucoes.length === 0 ? (
          <div className="text-sm text-muted-foreground">
            Nenhuma execução encontrada
          </div>
        ) : (
          <div className="space-y-3">
            {execucoes.map((exec) => (
              <div
                key={exec.id}
                className="flex items-center justify-between rounded-md border p-3"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Badge variant={statusVariant[exec.status] || 'outline'}>
                      {STATUS_EXECUCAO_LABELS[exec.status as StatusExecucao] || exec.status}
                    </Badge>
                    <span className="text-xs text-muted-foreground font-mono">
                      {exec.workflowRunId.slice(0, 8)}...
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {exec.tempoDecorrido.toFixed(1)}s
                    </span>
                    <span className="flex items-center gap-1">
                      <Zap className="h-3 w-3" />
                      {exec.totalTokens} tokens
                    </span>
                    <span className="flex items-center gap-1">
                      <Hash className="h-3 w-3" />
                      {exec.totalPassos} passos
                    </span>
                  </div>
                </div>
                <div className="text-xs text-muted-foreground">
                  {new Date(exec.criadoEm * 1000).toLocaleString('pt-BR')}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
