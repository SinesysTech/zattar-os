'use client';

import { cn } from '@/lib/utils';
import { useState } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Ban } from 'lucide-react';
import { toast } from 'sonner';
import { actionCancelarLinkPrestacaoContas } from '@/shared/prestacao-contas/actions/cancelar-link-prestacao-contas';

interface Props {
  parcelaId: number;
  onCancelado?: () => void;
  label?: string;
}

export function CancelarLinkButton({
  parcelaId,
  onCancelado,
  label = 'Cancelar link',
}: Props) {
  const [loading, setLoading] = useState(false);

  const handle = async () => {
    setLoading(true);
    try {
      const res = await actionCancelarLinkPrestacaoContas({ parcelaId });
      if (res.success) {
        toast.success('Link cancelado');
        onCancelado?.();
      } else {
        toast.error(res.error || res.message || 'Erro ao cancelar');
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Erro inesperado');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          size="sm"
          variant="outline"
          className={cn("flex rounded-xl inline-snug")}
          disabled={loading}
        >
          <Ban className="size-3.5" />
          {label}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent className="">
        <AlertDialogHeader>
          <AlertDialogTitle>Cancelar link ativo?</AlertDialogTitle>
          <AlertDialogDescription>
            O link público ficará inválido e o cliente não conseguirá mais assinar por ele. Você poderá gerar um novo link depois.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="rounded-xl">Manter</AlertDialogCancel>
          <AlertDialogAction
            onClick={handle}
            disabled={loading}
            className="rounded-xl"
          >
            {loading ? 'Cancelando...' : 'Cancelar link'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
