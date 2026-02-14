'use client';

/**
 * Página da Lixeira de Documentos
 * Lista documentos excluídos com opções de restaurar ou deletar permanentemente
 */

import * as React from 'react';
import { useRouter } from 'next/navigation';
import {
  Trash2,
  RotateCcw,
  AlertTriangle,
  FileText,
  ArrowLeft,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
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
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { DocumentoComUsuario } from '@/features/documentos';
import {
  actionListarLixeira,
  actionRestaurarDaLixeira,
  actionDeletarPermanentemente
} from '@/features/documentos';

export default function LixeiraPage() {
  const router = useRouter();
  const [documentos, setDocumentos] = React.useState<DocumentoComUsuario[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [actionLoading, setActionLoading] = React.useState<number | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [documentoParaDeletar, setDocumentoParaDeletar] = React.useState<DocumentoComUsuario | null>(null);

  // Buscar documentos na lixeira
  const fetchDocumentos = React.useCallback(async () => {
    try {
      const result = await actionListarLixeira();
      if (result.success) {
        setDocumentos(result.data || []);
      }
    } catch (error) {
      console.error('Erro ao buscar lixeira:', error);
      toast.error('Erro ao carregar documentos da lixeira');
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchDocumentos();
  }, [fetchDocumentos]);

  // Restaurar documento
  const handleRestaurar = async (documento: DocumentoComUsuario) => {
    setActionLoading(documento.id);
    try {
      const result = await actionRestaurarDaLixeira(documento.id);

      if (result.success) {
        toast.success('Documento restaurado com sucesso');
        setDocumentos((prev) => prev.filter((d) => d.id !== documento.id));
      } else {
        toast.error(result.error || 'Erro ao restaurar documento');
      }
    } catch (error) {
      console.error('Erro ao restaurar:', error);
      toast.error('Erro ao restaurar documento');
    } finally {
      setActionLoading(null);
    }
  };

  // Abrir diálogo de confirmação para deletar permanentemente
  const handleOpenDeleteDialog = (documento: DocumentoComUsuario) => {
    setDocumentoParaDeletar(documento);
    setDeleteDialogOpen(true);
  };

  // Deletar permanentemente
  const handleDeletarPermanentemente = async () => {
    if (!documentoParaDeletar) return;

    setActionLoading(documentoParaDeletar.id);
    setDeleteDialogOpen(false);

    try {
      const result = await actionDeletarPermanentemente(documentoParaDeletar.id);

      if (result.success) {
        toast.success('Documento deletado permanentemente');
        setDocumentos((prev) => prev.filter((d) => d.id !== documentoParaDeletar.id));
      } else {
        toast.error(result.error || 'Erro ao deletar documento');
      }
    } catch (error) {
      console.error('Erro ao deletar:', error);
      toast.error('Erro ao deletar documento');
    } finally {
      setActionLoading(null);
      setDocumentoParaDeletar(null);
    }
  };

  // Formatar data de exclusão
  const formatDeletedAt = (date: string | null) => {
    if (!date) return 'Data desconhecida';
    return formatDistanceToNow(new Date(date), {
      addSuffix: true,
      locale: ptBR,
    });
  };

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      {/* Header */}
      <div className="border-b p-4">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push('/documentos')}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight font-heading">Lixeira</h1>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-4">
        {loading ? (
          <div className="space-y-4">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        ) : documentos.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <div className="text-center">
              <Trash2 className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-semibold">Lixeira vazia</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Documentos excluídos aparecerão aqui
              </p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => router.push('/documentos')}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Voltar para Documentos
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Aviso */}
            <Card className="border-orange-200 bg-orange-50 dark:border-orange-900 dark:bg-orange-950/20">
              <CardContent className="flex items-center gap-3 p-4">
                <AlertTriangle className="h-5 w-5 text-orange-600" />
                <p className="text-sm text-orange-800 dark:text-orange-200">
                  Documentos na lixeira serão deletados permanentemente após 30 dias.
                </p>
              </CardContent>
            </Card>

            {/* Lista de documentos */}
            {documentos.map((documento) => (
              <Card key={documento.id}>
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <FileText className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <CardTitle className="text-base">
                          {documento.titulo || 'Documento sem título'}
                        </CardTitle>
                        <CardDescription>
                          Excluído {formatDeletedAt(documento.deleted_at)}
                        </CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRestaurar(documento)}
                        disabled={actionLoading === documento.id}
                      >
                        {actionLoading === documento.id ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <RotateCcw className="mr-2 h-4 w-4" />
                        )}
                        Restaurar
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleOpenDeleteDialog(documento)}
                        disabled={actionLoading === documento.id}
                      >
                        {actionLoading === documento.id ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="mr-2 h-4 w-4" />
                        )}
                        Excluir
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                {documento.descricao && (
                  <CardContent className="pt-0">
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {documento.descricao}
                    </p>
                  </CardContent>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Dialog de confirmação de exclusão permanente */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir permanentemente?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. O documento{' '}
              <strong>&quot;{documentoParaDeletar?.titulo || 'Sem título'}&quot;</strong>{' '}
              será excluído permanentemente e não poderá ser recuperado.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeletarPermanentemente}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir permanentemente
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
