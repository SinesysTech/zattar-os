'use client';

/**
 * Componente para visualização dos documentos do cliente armazenados no Backblaze
 */

import { cn } from '@/lib/utils';
import * as React from 'react';
import {
  FileText, Download, FolderOpen, FileImage, FileSpreadsheet, File, Dot,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Heading, Text } from '@/components/ui/typography';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';

import { LoadingSpinner } from "@/components/ui/loading-state"
interface DocumentFile {
  key: string;
  name: string;
  size: number;
  lastModified: string;
  contentType: string;
  url: string;
}

interface ClienteDocumentosViewerProps {
  clienteId: number;
  className?: string;
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

function getFileIcon(contentType: string) {
  if (contentType.includes('pdf')) {
    return <FileText className="h-5 w-5 text-destructive" />;
  }
  if (contentType.includes('image')) {
    return <FileImage className="h-5 w-5 text-info" />;
  }
  if (contentType.includes('spreadsheet') || contentType.includes('excel')) {
    return <FileSpreadsheet className="h-5 w-5 text-success" />;
  }
  if (contentType.includes('word') || contentType.includes('document')) {
    return <FileText className="h-5 w-5 text-info" />;
  }
  return <File className="h-5 w-5 text-muted-foreground" />;
}

export function ClienteDocumentosViewer({
  clienteId,
  className
}: ClienteDocumentosViewerProps) {
  const [documentos, setDocumentos] = React.useState<DocumentFile[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [selectedDoc, setSelectedDoc] = React.useState<DocumentFile | null>(
    null
  );

  // Carregar documentos do cliente
  React.useEffect(() => {
    async function loadDocumentos() {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`/api/clientes/${clienteId}/documentos`);

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || 'Erro ao carregar documentos');
        }

        const data = await response.json();
        setDocumentos(data.documentos ?? []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro desconhecido');
      } finally {
        setLoading(false);
      }
    }

    if (clienteId) {
      loadDocumentos();
    }
  }, [clienteId]);

  // Download de arquivo
  const handleDownload = (doc: DocumentFile) => {
    const link = document.createElement('a');
    link.href = doc.url;
    link.download = doc.name;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Preview de PDF
  const handlePreview = (doc: DocumentFile) => {
    if (doc.contentType.includes('pdf')) {
      setSelectedDoc(doc);
    } else {
      window.open(doc.url, '_blank');
    }
  };

  if (loading) {
    return (
      <div className={cn("flex items-center justify-center py-8")}>
        <LoadingSpinner className="size-6 text-muted-foreground" />
        <span className="ml-2 text-muted-foreground">
          Carregando documentos...
        </span>
      </div>
    );
  }

  if (error) {
    return (
      <div className={cn("flex flex-col items-center justify-center py-8 text-center")}>
        <FolderOpen className="h-12 w-12 text-muted-foreground/50 mb-2" />
        <p className={cn("text-body-sm text-muted-foreground")}>{error}</p>
      </div>
    );
  }

  if (documentos.length === 0) {
    return (
      <div className={cn("flex flex-col items-center justify-center py-8 text-center")}>
        <FolderOpen className="h-12 w-12 text-muted-foreground/50 mb-2" />
        <p className={cn("text-body-sm text-muted-foreground")}>
          Nenhum documento encontrado para este cliente.
        </p>
      </div>
    );
  }

  return (
    <div className={className}>
      <div className="flex items-center justify-between mb-4">
        <Heading level="subsection" className={cn("text-body-sm text-muted-foreground")}>
          {documentos.length} documento{documentos.length !== 1 ? 's' : ''}
        </Heading>
      </div>

      <ScrollArea className="h-100">
        <div className={cn("grid inline-medium")}>
          {documentos.map((doc) => (
            <Card
              key={doc.key}
              className="group cursor-pointer transition-all hover:shadow-md"
              onClick={() => handlePreview(doc)}
            >
              <CardContent className={cn("inset-medium")}>
                <div className={cn("flex items-center inline-medium")}>
                  <div className={cn("rounded-lg bg-muted inset-tight")}>
                    {getFileIcon(doc.contentType)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className={cn( "font-medium truncate text-body-sm")}>{doc.name}</p>
                    <Text variant="caption" className="flex items-center gap-2 mt-0.5">
                      <span>{formatFileSize(doc.size)}</span>
                      <Dot className="size-3 shrink-0" aria-hidden />
                      <span>
                        {doc.lastModified
                          ? formatDistanceToNow(new Date(doc.lastModified), {
                            addSuffix: true,
                            locale: ptBR
                          })
                          : ''}
                      </span>
                    </Text>
                  </div>

                  <div className={cn("flex items-center inline-micro opacity-0 group-hover:opacity-100 transition-opacity")}>
                    <Button
                      variant="ghost"
                      size="icon" aria-label="Baixar"
                      className="h-8 w-8"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDownload(doc);
                      }}
                      title="Download"
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </ScrollArea>

      {/* Dialog de Preview de PDF */}
      <Dialog open={!!selectedDoc} onOpenChange={() => setSelectedDoc(null)}>
        <DialogContent className={cn("max-w-[90vw] h-[90vh] flex flex-col inset-none inline-none")}>
          <DialogHeader className={cn("inset-card-compact border-b")}>
            <DialogTitle>{selectedDoc?.name}</DialogTitle>
            <DialogDescription className="sr-only">
              Visualização do documento selecionado em um iframe com ações para abrir ou fechar.
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 w-full min-h-0 bg-muted/20">
            {selectedDoc && (
              <iframe
                src={selectedDoc.url}
                className="w-full h-full border-none"
                title={selectedDoc.name}
              />
            )}
          </div>
          <DialogFooter className="border-t px-4 py-3">
            {selectedDoc && (
              <Button variant="outline" size="sm" asChild>
                <a href={selectedDoc.url} target="_blank" rel="noopener noreferrer">
                  Abrir em nova aba
                </a>
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={() => setSelectedDoc(null)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
