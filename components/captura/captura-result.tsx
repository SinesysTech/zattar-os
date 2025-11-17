'use client';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { CheckCircle2, XCircle } from 'lucide-react';

interface CapturaResultProps {
  success: boolean | null;
  error?: string;
  data?: {
    total?: number;
    processos?: unknown[];
    audiencias?: unknown[];
    persistencia?: {
      total: number;
      atualizados: number;
      erros: number;
      orgaosJulgadoresCriados?: number;
    };
    dataInicio?: string;
    dataFim?: string;
    filtroPrazo?: string;
  };
}

/**
 * Componente para exibir resultados de captura
 */
export function CapturaResult({ success, error, data }: CapturaResultProps) {
  if (success === null) {
    return null;
  }

  if (!success) {
    return (
      <Alert variant="destructive">
        <XCircle className="h-4 w-4" />
        <AlertTitle>Erro na Captura</AlertTitle>
        <AlertDescription>{error || 'Erro desconhecido'}</AlertDescription>
      </Alert>
    );
  }

  return (
    <Alert className="border-green-500 bg-green-50 dark:bg-green-950">
      <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
      <AlertTitle className="text-green-800 dark:text-green-200">
        Captura Realizada com Sucesso
      </AlertTitle>
      <AlertDescription className="text-green-700 dark:text-green-300">
        <div className="mt-2 space-y-2">
          {data?.total !== undefined && (
            <p>
              <strong>Total capturado:</strong> {data.total}
            </p>
          )}
          {data?.persistencia && (
            <div className="mt-3 space-y-1 text-sm">
              <p>
                <strong>Persistência:</strong>
              </p>
              <ul className="list-inside list-disc space-y-1">
                <li>Total processado: {data.persistencia.total}</li>
                <li>Atualizados: {data.persistencia.atualizados}</li>
                {data.persistencia.erros > 0 && (
                  <li className="text-orange-600 dark:text-orange-400">
                    Erros: {data.persistencia.erros}
                  </li>
                )}
                {data.persistencia.orgaosJulgadoresCriados !== undefined && (
                  <li>Órgãos julgadores criados: {data.persistencia.orgaosJulgadoresCriados}</li>
                )}
              </ul>
            </div>
          )}
          {data?.dataInicio && data?.dataFim && (
            <p className="mt-2 text-sm">
              <strong>Período:</strong> {new Date(data.dataInicio).toLocaleDateString('pt-BR')} até{' '}
              {new Date(data.dataFim).toLocaleDateString('pt-BR')}
            </p>
          )}
          {data?.filtroPrazo && (
            <p className="mt-2 text-sm">
              <strong>Filtro de prazo:</strong> {data.filtroPrazo === 'no_prazo' ? 'No Prazo' : 'Sem Prazo'}
            </p>
          )}
        </div>
      </AlertDescription>
    </Alert>
  );
}

