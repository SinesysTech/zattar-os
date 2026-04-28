'use client';

import {
  cn } from '@/lib/utils';
import { Download,
  ExternalLink,
  FileX2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
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
      <DialogContent
        showCloseButton={false}
        data-density="comfortable"
        className="sm:max-w-5xl  overflow-hidden p-0 gap-0 max-h-[90vh] flex flex-col"
      >
        <DialogHeader className="px-6 py-4 border-b border-border/20 shrink-0">
          <DialogTitle>PDF de Teste Gerado com Sucesso</DialogTitle>
          <DialogDescription>Visualize o PDF gerado com dados fictícios para validar o layout do template.</DialogDescription>
        </DialogHeader>
        <div className={/* design-system-escape: p-0 → usar <Inset>; sm:p-0 sem equivalente DS */ "flex flex-1 flex-col overflow-hidden p-0 sm:p-0"}>
          {/* Preview do PDF ou mensagem de erro */}
          {previewPdfUrl && !iframeLoadFailed ? (
            <iframe
              src={previewPdfUrl}
              className="w-full flex-1 min-h-0 bg-muted/20"
              title="Preview do PDF de teste"
              onLoad={onIframeLoad}
              onError={onIframeError}
            />
          ) : (
            <div className={cn(/* design-system-escape: p-8 → usar <Inset> */ "flex-1 min-h-0 flex items-center justify-center p-8")}>
              <div className={cn(/* design-system-escape: space-y-4 → migrar para <Stack gap="default"> */ "text-center space-y-4 max-w-md")}>
                <FileX2 className="mx-auto h-12 w-12 text-muted-foreground" />
                <div>
                  <p className={cn(/* design-system-escape: font-medium → className de <Text>/<Heading> */ "font-medium text-foreground")}>
                    Não foi possível exibir o PDF aqui
                  </p>
                  <p className={cn(/* design-system-escape: text-sm → migrar para <Text variant="body-sm"> */ "text-sm text-muted-foreground mt-1")}>
                    O PDF foi gerado com sucesso, mas não pode ser embutido devido a restrições
                    de segurança (CORS/CSP). Use os botões abaixo para visualizar.
                  </p>
                </div>
                <div className={cn(/* design-system-escape: gap-2 → migrar para <Inline gap="tight"> */ "flex flex-col gap-2 sm:flex-row sm:justify-center")}>
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
        </div>
        <div className="px-6 py-4 border-t border-border/20 shrink-0 flex items-center justify-between gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Fechar</Button>
          <div className="flex items-center gap-2">
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
      </DialogContent>
    </Dialog>
  );
}
