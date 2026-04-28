'use client';

/**
 * CONTRATOS FEATURE - Componentes de Ações em Massa
 *
 * Barra de ações + dialogs para operações bulk em contratos selecionados.
 * Padrão: barra aparece quando há linhas selecionadas, com botões
 * que abrem dialogs de confirmação/seleção.
 */

import * as React from 'react';
import {
  Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Text } from '@/components/ui/typography';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  } from '@/components/ui/select';
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { X, Trash2, UserRound, ArrowRightLeft, FolderKanban, CheckSquare} from 'lucide-react';
import { toast } from 'sonner';
import {
  actionAlterarStatusContratosEmMassa,
  actionAtribuirResponsavelContratosEmMassa,
  actionAlterarSegmentoContratosEmMassa,
  actionExcluirContratosEmMassa,
} from '../actions';
import { STATUS_CONTRATO_LABELS } from '../domain';
import type { ClienteInfo } from '../types';

import { LoadingSpinner } from "@/components/ui/loading-state"
// =============================================================================
// BARRA DE AÇÕES EM MASSA
// =============================================================================

interface ContratosBulkActionsBarProps {
  selectedCount: number;
  onClearSelection: () => void;
  onAlterarStatus: () => void;
  onAtribuirResponsavel: () => void;
  onAlterarSegmento: () => void;
  onExcluir: () => void;
}

export function ContratosBulkActionsBar({
  selectedCount,
  onClearSelection,
  onAlterarStatus,
  onAtribuirResponsavel,
  onAlterarSegmento,
  onExcluir,
}: ContratosBulkActionsBarProps) {
  if (selectedCount === 0) return null;

  const actionClass =
    /* design-system-escape: gap-1.5 gap sem token DS; px-2.5 padding direcional sem Inset equiv.; py-1.5 padding direcional sem Inset equiv.; font-medium → className de <Text>/<Heading> */ 'inline-flex items-center gap-1.5 rounded-lg border border-border/15 bg-background/40 px-2.5 py-1.5 text-[11px] font-medium text-muted-foreground/80 transition-colors hover:border-border/40 hover:bg-muted/30 hover:text-foreground cursor-pointer';

  return (
    <div className={cn(/* design-system-escape: gap-2 → migrar para <Inline gap="tight">; px-3 padding direcional sem Inset equiv.; py-1.5 padding direcional sem Inset equiv. */ "flex flex-wrap items-center gap-2 rounded-xl border border-primary/15 bg-primary/5 px-3 py-1.5")}>
      <Text variant="caption" as="div" className={cn(/* design-system-escape: gap-1.5 gap sem token DS; font-semibold → className de <Text>/<Heading> */ "inline-flex items-center gap-1.5 font-semibold text-primary whitespace-nowrap")}>
        <CheckSquare className="size-3.5" aria-hidden="true" />
        {selectedCount} selecionado{selectedCount > 1 ? 's' : ''}
      </Text>

      <span className="h-3.5 w-px bg-primary/15" aria-hidden="true" />

      <div className={cn(/* design-system-escape: gap-1 gap sem token DS */ "flex flex-wrap items-center gap-1")}>
        <button type="button" onClick={onAlterarStatus} className={actionClass}>
          <ArrowRightLeft className="size-3" />
          Alterar Status
        </button>
        <button type="button" onClick={onAtribuirResponsavel} className={actionClass}>
          <UserRound className="size-3" />
          Responsável
        </button>
        <button type="button" onClick={onAlterarSegmento} className={actionClass}>
          <FolderKanban className="size-3" />
          Segmento
        </button>
        <button
          type="button"
          onClick={onExcluir}
          className={cn(
            actionClass,
            'border-destructive/20 text-destructive/80 hover:border-destructive/40 hover:bg-destructive/5 hover:text-destructive',
          )}
        >
          <Trash2 className="size-3" />
          Excluir
        </button>
      </div>

      <button
        type="button"
        onClick={onClearSelection}
        className={cn(/* design-system-escape: gap-1 gap sem token DS; px-2 padding direcional sem Inset equiv.; py-1 padding direcional sem Inset equiv. */ "ml-auto inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] text-muted-foreground/60 transition-colors hover:bg-muted/30 hover:text-foreground cursor-pointer")}
      >
        <X className="size-3" />
        Limpar
      </button>
    </div>
  );
}

// =============================================================================
// DIALOG: ALTERAR STATUS EM MASSA
// =============================================================================

interface AlterarStatusMassaDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedIds: number[];
  onSuccess: () => void;
}

export function AlterarStatusMassaDialog({
  open,
  onOpenChange,
  selectedIds,
  onSuccess,
}: AlterarStatusMassaDialogProps) {
  const [novoStatus, setNovoStatus] = React.useState('');
  const [isPending, setIsPending] = React.useState(false);

  React.useEffect(() => {
    if (open) setNovoStatus('');
  }, [open]);

  const handleSubmit = async () => {
    if (!novoStatus) return;
    setIsPending(true);
    try {
      const result = await actionAlterarStatusContratosEmMassa(selectedIds, novoStatus);
      if (result.success) {
        toast.success(result.message);
        onOpenChange(false);
        onSuccess();
      } else {
        toast.error(result.message);
      }
    } catch {
      toast.error('Erro ao alterar status em massa');
    } finally {
      setIsPending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="sm:max-w-sm  overflow-hidden p-0 gap-0 max-h-[90vh] flex flex-col"
      >
        <DialogHeader className="px-6 py-4 border-b border-border/20 shrink-0">
          <DialogTitle>Alterar Status</DialogTitle>
          <DialogDescription>{`Alterar status de ${selectedIds.length} contrato(s) selecionado(s).`}</DialogDescription>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto overflow-x-hidden px-6 py-4 [scrollbar-width:thin]">
          <div className={cn(/* design-system-escape: space-y-2 → migrar para <Stack gap="tight"> */ "space-y-2")}>
            <Label>Novo Status</Label>
            <Select value={novoStatus} onValueChange={setNovoStatus} disabled={isPending}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Selecione o novo status" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(STATUS_CONTRATO_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="px-6 py-4 border-t border-border/20 shrink-0 flex items-center justify-between gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <div className="flex items-center gap-2">
            <Button onClick={handleSubmit} disabled={isPending || !novoStatus}>
              {isPending && <LoadingSpinner className="mr-2" />}
              Confirmar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// =============================================================================
// DIALOG: ATRIBUIR RESPONSÁVEL EM MASSA
// =============================================================================

interface AtribuirResponsavelMassaDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedIds: number[];
  usuarios: ClienteInfo[];
  onSuccess: () => void;
}

export function AtribuirResponsavelMassaDialog({
  open,
  onOpenChange,
  selectedIds,
  usuarios,
  onSuccess,
}: AtribuirResponsavelMassaDialogProps) {
  const [responsavelId, setResponsavelId] = React.useState('');
  const [isPending, setIsPending] = React.useState(false);

  React.useEffect(() => {
    if (open) setResponsavelId('');
  }, [open]);

  const handleSubmit = async () => {
    if (!responsavelId) return;
    setIsPending(true);
    try {
      const idNumerico = responsavelId === 'null' ? null : Number(responsavelId);
      const result = await actionAtribuirResponsavelContratosEmMassa(selectedIds, idNumerico);
      if (result.success) {
        toast.success(result.message);
        onOpenChange(false);
        onSuccess();
      } else {
        toast.error(result.message);
      }
    } catch {
      toast.error('Erro ao atribuir responsável em massa');
    } finally {
      setIsPending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="sm:max-w-sm  overflow-hidden p-0 gap-0 max-h-[90vh] flex flex-col"
      >
        <DialogHeader className="px-6 py-4 border-b border-border/20 shrink-0">
          <DialogTitle>Atribuir Responsável</DialogTitle>
          <DialogDescription>{`Atribuir responsável a ${selectedIds.length} contrato(s) selecionado(s).`}</DialogDescription>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto overflow-x-hidden px-6 py-4 [scrollbar-width:thin]">
          <div className={cn(/* design-system-escape: space-y-2 → migrar para <Stack gap="tight"> */ "space-y-2")}>
            <Label>Responsável</Label>
            <Select value={responsavelId} onValueChange={setResponsavelId} disabled={isPending}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Selecione um responsável" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="null">Sem responsável</SelectItem>
                {usuarios.map((u) => (
                  <SelectItem key={u.id} value={u.id.toString()}>
                    {u.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="px-6 py-4 border-t border-border/20 shrink-0 flex items-center justify-between gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <div className="flex items-center gap-2">
            <Button onClick={handleSubmit} disabled={isPending || !responsavelId}>
              {isPending && <LoadingSpinner className="mr-2" />}
              Confirmar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// =============================================================================
// DIALOG: ALTERAR SEGMENTO EM MASSA
// =============================================================================

interface AlterarSegmentoMassaDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedIds: number[];
  segmentos: Array<{ id: number; nome: string }>;
  onSuccess: () => void;
}

export function AlterarSegmentoMassaDialog({
  open,
  onOpenChange,
  selectedIds,
  segmentos,
  onSuccess,
}: AlterarSegmentoMassaDialogProps) {
  const [segmentoId, setSegmentoId] = React.useState('');
  const [isPending, setIsPending] = React.useState(false);

  React.useEffect(() => {
    if (open) setSegmentoId('');
  }, [open]);

  const handleSubmit = async () => {
    if (!segmentoId) return;
    setIsPending(true);
    try {
      const idNumerico = segmentoId === 'null' ? null : Number(segmentoId);
      const result = await actionAlterarSegmentoContratosEmMassa(selectedIds, idNumerico);
      if (result.success) {
        toast.success(result.message);
        onOpenChange(false);
        onSuccess();
      } else {
        toast.error(result.message);
      }
    } catch {
      toast.error('Erro ao alterar segmento em massa');
    } finally {
      setIsPending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="sm:max-w-sm  overflow-hidden p-0 gap-0 max-h-[90vh] flex flex-col"
      >
        <DialogHeader className="px-6 py-4 border-b border-border/20 shrink-0">
          <DialogTitle>Alterar Segmento</DialogTitle>
          <DialogDescription>{`Alterar segmento de ${selectedIds.length} contrato(s) selecionado(s).`}</DialogDescription>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto overflow-x-hidden px-6 py-4 [scrollbar-width:thin]">
          <div className={cn(/* design-system-escape: space-y-2 → migrar para <Stack gap="tight"> */ "space-y-2")}>
            <Label>Segmento</Label>
            <Select value={segmentoId} onValueChange={setSegmentoId} disabled={isPending}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Selecione um segmento" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="null">Sem segmento</SelectItem>
                {segmentos.map((s) => (
                  <SelectItem key={s.id} value={s.id.toString()}>
                    {s.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="px-6 py-4 border-t border-border/20 shrink-0 flex items-center justify-between gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <div className="flex items-center gap-2">
            <Button onClick={handleSubmit} disabled={isPending || !segmentoId}>
              {isPending && <LoadingSpinner className="mr-2" />}
              Confirmar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// =============================================================================
// DIALOG: EXCLUIR EM MASSA
// =============================================================================

interface ExcluirMassaDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedIds: number[];
  onSuccess: () => void;
}

export function ExcluirMassaDialog({
  open,
  onOpenChange,
  selectedIds,
  onSuccess,
}: ExcluirMassaDialogProps) {
  const [isPending, setIsPending] = React.useState(false);

  const handleDelete = async () => {
    setIsPending(true);
    try {
      const result = await actionExcluirContratosEmMassa(selectedIds);
      if (result.success) {
        toast.success(result.message);
        onOpenChange(false);
        onSuccess();
      } else {
        toast.error(result.message);
      }
    } catch {
      toast.error('Erro ao excluir contratos em massa');
    } finally {
      setIsPending(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Excluir {selectedIds.length} Contrato{selectedIds.length > 1 ? 's' : ''}</AlertDialogTitle>
          <AlertDialogDescription>
            Tem certeza que deseja excluir {selectedIds.length} contrato{selectedIds.length > 1 ? 's' : ''}?
            Esta ação não pode ser desfeita e removerá todos os dados associados.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              handleDelete();
            }}
            disabled={isPending}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isPending ? 'Excluindo...' : 'Excluir'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
