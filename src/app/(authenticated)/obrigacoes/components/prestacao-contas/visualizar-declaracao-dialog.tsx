'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ExternalLink, Download } from 'lucide-react';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pdfUrl: string;
  tituloProcesso?: string;
}

export function VisualizarDeclaracaoDialog({
  open,
  onOpenChange,
  pdfUrl,
  tituloProcesso,
}: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-dialog max-w-4xl max-h-[90vh] flex flex-col p-0 overflow-hidden">
        <DialogHeader className="p-6 pb-3 shrink-0">
          <DialogTitle>Declaração de prestação de contas assinada</DialogTitle>
          <DialogDescription>
            {tituloProcesso
              ? `Processo ${tituloProcesso} — documento assinado digitalmente pelo cliente.`
              : 'Documento assinado digitalmente pelo cliente.'}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 px-6 min-h-0">
          <iframe
            src={pdfUrl}
            className="w-full h-full min-h-[60vh] rounded-lg border border-border"
            title="Declaração de prestação de contas assinada"
          />
        </div>

        <DialogFooter className="p-6 pt-3 shrink-0 gap-2">
          <Button
            variant="outline"
            size="sm"
            asChild
            className="rounded-xl gap-1.5"
          >
            <a href={pdfUrl} download target="_blank" rel="noopener noreferrer">
              <Download className="size-3.5" />
              Baixar
            </a>
          </Button>
          <Button
            variant="outline"
            size="sm"
            asChild
            className="rounded-xl gap-1.5"
          >
            <a href={pdfUrl} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="size-3.5" />
              Abrir em nova aba
            </a>
          </Button>
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
