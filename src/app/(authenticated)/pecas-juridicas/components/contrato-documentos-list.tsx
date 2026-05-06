'use client';

import { cn } from '@/lib/utils';
import * as React from 'react';
import { useRouter } from 'next/navigation';
import {
  FileText,
  Download,
  ExternalLink,
  Trash2,
  MoreHorizontal,
  FileDown,
  Loader2,
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

import { Button } from '@/components/ui/button';
import { AppBadge } from '@/components/ui/app-badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';

import {
  actionListarDocumentosDoContrato,
  actionDesvincularItemDoContrato,
} from '../actions';
import { TIPO_PECA_LABELS, type ContratoDocumento } from '../domain';

import {
  actionBuscarDocumento,
  exportTextToPdf,
  exportToDocx
} from '@/app/(authenticated)/documentos';
import { Text } from '@/components/ui/typography';


// =============================================================================
// TYPES
// =============================================================================

interface ContratoDocumentosListProps {
  contratoId: number;
}

// =============================================================================
// COMPONENT
// =============================================================================

export function ContratoDocumentosList({ contratoId }: ContratoDocumentosListProps) {
  const router = useRouter();

  // State
  const [documentos, setDocumentos] = React.useState<ContratoDocumento[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [documentoToDelete, setDocumentoToDelete] = React.useState<ContratoDocumento | null>(null);
  const [deleting, setDeleting] = React.useState(false);
  const [exporting, setExporting] = React.useState<'pdf' | 'docx' | null>(null);

  // Carregar documentos
  const loadDocumentos = React.useCallback(async () => {
    setLoading(true);
    try {
      const response = await actionListarDocumentosDoContrato({
        contratoId,
        pageSize: 100,
      });

      if (response.success) {
        setDocumentos(response.data.data);
      } else {
        toast.error('Erro ao carregar documentos', {
          description: response.message,
        });
      }
    } finally {
      setLoading(false);
    }
  }, [contratoId]);

  React.useEffect(() => {
    loadDocumentos();
  }, [loadDocumentos]);

  // Handlers
  const handleOpenDocument = (doc: ContratoDocumento) => {
    if (doc.arquivo) {
      window.open(doc.arquivo.b2Url, '_blank');
    } else if (doc.documentoId) {
      router.push(`/app/documentos/${doc.documentoId}`);
    }
  };

  const handleExportPDF = async (documentoId: number) => {
    if (exporting) return;
    setExporting('pdf');
    try {
      const response = await actionBuscarDocumento(documentoId);
      if (response.success && response.data) {
        await exportTextToPdf(response.data.conteudo, response.data.titulo);
        toast.success('PDF exportado com sucesso');
      } else {
        toast.error('Erro ao carregar documento para exportação', {
          description: response.error,
        });
      }
    } catch (error) {
      console.error('Erro ao exportar PDF:', error);
      toast.error('Erro ao exportar PDF');
    } finally {
      setExporting(null);
    }
  };

  const handleExportDOCX = async (documentoId: number) => {
    if (exporting) return;
    setExporting('docx');
    try {
      const response = await actionBuscarDocumento(documentoId);
      if (response.success && response.data) {
        await exportToDocx(response.data.conteudo, response.data.titulo);
        toast.success('DOCX exportado com sucesso');
      } else {
        toast.error('Erro ao carregar documento para exportação', {
          description: response.error,
        });
      }
    } catch (error) {
      console.error('Erro ao exportar DOCX:', error);
      toast.error('Erro ao exportar DOCX');
    } finally {
      setExporting(null);
    }
  };

  const handleDeleteClick = (documento: ContratoDocumento) => {
    setDocumentoToDelete(documento);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!documentoToDelete) return;

    setDeleting(true);
    try {
      // Usa o ID do vínculo (ContratoDocumento.id) para desvincular
      const response = await actionDesvincularItemDoContrato(
        documentoToDelete.id,
        contratoId
      );

      if (response.success) {
        toast.success('Documento desvinculado com sucesso');
        loadDocumentos();
      } else {
        toast.error('Erro ao desvincular documento', {
          description: response.message,
        });
      }
    } finally {
      setDeleting(false);
      setDeleteDialogOpen(false);
      setDocumentoToDelete(null);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className={cn(/* design-system-escape: space-y-3 sem token DS */ "space-y-3")}>
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    );
  }

  // Empty state
  if (documentos.length === 0) {
    return (
      <div className={cn(/* design-system-escape: py-12 padding direcional sem Inset equiv. */ "py-12 text-center")}>
        <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <p className="text-muted-foreground">Nenhum documento vinculado a este contrato</p>
        <p className={cn("text-body-sm text-muted-foreground mt-1")}>
          Use o botão &ldquo;Novo Documento&rdquo; ou &ldquo;Gerar Peça&rdquo; para adicionar.
        </p>
      </div>
    );
  }

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Título</TableHead>
            <TableHead>Tipo</TableHead>
            <TableHead>Modelo</TableHead>
            <TableHead>Criado em</TableHead>
            <TableHead className="w-25">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {documentos.map((doc) => {
            const titulo = doc.documento?.titulo || doc.arquivo?.nome || `Documento #${doc.id}`;
            const tipo = doc.arquivo ? (doc.arquivo.tipoMime.includes('pdf') ? 'PDF' : 'Arquivo') : 'Documento';

            return (
              <TableRow key={doc.id}>
                <TableCell>
                  <button
                    onClick={() => handleOpenDocument(doc)}
                    className={cn(/* design-system-escape: font-medium → className de <Text>/<Heading> */ "text-left hover:underline font-medium flex items-center inline-tight")}
                  >
                    {doc.arquivo && <Text variant="caption" className="px-1.5 py-0.5 rounded bg-muted">FILE</Text>}
                    {titulo}
                  </button>
                </TableCell>
                <TableCell>
                  {doc.tipoPeca ? (
                    <AppBadge variant="secondary">
                      {TIPO_PECA_LABELS[doc.tipoPeca]}
                    </AppBadge>
                  ) : (
                    <Text variant="caption">{tipo}</Text>
                  )}
                </TableCell>
                <TableCell>
                  {doc.modelo ? (
                    <span className={cn("text-body-sm")}>{doc.modelo.titulo}</span>
                  ) : (
                    <span className={cn("text-muted-foreground text-body-sm")}>Manual/Upload</span>
                  )}
                </TableCell>
                <TableCell>
                  {format(new Date(doc.createdAt), "dd/MM/yyyy 'às' HH:mm", {
                    locale: ptBR,
                  })}
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" aria-label="Mais opções">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleOpenDocument(doc)}>
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Abrir
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      {doc.documentoId && (
                        <>
                          <DropdownMenuItem onClick={() => handleExportPDF(doc.documentoId!)} disabled={exporting === 'pdf'}>
                            {exporting === 'pdf' ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <FileDown className="h-4 w-4 mr-2" />}
                            Exportar PDF
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleExportDOCX(doc.documentoId!)} disabled={exporting === 'docx'}>
                            {exporting === 'docx' ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Download className="h-4 w-4 mr-2" />}
                            Exportar DOCX
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                        </>
                      )}
                      <DropdownMenuItem
                        onClick={() => handleDeleteClick(doc)}
                        className="text-destructive focus:text-destructive"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Desvincular
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Desvincular documento</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja desvincular este item do contrato?
              O arquivo original não será excluído.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? 'Desvinculando...' : 'Desvincular'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
