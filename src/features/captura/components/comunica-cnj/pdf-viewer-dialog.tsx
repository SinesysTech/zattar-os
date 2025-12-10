'use client';

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
import { Download, Loader2, AlertCircle, ExternalLink } from 'lucide-react';
import { actionObterCertidao } from '../../actions/comunica-cnj-actions';

interface PdfViewerDialogProps {
  hash: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Dialog para visualizar certidão PDF do CNJ
 */
export function PdfViewerDialog({ hash, open, onOpenChange }: PdfViewerDialogProps) {
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!hash || !open) {
      setPdfUrl(null);
      setError(null);
      return;
    }

    const fetchPdf = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const result = await actionObterCertidao(hash);

        if (!result.success || !result.data) {
          throw new Error(result.error || 'Erro ao carregar certidão');
        }

        // Converter base64 para Blob
        const byteCharacters = atob(result.data);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: 'application/pdf' });
        
        const url = URL.createObjectURL(blob);
        setPdfUrl(url);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro ao carregar certidão');
      } finally {
        setIsLoading(false);
      }
    };

    fetchPdf();

    // Cleanup: revogar blob URL ao fechar
    return () => {
      if (pdfUrl && pdfUrl.startsWith('blob:')) {
        URL.revokeObjectURL(pdfUrl);
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps -- pdfUrl é gerenciado internamente pelo effect
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
      <DialogContent className="max-w-4xl h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Certidão da Comunicação</DialogTitle>
          <DialogDescription>
            Visualização da certidão em PDF
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 flex flex-col min-h-0">
          {isLoading && (
            <div className="flex-1 flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              <span className="ml-3 text-muted-foreground">Carregando certidão...</span>
            </div>
          )}

          {error && (
            <Alert variant="destructive" className="m-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {pdfUrl && !isLoading && !error && (
            <>
              <div className="flex gap-2 mb-4">
                <Button variant="outline" size="sm" onClick={handleDownload}>
                  <Download className="h-4 w-4 mr-2" />
                  Baixar PDF
                </Button>
                <Button variant="outline" size="sm" asChild>
                  <a href={pdfUrl} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Abrir em Nova Aba
                  </a>
                </Button>
              </div>

              <div className="flex-1 border rounded-lg overflow-hidden bg-muted">
                <iframe
                  src={pdfUrl}
                  className="w-full h-full"
                  title="Certidão PDF"
                />
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
