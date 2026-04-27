'use client';

/**
 * PARTES CONTRÁRIAS FEATURE - Componentes de Ações em Massa
 *
 * Barra de ações + dialogs para operações bulk em partes contrárias selecionadas.
 */

import { cn } from '@/lib/utils';
import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/typography';
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
import { Trash2, X } from 'lucide-react';
import { toast } from 'sonner';
import { actionDesativarPartesContrariasEmMassa } from '../../actions/partes-contrarias-actions';

interface PartesContrariasBulkActionsBarProps {
  selectedCount: number;
  onClearSelection: () => void;
  onDesativar: () => void;
}

export function PartesContrariasBulkActionsBar({
  selectedCount,
  onClearSelection,
  onDesativar,
}: PartesContrariasBulkActionsBarProps) {
  if (selectedCount === 0) return null;

  return (
    <div className={cn(/* design-system-escape: gap-2 → migrar para <Inline gap="tight">; px-3 padding direcional sem Inset equiv.; py-2 padding direcional sem Inset equiv. */ "flex items-center gap-2 rounded-md border bg-muted/50 px-3 py-2")}>
      <Text variant="caption" as="span" className={cn(/* design-system-escape: font-medium → className de <Text>/<Heading> */ "font-medium whitespace-nowrap")}>
        {selectedCount} selecionado{selectedCount > 1 ? 's' : ''}
      </Text>
      <div className={cn(/* design-system-escape: gap-1 gap sem token DS */ "flex items-center gap-1 ml-2")}>
        <Button variant="outline" size="sm" className="text-destructive hover:text-destructive" onClick={onDesativar}>
          <Trash2 className="mr-1.5 h-3.5 w-3.5" />
          Desativar
        </Button>
      </div>
      <Button variant="ghost" size="sm" onClick={onClearSelection} className="ml-auto">
        <X className="mr-1 h-3.5 w-3.5" />
        Limpar
      </Button>
    </div>
  );
}

interface DesativarPartesContrariasMassaDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedIds: number[];
  onSuccess: () => void;
}

export function DesativarPartesContrariasMassaDialog({
  open,
  onOpenChange,
  selectedIds,
  onSuccess,
}: DesativarPartesContrariasMassaDialogProps) {
  const [isPending, setIsPending] = React.useState(false);

  const handleDeactivate = async () => {
    setIsPending(true);
    try {
      const result = await actionDesativarPartesContrariasEmMassa(selectedIds);
      if (result.success) {
        toast.success(result.message);
        onOpenChange(false);
        onSuccess();
      } else {
        toast.error(result.message);
      }
    } catch {
      toast.error('Erro ao desativar partes contrárias em massa');
    } finally {
      setIsPending(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            Desativar {selectedIds.length} Parte{selectedIds.length > 1 ? 's' : ''} Contrária{selectedIds.length > 1 ? 's' : ''}
          </AlertDialogTitle>
          <AlertDialogDescription>
            Tem certeza que deseja desativar {selectedIds.length} parte{selectedIds.length > 1 ? 's' : ''} contrária{selectedIds.length > 1 ? 's' : ''}?
            Ficarão como inativas e não aparecerão nas listagens padrão.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => { e.preventDefault(); handleDeactivate(); }}
            disabled={isPending}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isPending ? 'Desativando...' : 'Desativar'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
