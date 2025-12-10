'use client';

/**
 * Seção de Integração Financeira para página de detalhes do Acordo/Condenação
 * Exibe status de sincronização com o sistema financeiro e permite ações de sync
 */

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Clock,
  ExternalLink,
  ShieldCheck,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import {
  sincronizarAcordo,
  verificarConsistenciaAcordo,
} from '@/core/app/_lib/hooks/use-obrigacoes';
import type {
  InconsistenciaObrigacao,
} from '@/backend/types/financeiro/obrigacoes.types';

// ============================================================================
// Types
// ============================================================================

interface IntegracaoFinanceiraSectionProps {
  acordoId: number;
  onSyncComplete?: () => void;
}

interface StatusSincronizacao {
  totalParcelas: number;
  parcelasSincronizadas: number;
  parcelasPendentes: number;
  parcelasInconsistentes: number;
}

// ============================================================================
// Component
// ============================================================================

export function IntegracaoFinanceiraSection({
  acordoId,
  onSyncComplete,
}: IntegracaoFinanceiraSectionProps) {
  const [isLoading, setIsLoading] = React.useState(true);
  const [isSyncing, setIsSyncing] = React.useState(false);
  const [isVerifying, setIsVerifying] = React.useState(false);
  const [syncDialogOpen, setSyncDialogOpen] = React.useState(false);
  const [statusSync, setStatusSync] = React.useState<StatusSincronizacao | null>(null);
  const [inconsistencias, setInconsistencias] = React.useState<InconsistenciaObrigacao[]>([]);

  // Carregar status de sincronização
  const loadSyncStatus = React.useCallback(async () => {
    try {
      setIsLoading(true);

      // Verificar consistência para obter status e contagens reais
      const result = await verificarConsistenciaAcordo(acordoId);

      if (result.success && result.data) {
        const data = result.data;
        setInconsistencias(data.inconsistencias);

        // Usar contagens reais retornadas pelo backend
        setStatusSync({
          totalParcelas: data.totalParcelas,
          parcelasSincronizadas: data.parcelasSincronizadas,
          parcelasPendentes: data.parcelasPendentes,
          parcelasInconsistentes: data.parcelasInconsistentes,
        });
      }
    } catch (error) {
      console.error('Erro ao carregar status de sincronização:', error);
    } finally {
      setIsLoading(false);
    }
  }, [acordoId]);

  React.useEffect(() => {
    loadSyncStatus();
  }, [loadSyncStatus]);

  // Sincronizar acordo
  const handleSincronizar = async (forcar: boolean = false) => {
    try {
      setIsSyncing(true);
      setSyncDialogOpen(false);

      const result = await sincronizarAcordo(acordoId, forcar);

      if (result.success && result.data) {
        const data = result.data;
        if (data.totalErros > 0) {
          toast.warning(
            `Sincronização concluída com avisos: ${data.totalSucessos} sucesso(s), ${data.totalErros} erro(s)`
          );
        } else {
          toast.success(`Sincronização concluída: ${data.totalSucessos} parcela(s) processada(s)`);
        }
        await loadSyncStatus();
        onSyncComplete?.();
      } else {
        toast.error(result.error || 'Erro ao sincronizar');
      }
    } catch (error) {
      toast.error('Erro ao sincronizar com o sistema financeiro');
      console.error('Erro na sincronização:', error);
    } finally {
      setIsSyncing(false);
    }
  };

  // Verificar consistência
  const handleVerificarConsistencia = async () => {
    try {
      setIsVerifying(true);

      const result = await verificarConsistenciaAcordo(acordoId);

      if (result.success && result.data) {
        const data = result.data;
        setInconsistencias(data.inconsistencias);

        if (data.consistente) {
          toast.success('Todas as parcelas estão sincronizadas corretamente');
        } else {
          toast.warning(`Encontradas ${data.totalInconsistencias} inconsistência(s)`);
        }
      } else {
        toast.error(result.error || 'Erro ao verificar consistência');
      }
    } catch (error) {
      toast.error('Erro ao verificar consistência');
      console.error('Erro na verificação:', error);
    } finally {
      setIsVerifying(false);
    }
  };

  // Renderizar skeleton durante carregamento
  if (isLoading) {
    return (
      <div className="rounded-lg border bg-card p-6">
        <Skeleton className="h-6 w-48 mb-4" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <Skeleton className="h-16" />
          <Skeleton className="h-16" />
          <Skeleton className="h-16" />
          <Skeleton className="h-16" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-9 w-32" />
          <Skeleton className="h-9 w-40" />
        </div>
      </div>
    );
  }

  const temInconsistencias = inconsistencias.length > 0;
  const statusGeral = !temInconsistencias
    ? 'sincronizado'
    : inconsistencias.some((i) => i.tipo === 'parcela_sem_lancamento')
      ? 'pendente'
      : 'inconsistente';

  return (
    <div className="rounded-lg border bg-card p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <RefreshCw className="h-5 w-5" />
          Integração Financeira
        </h2>
        <Badge
          variant="outline"
          className={cn(
            'gap-1',
            statusGeral === 'sincronizado' && 'text-green-600 border-green-600',
            statusGeral === 'pendente' && 'text-amber-600 border-amber-600',
            statusGeral === 'inconsistente' && 'text-red-600 border-red-600'
          )}
        >
          {statusGeral === 'sincronizado' && (
            <>
              <CheckCircle className="h-3 w-3" /> Sincronizado
            </>
          )}
          {statusGeral === 'pendente' && (
            <>
              <Clock className="h-3 w-3" /> Pendente
            </>
          )}
          {statusGeral === 'inconsistente' && (
            <>
              <AlertCircle className="h-3 w-3" /> Inconsistente
            </>
          )}
        </Badge>
      </div>

      {/* Cards de status */}
      {statusSync && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <div className="rounded-lg bg-muted/50 p-3">
            <p className="text-xs text-muted-foreground">Total de Parcelas</p>
            <p className="text-xl font-bold">{statusSync.totalParcelas}</p>
          </div>
          <div className="rounded-lg bg-green-50 dark:bg-green-950/20 p-3">
            <p className="text-xs text-muted-foreground">Sincronizadas</p>
            <p className="text-xl font-bold text-green-600">
              {statusSync.parcelasSincronizadas}
            </p>
          </div>
          <div className="rounded-lg bg-amber-50 dark:bg-amber-950/20 p-3">
            <p className="text-xs text-muted-foreground">Pendentes</p>
            <p className="text-xl font-bold text-amber-600">
              {statusSync.parcelasPendentes}
            </p>
          </div>
          <div className="rounded-lg bg-red-50 dark:bg-red-950/20 p-3">
            <p className="text-xs text-muted-foreground">Inconsistentes</p>
            <p className="text-xl font-bold text-red-600">
              {statusSync.parcelasInconsistentes}
            </p>
          </div>
        </div>
      )}

      {/* Lista de inconsistências */}
      {temInconsistencias && (
        <div className="mb-4 rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/20 p-4">
          <h3 className="text-sm font-medium text-amber-800 dark:text-amber-200 mb-2">
            Inconsistências Detectadas
          </h3>
          <ul className="space-y-2">
            {inconsistencias.slice(0, 5).map((inc, index) => (
              <li key={index} className="text-sm text-amber-700 dark:text-amber-300 flex items-start gap-2">
                <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                <span>{inc.descricao}</span>
              </li>
            ))}
            {inconsistencias.length > 5 && (
              <li className="text-sm text-muted-foreground">
                ... e mais {inconsistencias.length - 5} inconsistência(s)
              </li>
            )}
          </ul>
        </div>
      )}

      {/* Ações */}
      <div className="flex flex-wrap gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setSyncDialogOpen(true)}
          disabled={isSyncing || isVerifying}
        >
          {isSyncing ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Sincronizando...
            </>
          ) : (
            <>
              <RefreshCw className="h-4 w-4 mr-2" />
              Sincronizar
            </>
          )}
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={handleVerificarConsistencia}
          disabled={isSyncing || isVerifying}
        >
          {isVerifying ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Verificando...
            </>
          ) : (
            <>
              <ShieldCheck className="h-4 w-4 mr-2" />
              Verificar Consistência
            </>
          )}
        </Button>

        <Button variant="outline" size="sm" asChild>
          <Link href={`/financeiro/obrigacoes?acordoId=${acordoId}`}>
            <ExternalLink className="h-4 w-4 mr-2" />
            Ver no Módulo Financeiro
          </Link>
        </Button>
      </div>

      {/* Dialog de confirmação de sincronização */}
      <AlertDialog open={syncDialogOpen} onOpenChange={setSyncDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Sincronizar com Sistema Financeiro</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação irá criar ou atualizar os lançamentos financeiros
              correspondentes às parcelas deste acordo.
              {temInconsistencias && (
                <span className="block mt-2 text-amber-600">
                  Foram detectadas {inconsistencias.length} inconsistência(s).
                  Deseja forçar a sincronização?
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => handleSincronizar(false)}>
              Sincronizar
            </AlertDialogAction>
            {temInconsistencias && (
              <AlertDialogAction
                onClick={() => handleSincronizar(true)}
                className="bg-amber-600 hover:bg-amber-700"
              >
                Forçar Sincronização
              </AlertDialogAction>
            )}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
