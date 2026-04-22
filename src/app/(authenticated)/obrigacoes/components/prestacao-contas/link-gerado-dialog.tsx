'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Copy, Check } from 'lucide-react';
import { toast } from 'sonner';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  url: string;
  expiresAt: string;
}

export function LinkGeradoDialog({ open, onOpenChange, url, expiresAt }: Props) {
  const [copiado, setCopiado] = useState(false);
  const fullUrl =
    typeof window !== 'undefined' ? `${window.location.origin}${url}` : url;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(fullUrl);
      setCopiado(true);
      toast.success('Link copiado');
      setTimeout(() => setCopiado(false), 2000);
    } catch {
      toast.error('Não foi possível copiar');
    }
  };

  const expiresLabel = expiresAt
    ? new Date(expiresAt).toLocaleDateString('pt-BR')
    : 'sem prazo';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-dialog sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Link de prestação de contas gerado</DialogTitle>
          <DialogDescription>
            Envie este link ao cliente para que ele assine digitalmente a declaração. Válido até {expiresLabel}.
          </DialogDescription>
        </DialogHeader>
        <div className="flex gap-2 items-center">
          <Input readOnly value={fullUrl} className="text-xs" />
          <Button
            size="sm"
            onClick={handleCopy}
            variant="outline"
            className="rounded-xl shrink-0"
          >
            {copiado ? (
              <Check className="size-3.5" />
            ) : (
              <Copy className="size-3.5" />
            )}
          </Button>
        </div>
        <DialogFooter>
          <Button
            size="sm"
            onClick={() => onOpenChange(false)}
            className="rounded-xl"
          >
            Fechar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
