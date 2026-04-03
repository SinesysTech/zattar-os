'use client';

import * as React from 'react';
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
import { actionExcluirContrato } from '../actions';
import { toast } from 'sonner';

interface ContratoDeleteDialogProps {
    contratoId: number;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess?: () => void;
}

export function ContratoDeleteDialog({
    contratoId,
    open,
    onOpenChange,
    onSuccess,
}: ContratoDeleteDialogProps) {
    const [isDeleting, setIsDeleting] = React.useState(false);

    const handleDelete = async () => {
        setIsDeleting(true);
        try {
            const result = await actionExcluirContrato(contratoId);
            if (result.success) {
                toast.success('Contrato excluído com sucesso');
                onOpenChange(false);
                onSuccess?.();
            } else {
                toast.error(result.message || 'Erro ao excluir contrato');
            }
        } catch {
            toast.error('Erro ao excluir contrato');
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <AlertDialog open={open} onOpenChange={onOpenChange}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Excluir Contrato</AlertDialogTitle>
                    <AlertDialogDescription>
                        Tem certeza que deseja excluir este contrato? Esta ação não pode ser desfeita
                        e removerá todos os dados associados (processos vinculados, históricos, etc).
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
                    <AlertDialogAction
                        onClick={(e) => {
                            e.preventDefault();
                            handleDelete();
                        }}
                        disabled={isDeleting}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                        {isDeleting ? 'Excluindo...' : 'Excluir'}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
