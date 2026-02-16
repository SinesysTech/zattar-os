'use client';

import { useState, useCallback } from 'react';
import type { DifyExecucaoWorkflow } from '../domain';

interface WorkflowNodeProgress {
  nodeId: string;
  title: string;
  status: string;
  outputs?: Record<string, unknown>;
}

interface UseDifyWorkflowReturn {
  result: DifyExecucaoWorkflow | null;
  isRunning: boolean;
  error: string | null;
  progress: WorkflowNodeProgress[];
  runWorkflow: (inputs: Record<string, unknown>) => Promise<void>;
  reset: () => void;
}

/**
 * Hook para executar workflows Dify.
 * Usa a Server Action para execução blocking.
 */
export function useDifyWorkflow(): UseDifyWorkflowReturn {
  const [result, setResult] = useState<DifyExecucaoWorkflow | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<WorkflowNodeProgress[]>([]);

  const runWorkflow = useCallback(async (inputs: Record<string, unknown>) => {
    setError(null);
    setIsRunning(true);
    setResult(null);
    setProgress([]);

    try {
      const { actionExecutarWorkflowDify } = await import(
        '../actions/workflow-actions'
      );

      const actionResult = await actionExecutarWorkflowDify({ inputs });

      if (!actionResult.success) {
        throw new Error(actionResult.error || 'Erro ao executar workflow');
      }

      setResult(actionResult.data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(errorMessage);
    } finally {
      setIsRunning(false);
    }
  }, []);

  const reset = useCallback(() => {
    setResult(null);
    setError(null);
    setProgress([]);
    setIsRunning(false);
  }, []);

  return {
    result,
    isRunning,
    error,
    progress,
    runWorkflow,
    reset,
  };
}
