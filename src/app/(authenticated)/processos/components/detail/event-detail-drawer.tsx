'use client';

/**
 * EventDetailDrawer — Dialog de detalhes completos de um evento da timeline.
 * ============================================================================
 * Migrado de Sheet para Dialog (política do projeto: "Sem Sheet, usar Dialog").
 * Exibe metadados, informações de assinatura/sigilo, lista de arquivos e botão
 * de download do pacote completo.
 * ============================================================================
 */

import { cn } from '@/lib/utils';
import { useState } from 'react';
import { Download } from 'lucide-react';
import { toast } from 'sonner';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { actionGerarUrlDownload } from '@/app/(authenticated)/documentos';

import { EventMetadata } from './event-metadata';
import { EventSignatureInfo } from './event-signature-info';
import { EventAttachmentsList } from './event-attachments-list';
import type { TimelineItemUnificado } from '../timeline/types';

interface EventDetailDrawerProps {
  item: TimelineItemUnificado | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EventDetailDrawer({
  item,
  open,
  onOpenChange,
}: EventDetailDrawerProps) {
  const [isDownloading, setIsDownloading] = useState(false);

  async function handleDownload(key: string, fileName: string) {
    setIsDownloading(true);
    try {
      const resultado = await actionGerarUrlDownload(key);

      if (!resultado.success || !resultado.data?.url) {
        toast.error('Não foi possível gerar o link de download.');
        return;
      }

      const link = document.createElement('a');
      link.href = resultado.data.url;
      link.download = fileName;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch {
      toast.error('Erro ao baixar o arquivo. Tente novamente.');
    } finally {
      setIsDownloading(false);
    }
  }

  async function handleDownloadAll() {
    if (!item?.backblaze) return;
    await handleDownload(item.backblaze.key, item.backblaze.fileName);
  }

  function handleOpen(_fileId: string) {
    // A abertura real é via <a href> no EventAttachmentsList.
    // Este callback existe para extensibilidade (ex: analytics, logging).
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={cn(/* design-system-escape: p-0 → usar <Inset> */ " max-w-xl max-h-[90vh] p-0 flex flex-col")}>
        <DialogHeader className={cn(/* design-system-escape: px-6 padding direcional sem Inset equiv.; py-5 padding direcional sem Inset equiv. */ "px-6 py-5 border-b border-border/30 shrink-0")}>
          <DialogTitle className={cn(/* design-system-escape: text-lg → migrar para <Text variant="body-lg">; font-semibold → className de <Text>/<Heading>; tracking-tight sem token DS */ "text-lg font-semibold tracking-tight")}>
            Detalhes do Evento
          </DialogTitle>
          <DialogDescription className="sr-only">
            Metadados, informacoes de assinatura, anexos e download do pacote do evento.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto">
          {item && (
            <>
              <EventMetadata item={item} />

              <EventSignatureInfo
                signatario={item.nomeSignatario}
                isSigiloso={item.documentoSigiloso}
              />

              <EventAttachmentsList
                item={item}
                onDownload={handleDownload}
                onOpen={handleOpen}
                isLoading={isDownloading}
              />
            </>
          )}
        </div>

        {item?.backblaze && (
          <DialogFooter className={cn(/* design-system-escape: p-6 → migrar para <Inset variant="dialog"> */ "border-t border-border/30 bg-muted/30 p-6 mt-auto shrink-0")}>
            <Button
              className={cn(/* design-system-escape: gap-2 → migrar para <Inline gap="tight"> */ "w-full gap-2")}
              onClick={handleDownloadAll}
              disabled={isDownloading}
            >
              <Download className="size-4" />
              {isDownloading ? 'Baixando...' : 'Baixar Pacote Completo'}
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
