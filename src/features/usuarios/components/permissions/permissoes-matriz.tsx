
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Skeleton } from '@/components/ui/skeleton';
import { SemanticBadge } from '@/components/ui/semantic-badge';
import { Shield, Save, RotateCcw, Info, Loader2, AlertCircle } from 'lucide-react';
import type { PermissaoMatriz } from '../../domain';
import { formatarNomeRecurso, formatarNomeOperacao, contarPermissoesAtivas, obterTotalPermissoes } from '../../permissions-utils';
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty';
import { Typography } from '@/components/ui/typography';

interface PermissoesMatrizProps {
  matriz: PermissaoMatriz[];
  isSuperAdmin: boolean;
  hasChanges: boolean;
  isSaving: boolean;
  isLoading: boolean;
  canEdit: boolean;
  onTogglePermissao: (recurso: string, operacao: string) => void;
  onSalvar: () => Promise<boolean>;
  onResetar: () => void;
}

export function PermissoesMatriz({
  matriz,
  isSuperAdmin,
  hasChanges,
  isSaving,
  isLoading,
  canEdit,
  onTogglePermissao,
  onSalvar,
  onResetar,
}: PermissoesMatrizProps) {
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);

  const handleSalvarClick = () => {
    setConfirmDialogOpen(true);
  };

  const handleConfirmarSalvar = async () => {
    const success = await onSalvar();
    if (success) {
      setConfirmDialogOpen(false);
    }
  };

  const totalPermissoesAtivas = contarPermissoesAtivas(matriz);
  const totalPermissoes = obterTotalPermissoes();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-full mt-2" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-96 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Permissões do Usuário
              </CardTitle>
              <CardDescription className="mt-1.5">
                {isSuperAdmin
                  ? 'Como Super Admin, este usuário tem acesso total a todos os recursos'
                  : `${totalPermissoesAtivas} de ${totalPermissoes} permissões ativas`}
              </CardDescription>
            </div>
            {canEdit && !isSuperAdmin && hasChanges && (
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onResetar}
                  disabled={isSaving}
                >
                  <RotateCcw className="h-4 w-4 mr-1.5" />
                  Resetar
                </Button>
                <Button
                  size="sm"
                  onClick={handleSalvarClick}
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-1.5" />
                      Salvar Alterações
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {isSuperAdmin && (
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                Este usuário possui acesso total ao sistema. Todas as permissões estão implicitamente concedidas.
              </AlertDescription>
            </Alert>
          )}

          {!canEdit && (
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                Você não tem permissão para gerenciar permissões de usuários. Visualização apenas.
              </AlertDescription>
            </Alert>
          )}

          <Accordion type="multiple" className="w-full">
            {matriz.map((item) => {
              const permissoesAtivas = Object.values(item.operacoes).filter(Boolean).length;
              const totalOperacoes = Object.keys(item.operacoes).length;
              const todasAtivas = permissoesAtivas === totalOperacoes;
              const nenhumaAtiva = permissoesAtivas === 0;

              return (
                <AccordionItem key={item.recurso} value={item.recurso}>
                  <AccordionTrigger className="hover:no-underline">
                    <div className="flex items-center gap-2 w-full">
                      <span className="font-medium text-base">
                        {formatarNomeRecurso(item.recurso)}
                      </span>
                      <SemanticBadge
                        variant={todasAtivas ? 'success' : nenhumaAtiva ? 'neutral' : 'info'}
                        className="ml-auto mr-2"
                      >
                        {permissoesAtivas}/{totalOperacoes}
                      </SemanticBadge>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 pt-2">
                      {Object.entries(item.operacoes).map(([operacao, permitido]) => (
                        <label
                          key={`${item.recurso}-${operacao}`}
                          className="flex items-center gap-2 cursor-pointer hover:bg-muted/50 p-2 rounded-md transition-colors"
                        >
                          <Checkbox
                            id={`perm-${item.recurso}-${operacao}`}
                            checked={Boolean(isSuperAdmin || permitido)}
                            onCheckedChange={() => {
                              if (canEdit && !isSuperAdmin) {
                                onTogglePermissao(item.recurso, operacao);
                              }
                            }}
                            disabled={!canEdit || isSuperAdmin || isSaving}
                            aria-label={`Permitir ${formatarNomeOperacao(operacao)} em ${formatarNomeRecurso(item.recurso)}`}
                          />
                          <span className="text-sm">
                            {formatarNomeOperacao(operacao)}
                          </span>
                        </label>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>

          {matriz.length === 0 && (
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <AlertCircle className="h-6 w-6" />
                </EmptyMedia>
                <EmptyTitle>Nenhuma permissão encontrada</EmptyTitle>
              </EmptyHeader>
            </Empty>
          )}
        </CardContent>
      </Card>

      <Dialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar alterações de permissões</DialogTitle>
            <DialogDescription>
              Você está prestes a modificar as permissões deste usuário. Esta ação será registrada no log de auditoria.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Typography.Muted>
              <strong>Total de permissões ativas:</strong> {totalPermissoesAtivas} de {totalPermissoes}
            </Typography.Muted>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setConfirmDialogOpen(false)}
              disabled={isSaving}
            >
              Cancelar
            </Button>
            <Button onClick={handleConfirmarSalvar} disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                  Salvando...
                </>
              ) : (
                'Confirmar'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
