'use client';

/**
 * Dialog para histórico de versões do documento
 */

import { cn } from '@/lib/utils';
import * as React from 'react';
import {
  History, Clock, User, RotateCcw, FileText} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AppBadge as Badge } from '@/components/ui/app-badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Heading } from '@/components/ui/typography';
import { toast } from 'sonner';
import { formatDistanceToNow, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useDocumentVersions } from '../hooks/use-document-versions';
import type { DocumentoVersaoComUsuario } from '../domain';

import { LoadingSpinner } from "@/components/ui/loading-state"
interface VersionHistoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  documentoId: number;
  onVersionRestored?: () => void;
}

export function VersionHistoryDialog({
  open,
  onOpenChange,
  documentoId,
  onVersionRestored,
}: VersionHistoryDialogProps) {
  const { versions, loading, restoreVersion } = useDocumentVersions(documentoId);
  const [selectedVersion, setSelectedVersion] = React.useState<DocumentoVersaoComUsuario | null>(null);
  const [restoreDialogOpen, setRestoreDialogOpen] = React.useState(false);
  const [restoring, setRestoring] = React.useState(false);

  // Restaurar versão
  // Restaurar versão
  const handleRestore = async () => {
    if (!selectedVersion) return;

    setRestoring(true);
    setRestoreDialogOpen(false);

    try {
      await restoreVersion(selectedVersion.id);

      toast.success(`Versão ${selectedVersion.versao} restaurada com sucesso`);
      onOpenChange(false);
      onVersionRestored?.();
    } catch (error) {
      console.error('Erro ao restaurar versão:', error);
      toast.error(error instanceof Error ? error.message : 'Erro ao restaurar versão');
    } finally {
      setRestoring(false);
      setSelectedVersion(null);
    }
  };

  const formatDate = (date: string) => {
    return format(new Date(date), "dd 'de' MMMM 'às' HH:mm", { locale: ptBR });
  };

  const formatRelative = (date: string) => {
    return formatDistanceToNow(new Date(date), { addSuffix: true, locale: ptBR });
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className={cn(/* design-system-escape: gap-2 → migrar para <Inline gap="tight"> */ "flex items-center gap-2")}>
              <History className="h-5 w-5" />
              Histórico de Versões
            </DialogTitle>
            <DialogDescription>
              Visualize e restaure versões anteriores do documento
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className={cn(/* design-system-escape: pr-4 padding direcional sem Inset equiv. */ "h-100 pr-4")}>
            {loading ? (
              <div className={cn(/* design-system-escape: space-y-4 → migrar para <Stack gap="default"> */ "space-y-4")}>
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-20 w-full" />
                ))}
              </div>
            ) : versions.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-center">
                <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                <Heading level="card">Sem histórico de versões</Heading>
                <p className={cn(/* design-system-escape: text-sm → migrar para <Text variant="body-sm"> */ "text-sm text-muted-foreground mt-1")}>
                  As versões serão salvas automaticamente conforme você edita
                </p>
              </div>
            ) : (
              <div className={cn(/* design-system-escape: space-y-3 sem token DS */ "space-y-3")}>
                {versions.map((version, index) => (
                  <div
                    key={version.id}
                    className={cn(/* design-system-escape: gap-4 → migrar para <Inline gap="default">; p-4 → migrar para <Inset variant="card-compact"> */ "flex items-start gap-4 p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors")}
                  >
                    {/* Timeline indicator */}
                    <div className="flex flex-col items-center">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className={cn(/* design-system-escape: text-sm → migrar para <Text variant="body-sm">; font-medium → className de <Text>/<Heading> */ "text-sm font-medium text-primary")}>
                          v{version.versao}
                        </span>
                      </div>
                      {index < versions.length - 1 && (
                        <div className="w-0.5 flex-1 bg-border mt-2" />
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className={cn(/* design-system-escape: gap-4 → migrar para <Inline gap="default"> */ "flex items-start justify-between gap-4")}>
                        <div>
                          <Heading level="subsection" className="truncate">
                            {version.titulo || 'Sem título'}
                          </Heading>
                          <div className={cn(/* design-system-escape: gap-3 gap sem token DS; text-sm → migrar para <Text variant="body-sm"> */ "flex items-center gap-3 mt-1 text-sm text-muted-foreground")}>
                            <span className={cn(/* design-system-escape: gap-1 gap sem token DS */ "flex items-center gap-1")}>
                              <Clock className="h-3.5 w-3.5" />
                              {formatRelative(version.created_at)}
                            </span>
                            {version.criador && (
                              <span className={cn(/* design-system-escape: gap-1 gap sem token DS */ "flex items-center gap-1")}>
                                <User className="h-3.5 w-3.5" />
                                {version.criador.nomeCompleto}
                              </span>
                            )}
                          </div>
                          <p className={cn(/* design-system-escape: text-xs → migrar para <Text variant="caption"> */ "text-xs text-muted-foreground mt-1")}>
                            {formatDate(version.created_at)}
                          </p>
                        </div>

                        {/* Actions */}
                        <div className={cn(/* design-system-escape: gap-2 → migrar para <Inline gap="tight"> */ "flex items-center gap-2")}>
                          {index === 0 && (
                            <Badge variant="secondary" className={cn(/* design-system-escape: text-xs → migrar para <Text variant="caption"> */ "text-xs")}>
                              Atual
                            </Badge>
                          )}
                          {index > 0 && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedVersion(version);
                                setRestoreDialogOpen(true);
                              }}
                              disabled={restoring}
                            >
                              <RotateCcw className="h-4 w-4 mr-1" />
                              Restaurar
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Dialog de confirmação de restauração */}
      <AlertDialog open={restoreDialogOpen} onOpenChange={setRestoreDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Restaurar versão?</AlertDialogTitle>
            <AlertDialogDescription>
              O documento será restaurado para a versão {selectedVersion?.versao}.
              Uma nova versão será criada com o conteúdo atual antes da restauração.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={restoring}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleRestore} disabled={restoring}>
              {restoring ? (
                <LoadingSpinner className="mr-2" />
              ) : (
                <RotateCcw className="h-4 w-4 mr-2" />
              )}
              Restaurar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
