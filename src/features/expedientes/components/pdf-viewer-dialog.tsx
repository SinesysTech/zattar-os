'use client';

import * as React from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Loader2, FileText } from 'lucide-react';

interface PdfViewerDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    /** Chave (key) do arquivo no Backblaze B2 */
    fileKey: string | null;
    documentTitle?: string;
}

export function PdfViewerDialog({
    open,
    onOpenChange,
    fileKey,
    documentTitle = 'Documento',
}: PdfViewerDialogProps) {
    const [isLoading, setIsLoading] = React.useState(true);
    const [error, setError] = React.useState<string | null>(null);
    const [presignedUrl, setPresignedUrl] = React.useState<string | null>(null);

    // Gerar URL assinada quando o diálogo abrir
    React.useEffect(() => {
        if (open && fileKey) {
            setIsLoading(true);
            setError(null);
            setPresignedUrl(null);

            // Buscar URL assinada
            fetch('/api/documentos/presigned-url', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ key: fileKey }),
            })
                .then((response) => {
                    if (!response.ok) {
                        throw new Error('Erro ao gerar URL de acesso ao documento');
                    }
                    return response.json();
                })
                .then((data) => {
                    setPresignedUrl(data.url);
                })
                .catch((err) => {
                    console.error('Erro ao buscar URL assinada:', err);
                    setError('Erro ao gerar acesso ao documento. Tente novamente.');
                    setIsLoading(false);
                });
        } else if (open && !fileKey) {
            setError('Documento não disponível');
            setIsLoading(false);
        }
    }, [open, fileKey]);

    const handleIframeLoad = () => {
        setIsLoading(false);
    };

    const handleIframeError = () => {
        setIsLoading(false);
        setError('Erro ao carregar o documento. Verifique se o arquivo existe.');
    };

    if (!fileKey) {
        return (
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className="max-w-4xl h-[90vh] flex flex-col">
                    <DialogHeader>
                        <DialogTitle>{documentTitle}</DialogTitle>
                        <DialogDescription>
                            Visualização do documento anexado ao expediente.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="flex flex-col items-center justify-center flex-1 gap-4">
                        <FileText className="h-16 w-16 text-muted-foreground" />
                        <p className="text-muted-foreground">Documento não disponível</p>
                    </div>
                </DialogContent>
            </Dialog>
        );
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl h-[90vh] flex flex-col p-0">
                <DialogHeader className="px-6 pt-6 pb-4 shrink-0">
                    <DialogTitle>{documentTitle}</DialogTitle>
                    <DialogDescription>
                        Visualização do documento anexado ao expediente.
                    </DialogDescription>
                </DialogHeader>

                <div className="relative flex-1 w-full min-h-0 px-6 pb-6">
                    {isLoading && (
                        <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-10">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        </div>
                    )}

                    {error ? (
                        <div className="flex flex-col items-center justify-center h-full gap-4">
                            <FileText className="h-16 w-16 text-destructive" />
                            <p className="text-destructive text-center">{error}</p>
                        </div>
                    ) : (
                        presignedUrl && (
                            <iframe
                                src={`${presignedUrl}#toolbar=0&navpanes=0&scrollbar=1`}
                                className="w-full h-full border border-border rounded-md"
                                title={documentTitle}
                                onLoad={handleIframeLoad}
                                onError={handleIframeError}
                            />
                        )
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
