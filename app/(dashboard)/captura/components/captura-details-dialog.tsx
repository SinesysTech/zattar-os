'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trash2 } from 'lucide-react';
import type { CapturaLog, TipoCaptura, StatusCaptura } from '@/backend/types/captura/capturas-log-types';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface CapturaDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  captura: CapturaLog | null;
  onDelete?: () => void;
}

const formatarDataHora = (dataISO: string | null): string => {
  if (!dataISO) return '-';
  try {
    const data = new Date(dataISO);
    return data.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  } catch {
    return '-';
  }
};

const formatarTipoCaptura = (tipo: TipoCaptura): string => {
  const tipos: Record<TipoCaptura, string> = {
    acervo_geral: 'Acervo Geral',
    arquivados: 'Arquivados',
    audiencias: 'Audiências',
    pendentes: 'Pendentes',
  };
  return tipos[tipo] || tipo;
};

const StatusBadge = ({ status }: { status: StatusCaptura }) => {
  const variants: Record<StatusCaptura, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
    pending: { label: 'Pendente', variant: 'outline' },
    in_progress: { label: 'Em Progresso', variant: 'secondary' },
    completed: { label: 'Concluída', variant: 'default' },
    failed: { label: 'Falhou', variant: 'destructive' },
  };

  const { label, variant } = variants[status] || { label: status, variant: 'outline' };

  return <Badge variant={variant}>{label}</Badge>;
};

export function CapturaDetailsDialog({
  open,
  onOpenChange,
  captura,
  onDelete,
}: CapturaDetailsDialogProps) {
  if (!captura) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Detalhes da Captura #{captura.id}</DialogTitle>
          <DialogDescription>
            Informações completas sobre a captura realizada
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {/* Informações Básicas */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Informações Básicas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">ID</p>
                  <p className="text-sm font-mono">#{captura.id}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Tipo de Captura</p>
                  <p className="text-sm">{formatarTipoCaptura(captura.tipo_captura)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Status</p>
                  <StatusBadge status={captura.status} />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Advogado ID</p>
                  <p className="text-sm">{captura.advogado_id ? `#${captura.advogado_id}` : '-'}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Credenciais */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Credenciais Utilizadas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {captura.credencial_ids.map((id) => (
                  <Badge key={id} variant="outline">
                    Credencial #{id}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Datas */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Datas e Horários</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Iniciado Em</p>
                  <p className="text-sm">{formatarDataHora(captura.iniciado_em)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Concluído Em</p>
                  <p className="text-sm">{formatarDataHora(captura.concluido_em)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Resultado */}
          {captura.resultado && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Resultado</CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="text-xs bg-muted p-4 rounded-md overflow-x-auto">
                  {JSON.stringify(captura.resultado, null, 2)}
                </pre>
              </CardContent>
            </Card>
          )}

          {/* Erro */}
          {captura.erro && (
            <Card className="border-destructive">
              <CardHeader>
                <CardTitle className="text-sm text-destructive">Erro</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-destructive">{captura.erro}</p>
              </CardContent>
            </Card>
          )}
        </div>

        <DialogFooter className="flex justify-between items-center">
          {onDelete && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Deletar Captura
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                  <AlertDialogDescription>
                    Tem certeza que deseja deletar esta captura? Esta ação não pode ser desfeita.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => {
                      onDelete();
                      onOpenChange(false);
                    }}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Deletar
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Fechar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
