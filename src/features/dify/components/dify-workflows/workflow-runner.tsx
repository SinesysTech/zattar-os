'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { Play, Square, RotateCcw, CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { useDifyWorkflow } from '../../hooks/use-dify-workflow';
import { STATUS_EXECUCAO_LABELS, StatusExecucao } from '../../domain';

interface WorkflowRunnerProps {
  title?: string;
  description?: string;
  defaultInputs?: Record<string, unknown>;
  className?: string;
}

export function WorkflowRunner({
  title = 'Executar Workflow',
  description,
  defaultInputs,
  className,
}: WorkflowRunnerProps) {
  const [inputJson, setInputJson] = useState(
    defaultInputs ? JSON.stringify(defaultInputs, null, 2) : '{}'
  );

  const { result, isRunning, error, runWorkflow, reset } = useDifyWorkflow();

  const handleRun = async () => {
    try {
      const inputs = JSON.parse(inputJson);
      await runWorkflow(inputs);
    } catch {
      // JSON parse error handled by workflow hook
    }
  };

  const statusIcon = {
    [StatusExecucao.Running]: <Loader2 className="h-4 w-4 animate-spin" />,
    [StatusExecucao.Succeeded]: <CheckCircle2 className="h-4 w-4 text-green-500" />,
    [StatusExecucao.Failed]: <XCircle className="h-4 w-4 text-red-500" />,
    [StatusExecucao.Stopped]: <Square className="h-4 w-4 text-yellow-500" />,
  };

  return (
    <Card className={cn(className)}>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
        {description && <p className="text-sm text-muted-foreground">{description}</p>}
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Input */}
        <div>
          <label className="text-sm font-medium mb-1.5 block">
            Parâmetros de entrada (JSON)
          </label>
          <Textarea
            value={inputJson}
            onChange={(e) => setInputJson(e.target.value)}
            className="font-mono text-xs min-h-[100px]"
            disabled={isRunning}
          />
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <Button onClick={handleRun} disabled={isRunning}>
            {isRunning ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Executando...
              </>
            ) : (
              <>
                <Play className="h-4 w-4 mr-2" />
                Executar
              </>
            )}
          </Button>
          {result && (
            <Button variant="outline" onClick={reset}>
              <RotateCcw className="h-4 w-4 mr-2" />
              Limpar
            </Button>
          )}
        </div>

        {/* Error */}
        {error && (
          <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </div>
        )}

        {/* Result */}
        {result && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              {statusIcon[result.status]}
              <Badge variant="outline">
                {STATUS_EXECUCAO_LABELS[result.status]}
              </Badge>
              <span className="text-xs text-muted-foreground">
                {result.tempoDecorrido.toFixed(1)}s &middot;{' '}
                {result.totalTokens} tokens &middot;{' '}
                {result.totalPassos} passos
              </span>
            </div>

            {result.erro && (
              <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                {result.erro}
              </div>
            )}

            {Object.keys(result.outputs).length > 0 && (
              <div>
                <label className="text-sm font-medium mb-1.5 block">Resultado</label>
                <pre className="rounded-md bg-muted p-3 text-xs font-mono overflow-auto max-h-[300px]">
                  {JSON.stringify(result.outputs, null, 2)}
                </pre>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
