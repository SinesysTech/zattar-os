'use client';
import { useState, useEffect, useRef } from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { Button } from '@/components/ui/button';
import { Download, ExternalLink, Loader2, X } from 'lucide-react';
import { cn } from '@/lib/utils';
interface PDFViewerProps { hash: string; open: boolean; onOpenChange: (open: boolean) => void; title?: string; }
export function PDFViewer({ hash, open, onOpenChange, title = 'Certidão' }: PDFViewerProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pdfBlobUrl, setPdfBlobUrl] = useState<string | null>(null);
  const blobUrlRef = useRef<string | null>(null);
  const pdfApiUrl = `/api/comunica-cnj/certidao/${hash}`;
  useEffect(() => { if (!open || !hash) { if (blobUrlRef.current) { URL.revokeObjectURL(blobUrlRef.current); blobUrlRef.current = null; setPdfBlobUrl(null); } return; } const loadPDF = async () => { setLoading(true); setError(null); try { const response = await fetch(pdfApiUrl); if (!response.ok) { throw new Error(`Erro ao carregar PDF: ${response.status} ${response.statusText}`); } const blob = await response.blob(); if (blob.type !== 'application/pdf' && blob.size === 0) { throw new Error('Arquivo PDF inválido ou vazio'); } if (blobUrlRef.current) { URL.revokeObjectURL(blobUrlRef.current); } const newBlobUrl = URL.createObjectURL(blob); blobUrlRef.current = newBlobUrl; setPdfBlobUrl(newBlobUrl); setLoading(false); } catch (err) { console.error('[PDFViewer] Erro ao carregar PDF:', err); setError(err instanceof Error ? err.message : 'Erro ao carregar o PDF'); setLoading(false); } }; loadPDF(); return () => { if (blobUrlRef.current) { URL.revokeObjectURL(blobUrlRef.current); blobUrlRef.current = null; } }; }, [open, hash, pdfApiUrl]);
  const handleDownload = () => { if (pdfBlobUrl) { const link = document.createElement('a'); link.href = pdfBlobUrl; link.download = `certidao-${hash}.pdf`; document.body.appendChild(link); link.click(); document.body.removeChild(link); } else { const link = document.createElement('a'); link.href = pdfApiUrl; link.download = `certidao-${hash}.pdf`; link.target = '_blank'; document.body.appendChild(link); link.click(); document.body.removeChild(link); } };
  const handleOpenInNewTab = () => { window.open(pdfApiUrl, '_blank', 'noopener,noreferrer'); };
  const handleRetry = () => { setLoading(true); setError(null); setPdfBlobUrl(null); };
  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <DialogPrimitive.Content className={cn("fixed left-[2.5vw] top-[2.5vh] z-50 w-[95vw] h-[95vh] p-0 flex flex-col border bg-card shadow-xl rounded-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95")}> 
          <div className="px-6 py-4 border-b bg-background flex items-center justify-between shrink-0">
            <DialogPrimitive.Title className="text-lg font-semibold leading-none tracking-tight">{title}</DialogPrimitive.Title>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handleDownload} className="gap-2"><Download className="h-4 w-4" />Download</Button>
              <Button variant="outline" size="sm" onClick={handleOpenInNewTab} className="gap-2"><ExternalLink className="h-4 w-4" />Nova Guia</Button>
              <DialogPrimitive.Close className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
                <X className="h-4 w-4" />
                <span className="sr-only">Fechar</span>
              </DialogPrimitive.Close>
            </div>
          </div>
          <div className="flex-1 relative overflow-hidden bg-background">
            {loading && (<div className="absolute inset-0 flex items-center justify-center bg-background z-20"><div className="flex flex-col items-center gap-3"><Loader2 className="h-8 w-8 animate-spin text-primary" /><p className="text-sm text-muted-foreground font-medium">Carregando PDF...</p></div></div>)}
            {error && (<div className="absolute inset-0 flex items-center justify-center bg-background z-20"><div className="flex flex-col items-center gap-4 text-center p-6 max-w-md"><p className="text-sm text-destructive font-medium">{error}</p><div className="flex gap-2"><Button variant="outline" size="sm" onClick={handleRetry}>Tentar Novamente</Button><Button variant="outline" size="sm" onClick={handleDownload}><Download className="h-4 w-4 mr-2" />Baixar PDF</Button></div></div></div>)}
            {pdfBlobUrl && (<iframe id={`pdf-iframe-${hash}`} src={pdfBlobUrl} className="w-full h-full border-0" title={`PDF ${hash}`} onLoad={() => { setLoading(false); setError(null); }} onError={() => { setLoading(false); setError('Erro ao exibir o PDF. Tente fazer o download ou abrir em nova guia.'); }} style={{ minHeight: '100%' }} />)}
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

