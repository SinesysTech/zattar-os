
'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { AppBadge as Badge } from '@/components/ui/app-badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Heading, Text } from '@/components/ui/typography';
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
import { RefreshCw, CheckCircle, AlertCircle, Clock, ExternalLink, ShieldCheck} from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { actionSincronizarAcordo, actionVerificarConsistencia } from '@/app/(authenticated)/financeiro/actions';

import { LoadingSpinner } from "@/components/ui/loading-state"
interface IntegracaoFinanceiraSectionProps {
  acordoId: number;
  acordoDirecao?: string; // Optional if needed for links or display
  onSyncComplete?: () => void;
}

interface Inconsistencia {
  tipo: string;
  descricao: string;
  parcelaId?: number;
  lancamentoId?: number;
  sugestao?: string;
}

interface StatusSync {
  totalParcelas: number;
  parcelasSincronizadas: number;
  parcelasPendentes: number;
  parcelasInconsistentes: number;
}

export function IntegracaoFinanceiraSection({ acordoId, onSyncComplete }: IntegracaoFinanceiraSectionProps) {
  const [isLoading, setIsLoading] = React.useState(true);
  const [isSyncing, setIsSyncing] = React.useState(false);
  const [isVerifying, setIsVerifying] = React.useState(false);
  const [syncDialogOpen, setSyncDialogOpen] = React.useState(false);
  const [statusSync, setStatusSync] = React.useState<StatusSync | null>(null);
  const [inconsistencias, setInconsistencias] = React.useState<Inconsistencia[]>([]);

  const loadSyncStatus = React.useCallback(async () => {
    try {
      setIsLoading(true);
      const result = await actionVerificarConsistencia(acordoId);
      if (result.success && result.data) {
        const data = result.data;
        // Map service response to component interface
        const mappedInconsistencies: Inconsistencia[] = data.parcelasSemLancamento.map(p => ({
          tipo: 'parcela_sem_lancamento',
          descricao: `Parcela ${p.numeroParcela} (${p.status}) sem lançamento`,
          parcelaId: p.parcelaId
        }));

        setInconsistencias(mappedInconsistencies);
        setStatusSync({
          totalParcelas: data.totalParcelas || 0,
          parcelasSincronizadas: data.parcelasSincronizadas || 0,
          parcelasPendentes: data.parcelasPendentes || 0,
          parcelasInconsistentes: data.parcelasInconsistentes || 0,
        });
      }
    } finally {
      setIsLoading(false);
    }
  }, [acordoId]);

  React.useEffect(() => { loadSyncStatus(); }, [loadSyncStatus]);

  const handleSincronizar = async (forcar: boolean = false) => {
    try {
      setIsSyncing(true);
      setSyncDialogOpen(false);
      const result = await actionSincronizarAcordo(acordoId, forcar);
      if (result.success) {
        toast.success(result.message || 'Sincronização concluída');
        await loadSyncStatus();
        if (onSyncComplete) onSyncComplete();
      } else {
        toast.error(result.error || 'Erro ao sincronizar');
      }
    } catch {
      toast.error('Erro ao sincronizar');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleVerificarConsistencia = async () => {
    try {
      setIsVerifying(true);
      await loadSyncStatus();
      toast.success('Verificação concluída');
    } catch {
      toast.error('Erro ao verificar');
      setIsVerifying(false);
    }
  };

  if (isLoading) return <Skeleton className="h-40 w-full" />;

  const temInconsistencias = inconsistencias.length > 0;
  // If no detailed status available, default.
  // Note: logic simplified from original but maintains intent
  const pendentes = statusSync?.parcelasPendentes || 0;
  const statusGeral = temInconsistencias ? 'inconsistente' : (pendentes > 0 ? 'pendente' : 'sincronizado');

  return (
    <div className={cn("rounded-lg border bg-card inset-dialog")}>
      <div className="flex items-center justify-between mb-4">
        <Heading level="section" as="h2" className={cn("flex items-center inline-tight")}>
          <RefreshCw className="h-5 w-5" /> Integração Financeira
        </Heading>
        <Badge variant="outline" className={cn(/* design-system-escape: gap-1 gap sem token DS */ 'gap-1',
          statusGeral === 'sincronizado' && 'text-success border-success',
          statusGeral === 'pendente' && 'text-warning border-warning',
          statusGeral === 'inconsistente' && 'text-destructive border-destructive'
        )}>
          {statusGeral === 'sincronizado' ? <CheckCircle className="h-3 w-3" /> :
            statusGeral === 'pendente' ? <Clock className="h-3 w-3" /> : <AlertCircle className="h-3 w-3" />}
          {statusGeral.charAt(0).toUpperCase() + statusGeral.slice(1)}
        </Badge>
      </div>

      {statusSync && (
        <div className={cn("grid grid-cols-2 md:grid-cols-4 inline-default mb-4")}>
          <div className={cn(/* design-system-escape: p-3 → usar <Inset> */ "rounded-lg bg-muted/50 p-3")}>
            <Text variant="caption">Total</Text>
            <Text variant="kpi-value">{statusSync.totalParcelas}</Text>
          </div>
          <div className={cn(/* design-system-escape: p-3 → usar <Inset> */ "rounded-lg bg-success/15 p-3")}>
            <Text variant="caption">Sincronizadas</Text>
            <Text variant="kpi-value" className="text-success">{statusSync.parcelasSincronizadas}</Text>
          </div>
          <div className={cn(/* design-system-escape: p-3 → usar <Inset> */ "rounded-lg bg-warning/15 p-3")}>
            <Text variant="caption">Pendentes</Text>
            <Text variant="kpi-value" className="text-warning">{statusSync.parcelasPendentes}</Text>
          </div>
          <div className={cn(/* design-system-escape: p-3 → usar <Inset> */ "rounded-lg bg-destructive/15 p-3")}>
            <Text variant="caption">Inconsistentes</Text>
            <Text variant="kpi-value" className="text-destructive">{statusSync.parcelasInconsistentes}</Text>
          </div>
        </div>
      )}

      <div className={cn("flex flex-wrap inline-tight")}>
        <Button variant="outline" size="sm" onClick={() => setSyncDialogOpen(true)} disabled={isSyncing || isVerifying}>
          {isSyncing ? <LoadingSpinner className="mr-2" /> : <RefreshCw className="h-4 w-4 mr-2" />}
          Sincronizar
        </Button>
        <Button variant="outline" size="sm" onClick={handleVerificarConsistencia} disabled={isSyncing || isVerifying}>
          {isVerifying ? <LoadingSpinner className="mr-2" /> : <ShieldCheck className="h-4 w-4 mr-2" />}
          Verificar
        </Button>
        <Button variant="outline" size="sm" asChild>
          <Link href={`/financeiro/contas-pagar?acordoId=${acordoId}`}>
            <ExternalLink className="h-4 w-4 mr-2" /> Ver no Financeiro
          </Link>
        </Button>
      </div>

      <AlertDialog open={syncDialogOpen} onOpenChange={setSyncDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Sincronizar</AlertDialogTitle>
            <AlertDialogDescription>Esta ação irá atualizar os lançamentos financeiros.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => handleSincronizar(false)}>Sincronizar</AlertDialogAction>
            {temInconsistencias && <AlertDialogAction onClick={() => handleSincronizar(true)} className="bg-warning hover:bg-warning/90 text-warning-foreground">Forçar</AlertDialogAction>}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
