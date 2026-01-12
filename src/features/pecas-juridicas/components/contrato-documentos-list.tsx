'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import {
  FileText,
  Download,
  ExternalLink,
  Trash2,
  MoreHorizontal,
  FileDown,
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
  actionDesvincularDocumentoDoContrato,
} from '../actions';
import { TIPO_PECA_LABELS, type ContratoDocumento } from '../domain';

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
  const handleOpenDocument = (documentoId: number) => {
    router.push(`/app/documentos/${documentoId}`);
  };

  const handleExportPDF = async (documentoId: number) => {
    // TODO: Implementar exportação direta
    router.push(`/app/documentos/${documentoId}?export=pdf`);
  };

  const handleExportDOCX = async (documentoId: number) => {
    // TODO: Implementar exportação direta
    router.push(`/app/documentos/${documentoId}?export=docx`);
  };

  const handleDeleteClick = (documento: ContratoDocumento) => {
    setDocumentoToDelete(documento);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!documentoToDelete) return;

    setDeleting(true);
    try {
      const response = await actionDesvincularDocumentoDoContrato(
        contratoId,
        documentoToDelete.documentoId
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
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    );
  }

  // Empty state
  if (documentos.length === 0) {
    return (
      <div className="py-12 text-center">
        <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <p className="text-muted-foreground">Nenhum documento vinculado a este contrato</p>
        <p className="text-sm text-muted-foreground mt-1">
          Use o botão &ldquo;Gerar Peça&rdquo; para criar um documento a partir de um modelo
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
          {documentos.map((doc) => (
            <TableRow key={doc.id}>
              <TableCell>
                <button
                  onClick={() => handleOpenDocument(doc.documentoId)}
                  className="text-left hover:underline font-medium"
                >
                  {doc.documento?.titulo || `Documento #${doc.documentoId}`}
                </button>
              </TableCell>
              <TableCell>
                {doc.tipoPeca ? (
                  <AppBadge variant="secondary">
                    {TIPO_PECA_LABELS[doc.tipoPeca]}
                  </AppBadge>
                ) : (
                  <span className="text-muted-foreground">-</span>
                )}
              </TableCell>
              <TableCell>
                {doc.modelo ? (
                  <span className="text-sm">{doc.modelo.titulo}</span>
                ) : (
                  <span className="text-muted-foreground text-sm">Manual</span>
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
                    <Button variant="ghost" size="icon">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleOpenDocument(doc.documentoId)}>
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Abrir
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => handleExportPDF(doc.documentoId)}>
                      <FileDown className="h-4 w-4 mr-2" />
                      Exportar PDF
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleExportDOCX(doc.documentoId)}>
                      <Download className="h-4 w-4 mr-2" />
                      Exportar DOCX
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
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
          ))}
        </TableBody>
      </Table>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Desvincular documento</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja desvincular este documento do contrato?
              O documento não será excluído, apenas a vinculação será removida.
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
