/**
 * RecoverySection - Seção de recuperação de dados do MongoDB
 *
 * Exibe lista de logs MongoDB associados a uma captura PostgreSQL,
 * permitindo análise de gaps e re-processamento de elementos.
 */

'use client';

import { useState } from 'react';
import { Database, AlertCircle, Loader2, ChevronRight, RefreshCw, CheckCircle2, XCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { useRecoveryLogs } from '@/app/_lib/hooks/use-recovery-logs';
import { RecoveryGapsAnalysis } from './recovery-gaps-analysis';

interface RecoverySectionProps {
  capturaLogId: number;
}

const formatarData = (dataISO: string | Date): string => {
  try {
    const data = dataISO instanceof Date ? dataISO : new Date(dataISO);
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

const StatusLogBadge = ({ status }: { status: 'success' | 'error' }) => {
  if (status === 'success') {
    return (
      <Badge tone="success" variant="soft" className="gap-1">
        <CheckCircle2 className="h-3 w-3" />
        Sucesso
      </Badge>
    );
  }
  return (
    <Badge tone="danger" variant="soft" className="gap-1">
      <XCircle className="h-3 w-3" />
      Erro
    </Badge>
  );
};

export function RecoverySection({ capturaLogId }: RecoverySectionProps) {
  const [selectedLogId, setSelectedLogId] = useState<string | null>(null);
  const { logs, paginacao, isLoading, error, refetch } = useRecoveryLogs({
    capturaLogId,
    limite: 50,
  });

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <Skeleton className="h-5 w-48" />
            <Skeleton className="h-4 w-64" />
          </CardHeader>
          <CardContent className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-20 w-full" />
            ))}
          </CardContent>
        </Card>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Erro ao carregar logs MongoDB</AlertTitle>
        <AlertDescription className="flex items-center justify-between">
          <span>{error}</span>
          <Button variant="outline" size="sm" onClick={refetch} className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Tentar Novamente
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  // Empty state
  if (logs.length === 0) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="flex flex-col items-center justify-center text-center gap-4">
            <div className="rounded-full bg-muted p-4">
              <Database className="h-8 w-8 text-muted-foreground" />
            </div>
            <div>
              <h3 className="text-lg font-medium">Nenhum log encontrado</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Não há logs do MongoDB associados a esta captura.
              </p>
            </div>
            <Button variant="outline" onClick={refetch} className="gap-2">
              <RefreshCw className="h-4 w-4" />
              Atualizar
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Se um log está selecionado, mostra a análise de gaps
  if (selectedLogId) {
    return (
      <div className="space-y-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setSelectedLogId(null)}
          className="gap-2"
        >
          ← Voltar para lista de logs
        </Button>
        <RecoveryGapsAnalysis
          mongoId={selectedLogId}
          onClose={() => setSelectedLogId(null)}
        />
      </div>
    );
  }

  // Lista de logs
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-sm flex items-center gap-2">
              <Database className="h-4 w-4" />
              Logs MongoDB
            </CardTitle>
            <CardDescription>
              {paginacao?.total || logs.length} log(s) encontrado(s) para esta captura
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={refetch} className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Atualizar
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          {logs.map((log) => (
            <div
              key={log.mongoId}
              className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
              onClick={() => setSelectedLogId(log.mongoId)}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-2">
                  <StatusLogBadge status={log.status} />
                  <Badge variant="outline" className="font-mono text-xs">
                    {log.trt} • {log.grau === 'primeiro_grau' ? '1º Grau' : '2º Grau'}
                  </Badge>
                  {log.numeroProcesso && (
                    <span className="text-sm font-mono text-muted-foreground truncate">
                      {log.numeroProcesso}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span>Criado em: {formatarData(log.criadoEm)}</span>
                  <span className="font-mono">{log.mongoId.slice(0, 8)}...</span>
                </div>
                {log.erro && (
                  <p className="text-xs text-destructive mt-2 truncate">
                    Erro: {log.erro}
                  </p>
                )}
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground flex-shrink-0" />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Estatísticas resumidas */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Resumo</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="text-center p-3 bg-muted/50 rounded-lg">
              <p className="text-2xl font-bold">{logs.length}</p>
              <p className="text-xs text-muted-foreground">Total de Logs</p>
            </div>
            <div className="text-center p-3 bg-green-500/10 rounded-lg">
              <p className="text-2xl font-bold text-green-600">
                {logs.filter((l) => l.status === 'success').length}
              </p>
              <p className="text-xs text-muted-foreground">Sucessos</p>
            </div>
            <div className="text-center p-3 bg-red-500/10 rounded-lg">
              <p className="text-2xl font-bold text-red-600">
                {logs.filter((l) => l.status === 'error').length}
              </p>
              <p className="text-xs text-muted-foreground">Erros</p>
            </div>
            <div className="text-center p-3 bg-blue-500/10 rounded-lg">
              <p className="text-2xl font-bold text-blue-600">
                {new Set(logs.map((l) => l.trt)).size}
              </p>
              <p className="text-xs text-muted-foreground">TRTs</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

