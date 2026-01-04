'use client';

import { Download, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface PreviewPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  previewPdfUrl: string | null;
  iframeLoadFailed: boolean;
  templateName: string;
  onIframeLoad: () => void;
  onIframeError: () => void;
  onDownloadPdf: (url: string, filename: string) => void;
}

/**
 * PreviewPanel - Modal dialog for displaying generated PDF preview
 * Handles iframe loading, error states, and download/open actions
 */
export default function PreviewPanel({
  open,
  onOpenChange,
  previewPdfUrl,
  iframeLoadFailed,
  templateName,
  onIframeLoad,
  onIframeError,
  onDownloadPdf,
}: PreviewPanelProps) {
  const handleDownload = () => {
    if (previewPdfUrl) {
      onDownloadPdf(previewPdfUrl, `preview-teste-${templateName}-${Date.now()}.pdf`);
    }
  };

  const handleOpenInNewTab = () => {
    if (previewPdfUrl) {
      window.open(previewPdfUrl, '_blank');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>PDF de Teste Gerado com Sucesso</DialogTitle>
          <DialogDescription>
            Visualize o PDF gerado com dados fictícios para validar o layout do template.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          {/* Preview do PDF ou mensagem de erro */}
          {previewPdfUrl && (
            <>
              {!iframeLoadFailed ? (
                <div className="border rounded-lg overflow-hidden bg-muted/20">
                  <iframe
                    src={previewPdfUrl}
                    className="w-full h-[400px]"
                    title="Preview do PDF de teste"
                    onLoad={onIframeLoad}
                    onError={onIframeError}
                  />
                </div>
              ) : (
                <div className="border rounded-lg p-8 text-center bg-muted/10">
                  <div className="space-y-3">
                    <div className="text-muted-foreground">
                      <svg
                        className="mx-auto h-12 w-12 mb-2"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        />
                      </svg>
                      <p className="font-medium">Não foi possível exibir o PDF aqui</p>
                      <p className="text-sm text-muted-foreground/80 mt-1">
                        O PDF foi gerado com sucesso, mas não pode ser embutido devido a restrições
                        de segurança (CORS/CSP).
                      </p>
                    </div>
                    <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
                      <Button variant="outline" onClick={handleDownload}>
                        <Download className="mr-2 h-4 w-4" />
                        Baixar PDF
                      </Button>
                      <Button onClick={handleOpenInNewTab}>
                        <ExternalLink className="mr-2 h-4 w-4" />
                        Abrir em Nova Aba
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
        <DialogFooter className="flex flex-col gap-2 sm:flex-row sm:justify-end">
          <Button variant="outline" onClick={handleDownload}>
            <Download className="mr-2 h-4 w-4" />
            Baixar PDF
          </Button>
          <Button onClick={handleOpenInNewTab}>
            <ExternalLink className="mr-2 h-4 w-4" />
            Abrir em Nova Aba
          </Button>
          <Button variant="secondary" onClick={() => onOpenChange(false)}>
            Fechar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
