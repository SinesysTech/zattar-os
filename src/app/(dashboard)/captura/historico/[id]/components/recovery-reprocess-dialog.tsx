/**
 * RecoveryReprocessDialog - Dialog de confirmação para re-processamento
 *
 * Exibe confirmação antes de re-processar elementos selecionados,
 * com opções de configuração e feedback do progresso.
 */

'use client';

import { AlertTriangle, Loader2, Play, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

interface RecoveryReprocessDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedCount: number;
  isProcessing: boolean;
  onConfirm: () => void;
  forcarAtualizacao?: boolean;
  onForcarAtualizacaoChange?: (value: boolean) => void;
}

export function RecoveryReprocessDialog({
  open,
  onOpenChange,
  selectedCount,
  isProcessing,
  onConfirm,
  forcarAtualizacao = false,
  onForcarAtualizacaoChange,
}: RecoveryReprocessDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-warning" />
            Confirmar Re-processamento
          </DialogTitle>
          <DialogDescription>
            Você está prestes a re-processar {selectedCount} elemento(s).
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <Alert>
            <AlertDescription>
              Esta ação irá tentar persistir os elementos selecionados no banco de dados PostgreSQL
              usando os dados brutos armazenados no MongoDB.
            </AlertDescription>
          </Alert>

          {/* Opção de forçar atualização */}
          {onForcarAtualizacaoChange && (
            <div className="flex items-center justify-between p-3 border rounded-lg bg-muted/30">
              <div className="space-y-0.5">
                <Label
                  htmlFor="forcar-atualizacao"
                  className="text-sm font-medium cursor-pointer flex items-center gap-2"
                >
                  <RefreshCw className="h-4 w-4" />
                  Forçar Atualização
                </Label>
                <p className="text-xs text-muted-foreground">
                  Atualiza elementos mesmo que já existam no banco
                </p>
              </div>
              <Switch
                id="forcar-atualizacao"
                checked={forcarAtualizacao}
                onCheckedChange={onForcarAtualizacaoChange}
              />
            </div>
          )}

          <div className="text-sm text-muted-foreground space-y-2">
            <p>O re-processamento irá:</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>Verificar se cada elemento já existe no PostgreSQL</li>
              {forcarAtualizacao ? (
                <>
                  <li className="text-amber-600">Atualizar TODOS os elementos selecionados</li>
                  <li className="text-amber-600">Sobrescrever dados existentes no banco</li>
                </>
              ) : (
                <>
                  <li>Criar novos registros apenas para elementos faltantes</li>
                  <li>Ignorar elementos que já existem no banco</li>
                </>
              )}
              <li>Reportar erros de validação ou conflitos</li>
            </ul>
          </div>

          <div className="bg-muted/50 p-3 rounded-lg">
            <p className="text-sm font-medium">Resumo:</p>
            <p className="text-sm text-muted-foreground">
              {selectedCount} elemento(s) selecionado(s) para re-processamento
              {forcarAtualizacao && (
                <span className="text-amber-600 ml-1">(com atualização forçada)</span>
              )}
            </p>
          </div>

          {forcarAtualizacao && (
            <Alert variant="destructive" className="border-amber-500 bg-amber-500/10">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              <AlertDescription className="text-amber-600">
                Atenção: A atualização forçada irá sobrescrever dados existentes no PostgreSQL com
                os dados do MongoDB. Esta ação pode não ser reversível.
              </AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isProcessing}>
            Cancelar
          </Button>
          <Button
            onClick={onConfirm}
            disabled={isProcessing}
            className="gap-2"
            variant={forcarAtualizacao ? 'destructive' : 'default'}
          >
            {isProcessing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Processando...
              </>
            ) : (
              <>
                <Play className="h-4 w-4" />
                {forcarAtualizacao ? 'Forçar Re-processamento' : 'Confirmar Re-processamento'}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
