'use client';

import { cn } from '@/lib/utils';
import {
  DialogClose,
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
      <DialogContent className={cn(/* design-system-escape: p-0 → usar <Inset> */ " max-w-4xl max-h-[90vh] flex flex-col p-0 overflow-hidden")}>
        <DialogHeader className={cn(/* design-system-escape: pb-3 padding direcional sem Inset equiv. */ "inset-dialog pb-3 shrink-0")}>
          <DialogTitle>Declaração de prestação de contas assinada</DialogTitle>
          <DialogDescription>
            {tituloProcesso
              ? `Processo ${tituloProcesso} — documento assinado digitalmente pelo cliente.`
              : 'Documento assinado digitalmente pelo cliente.'}
          </DialogDescription>
        </DialogHeader>

        <div className={cn(/* design-system-escape: px-6 padding direcional sem Inset equiv. */ "flex-1 px-6 min-h-0")}>
          <iframe
            src={pdfUrl}
            className="w-full h-full min-h-[60vh] rounded-lg border border-border"
            title="Declaração de prestação de contas assinada"
          />
        </div>

        <DialogFooter className={cn(/* design-system-escape: pt-3 padding direcional sem Inset equiv. */ "inset-dialog pt-3 shrink-0 inline-tight")}>
          <Button
            variant="outline"
            size="sm"
            asChild
            className={cn("rounded-xl inline-snug")}
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
            className={cn("rounded-xl inline-snug")}
          >
            <a href={pdfUrl} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="size-3.5" />
              Abrir em nova aba
            </a>
          </Button>
          <Button
            size="sm"
            className="rounded-xl"
            asChild
          >
            <DialogClose>Fechar</DialogClose>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
