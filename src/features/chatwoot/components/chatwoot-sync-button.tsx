'use client';

/**
 * ChatwootSyncButton - Botão para sincronizar partes com Chatwoot
 *
 * Componente que exibe um botão de sincronização na toolbar de tabelas
 * com feedback de progresso e resultado.
 */

import * as React from 'react';
import { CloudCog, Loader2, Check, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
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
import { toast } from 'sonner';
import { sincronizarTodasPartes, type SincronizarPartesResult } from '../actions';
import type { TipoEntidadeChatwoot } from '../domain';

// =============================================================================
// Tipos
// =============================================================================

interface ChatwootSyncButtonProps {
  /** Tipo de entidade a sincronizar */
  tipoEntidade: TipoEntidadeChatwoot;
  /** Label customizado para o botão */
  label?: string;
  /** Se true, sincroniza apenas registros ativos */
  apenasAtivos?: boolean;
  /** Callback chamado após sincronização completa */
  onSyncComplete?: (result: SincronizarPartesResult) => void;
}

type SyncState = 'idle' | 'confirming' | 'syncing' | 'success' | 'error';

// =============================================================================
// Labels e constantes
// =============================================================================

const ENTIDADE_LABELS: Record<TipoEntidadeChatwoot, { singular: string; plural: string }> = {
  cliente: { singular: 'cliente', plural: 'clientes' },
  parte_contraria: { singular: 'parte contrária', plural: 'partes contrárias' },
  terceiro: { singular: 'terceiro', plural: 'terceiros' },
};

// =============================================================================
// Componente
// =============================================================================

export function ChatwootSyncButton({
  tipoEntidade,
  label,
  apenasAtivos = false,
  onSyncComplete,
}: ChatwootSyncButtonProps) {
  const [state, setState] = React.useState<SyncState>('idle');
  const [result, setResult] = React.useState<SincronizarPartesResult | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const labels = ENTIDADE_LABELS[tipoEntidade];
  const buttonLabel = label ?? `Sincronizar ${labels.plural} com Chatwoot`;

  const handleSync = React.useCallback(async () => {
    setState('syncing');
    setError(null);
    setResult(null);

    try {
      const syncResult = await sincronizarTodasPartes({
        tipoEntidade,
        apenasAtivos,
        limite: 100,
        delayEntreSync: 100,
        pararNoErro: false,
      });

      if (syncResult.success) {
        setResult(syncResult.data);
        setState('success');

        // Toast de sucesso
        toast.success(`Sincronização concluída`, {
          description: `${syncResult.data.total_sucesso} de ${syncResult.data.total_processados} ${labels.plural} sincronizados.`,
        });

        // Callback
        onSyncComplete?.(syncResult.data);
      } else {
        setError(syncResult.error.message);
        setState('error');
        toast.error('Erro na sincronização', {
          description: syncResult.error.message,
        });
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(errorMessage);
      setState('error');
      toast.error('Erro na sincronização', {
        description: errorMessage,
      });
    }
  }, [tipoEntidade, apenasAtivos, labels.plural, onSyncComplete]);

  const handleConfirm = React.useCallback(() => {
    setState('idle');
    void handleSync();
  }, [handleSync]);

  const handleCancel = React.useCallback(() => {
    setState('idle');
  }, []);

  const handleButtonClick = React.useCallback(() => {
    setState('confirming');
  }, []);

  const handleDialogClose = React.useCallback(() => {
    if (state === 'success' || state === 'error') {
      setState('idle');
    }
  }, [state]);

  // Determina ícone baseado no estado
  const renderIcon = () => {
    switch (state) {
      case 'syncing':
        return <Loader2 className="h-4 w-4 animate-spin" />;
      case 'success':
        return <Check className="h-4 w-4 text-success" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-destructive" />;
      default:
        return <CloudCog className="h-4 w-4" />;
    }
  };

  return (
    <>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            className="h-10 w-10 bg-card"
            onClick={handleButtonClick}
            disabled={state === 'syncing'}
            aria-label={buttonLabel}
          >
            {renderIcon()}
          </Button>
        </TooltipTrigger>
        <TooltipContent>{buttonLabel}</TooltipContent>
      </Tooltip>

      {/* Dialog de confirmação */}
      <AlertDialog open={state === 'confirming'} onOpenChange={handleCancel}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Sincronizar com Chatwoot</AlertDialogTitle>
            <AlertDialogDescription>
              Deseja sincronizar todos os {labels.plural} {apenasAtivos ? 'ativos ' : ''}
              com o Chatwoot? Esta operação pode levar alguns minutos dependendo da quantidade de registros.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCancel}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirm}>
              Sincronizar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog de resultado */}
      <AlertDialog open={state === 'success' || state === 'error'} onOpenChange={handleDialogClose}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {state === 'success' ? 'Sincronização concluída' : 'Erro na sincronização'}
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-2">
                {state === 'success' && result && (
                  <>
                    <p>A sincronização foi concluída com os seguintes resultados:</p>
                    <ul className="list-disc list-inside space-y-1 text-sm">
                      <li>Total processados: <strong>{result.total_processados}</strong></li>
                      <li>Sucesso: <strong className="text-success">{result.total_sucesso}</strong></li>
                      <li>Contatos criados: <strong>{result.contatos_criados}</strong></li>
                      <li>Contatos atualizados: <strong>{result.contatos_atualizados}</strong></li>
                      {result.total_erros > 0 && (
                        <li>Erros: <strong className="text-destructive">{result.total_erros}</strong></li>
                      )}
                    </ul>
                    {result.erros.length > 0 && result.erros.length <= 5 && (
                      <div className="mt-2">
                        <p className="text-sm font-medium">Erros encontrados:</p>
                        <ul className="list-disc list-inside text-xs text-muted-foreground">
                          {result.erros.map((erro, idx) => (
                            <li key={idx}>
                              {erro.nome}: {erro.erro}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {result.erros.length > 5 && (
                      <p className="text-sm text-muted-foreground">
                        E mais {result.erros.length - 5} erros. Verifique o console para detalhes.
                      </p>
                    )}
                  </>
                )}
                {state === 'error' && (
                  <p className="text-destructive">{error}</p>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={handleDialogClose}>OK</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
