/**
 * RecoveryReprocessDialog - Dialog de confirmação para re-processamento
 *
 * Exibe confirmação antes de re-processar elementos selecionados,
 * com opções de configuração e feedback do progresso.
 */

'use client';

import { AlertTriangle, Loader2, Play } from 'lucide-react';
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

interface RecoveryReprocessDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedCount: number;
  isProcessing: boolean;
  onConfirm: () => void;
}

export function RecoveryReprocessDialog({
  open,
  onOpenChange,
  selectedCount,
  isProcessing,
  onConfirm,
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
            Você está prestes a re-processar {selectedCount} elemento(s) faltante(s).
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <Alert>
            <AlertDescription>
              Esta ação irá tentar persistir os elementos selecionados no banco de dados PostgreSQL
              usando os dados brutos armazenados no MongoDB.
            </AlertDescription>
          </Alert>

          <div className="text-sm text-muted-foreground space-y-2">
            <p>O re-processamento irá:</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>Verificar se cada elemento já existe no PostgreSQL</li>
              <li>Criar novos registros para elementos faltantes</li>
              <li>Atualizar registros existentes se necessário</li>
              <li>Reportar erros de validação ou conflitos</li>
            </ul>
          </div>

          <div className="bg-muted/50 p-3 rounded-lg">
            <p className="text-sm font-medium">Resumo:</p>
            <p className="text-sm text-muted-foreground">
              {selectedCount} elemento(s) selecionado(s) para re-processamento
            </p>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isProcessing}
          >
            Cancelar
          </Button>
          <Button onClick={onConfirm} disabled={isProcessing} className="gap-2">
            {isProcessing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Processando...
              </>
            ) : (
              <>
                <Play className="h-4 w-4" />
                Confirmar Re-processamento
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

