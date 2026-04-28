'use client';

import { cn } from '@/lib/utils';
import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Text } from '@/components/ui/typography';
import { Download, AlertCircle, ExternalLink } from 'lucide-react';
import { LoadingSpinner } from '@/components/ui/loading-state';
import { actionObterCertidao } from '../actions/comunica-cnj-actions';

interface PdfViewerDialogProps {
  hash: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Dialog para visualizar certidão PDF do CNJ.
 * Usa `` em todas as resoluções — padrão do design system.
 */
export function PdfViewerDialog({ hash, open, onOpenChange }: PdfViewerDialogProps) {
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!hash || !open) {
      setPdfUrl((currentUrl) => {
        if (currentUrl?.startsWith('blob:')) {
          URL.revokeObjectURL(currentUrl);
        }

        return null;
      });
      setError(null);
      return;
    }

    let isActive = true;
    let objectUrl: string | null = null;

    const fetchPdf = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const result = await actionObterCertidao(hash);

        if (!result.success || !result.data) {
          throw new Error(result.error || 'Erro ao carregar certidão');
        }

        const byteCharacters = atob(result.data);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: 'application/pdf' });

        const url = URL.createObjectURL(blob);
        objectUrl = url;

        if (!isActive) {
          URL.revokeObjectURL(url);
          return;
        }

        setPdfUrl((currentUrl) => {
          if (currentUrl && currentUrl !== url && currentUrl.startsWith('blob:')) {
            URL.revokeObjectURL(currentUrl);
          }

          return url;
        });
      } catch (err) {
        if (isActive) {
          setError(err instanceof Error ? err.message : 'Erro ao carregar certidão');
        }
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    };

    fetchPdf();

    return () => {
      isActive = false;

      if (objectUrl?.startsWith('blob:')) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [hash, open]);

  const handleDownload = () => {
    if (!pdfUrl) return;

    const link = document.createElement('a');
    link.href = pdfUrl;
    link.download = `certidao-${hash}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className=" flex h-[90vh] max-w-4xl flex-col">
        <DialogHeader>
          <DialogTitle>Certidão da Comunicação</DialogTitle>
          <DialogDescription>Visualização da certidão em PDF</DialogDescription>
        </DialogHeader>

        <div className="flex min-h-0 flex-1 flex-col">
          {isLoading && (
            <div className={cn(/* design-system-escape: gap-3 gap sem token DS */ "flex flex-1 items-center justify-center gap-3")}>
              <LoadingSpinner className="size-8" />
              <Text variant="caption" className="text-muted-foreground">
                Carregando certidão...
              </Text>
            </div>
          )}

          {error && (
            <Alert variant="destructive" className={cn(/* design-system-escape: m-4 margin sem primitiva DS */ "m-4")}>
              <AlertCircle className="size-4" aria-hidden />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {pdfUrl && !isLoading && !error && (
            <>
              <div className={cn(/* design-system-escape: gap-2 → migrar para <Inline gap="tight"> */ "mb-4 flex gap-2")}>
                <Button variant="outline" size="sm" onClick={handleDownload}>
                  <Download className="mr-2 size-4" aria-hidden />
                  Baixar PDF
                </Button>
                <Button variant="outline" size="sm" asChild>
                  <a href={pdfUrl} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="mr-2 size-4" aria-hidden />
                    Abrir em Nova Aba
                  </a>
                </Button>
              </div>

              <div className="flex-1 overflow-hidden rounded-lg border border-border/40 bg-muted/40">
                <iframe src={pdfUrl} className="size-full" title="Certidão PDF" />
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
