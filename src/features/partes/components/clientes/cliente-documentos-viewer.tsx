'use client';

/**
 * Componente para visualização dos documentos do cliente armazenados no Backblaze
 */

import * as React from 'react';
import {
  FileText,
  Download,
  ExternalLink,
  Loader2,
  FolderOpen,
  FileImage,
  FileSpreadsheet,
  File
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';

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
    return <FileText className="h-5 w-5 text-red-500" />;
  }
  if (contentType.includes('image')) {
    return <FileImage className="h-5 w-5 text-blue-500" />;
  }
  if (contentType.includes('spreadsheet') || contentType.includes('excel')) {
    return <FileSpreadsheet className="h-5 w-5 text-green-500" />;
  }
  if (contentType.includes('word') || contentType.includes('document')) {
    return <FileText className="h-5 w-5 text-blue-600" />;
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

  // Abrir em nova aba
  const handleOpenInNewTab = (doc: DocumentFile) => {
    window.open(doc.url, '_blank');
  };

  // Preview de PDF
  const handlePreview = (doc: DocumentFile) => {
    if (doc.contentType.includes('pdf')) {
      setSelectedDoc(doc);
    } else {
      handleOpenInNewTab(doc);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        <span className="ml-2 text-muted-foreground">
          Carregando documentos...
        </span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <FolderOpen className="h-12 w-12 text-muted-foreground/50 mb-2" />
        <p className="text-sm text-muted-foreground">{error}</p>
      </div>
    );
  }

  if (documentos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <FolderOpen className="h-12 w-12 text-muted-foreground/50 mb-2" />
        <p className="text-sm text-muted-foreground">
          Nenhum documento encontrado para este cliente.
        </p>
      </div>
    );
  }

  return (
    <div className={className}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-muted-foreground">
          {documentos.length} documento{documentos.length !== 1 ? 's' : ''}
        </h3>
      </div>

      <ScrollArea className="h-[400px]">
        <div className="grid gap-3">
          {documentos.map((doc) => (
            <Card
              key={doc.key}
              className="group cursor-pointer transition-all hover:shadow-md"
              onClick={() => handlePreview(doc)}
            >
              <CardContent className="p-3">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-muted p-2">
                    {getFileIcon(doc.contentType)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate text-sm">{doc.name}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                      <span>{formatFileSize(doc.size)}</span>
                      <span>•</span>
                      <span>
                        {doc.lastModified
                          ? formatDistanceToNow(new Date(doc.lastModified), {
                              addSuffix: true,
                              locale: ptBR
                            })
                          : ''}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDownload(doc);
                      }}
                      title="Download"
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenInNewTab(doc);
                      }}
                      title="Abrir em nova aba"
                    >
                      <ExternalLink className="h-4 w-4" />
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
        <DialogContent className="max-w-4xl h-[80vh]">
          <DialogHeader>
            <DialogTitle>{selectedDoc?.name}</DialogTitle>
          </DialogHeader>
          <div className="flex-1 h-full min-h-0">
            {selectedDoc && (
              <iframe
                src={selectedDoc.url}
                className="w-full h-full rounded-md border"
                title={selectedDoc.name}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
