/**
 * Componente de matriz de permissões
 */

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
import { Skeleton } from '@/components/ui/skeleton';
import { Shield, Save, RotateCcw, Info, Loader2 } from 'lucide-react';
import type { PermissaoMatriz } from '@/lib/types/usuarios';
import { formatarNomeRecurso, formatarNomeOperacao, contarPermissoesAtivas } from '@/lib/utils/permissoes-utils';
import { MATRIZ_PERMISSOES } from '@/backend/types/permissoes/types';

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
                  : `${totalPermissoesAtivas} de 81 permissões ativas`}
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

          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-3 font-medium text-sm bg-muted/50 sticky left-0 z-10">
                    Recurso
                  </th>
                  {/* Colunas dinâmicas baseadas nas operações */}
                  {matriz.length > 0 &&
                    Object.keys(matriz[0].operacoes).map((operacao) => (
                      <th
                        key={operacao}
                        className="text-center p-3 font-medium text-sm bg-muted/50 min-w-[100px]"
                      >
                        {formatarNomeOperacao(operacao)}
                      </th>
                    ))}
                </tr>
              </thead>
              <tbody>
                {matriz.map((item, index) => (
                  <tr
                    key={item.recurso}
                    className={`border-b ${index % 2 === 0 ? 'bg-background' : 'bg-muted/20'}`}
                  >
                    <td className="p-3 font-medium text-sm sticky left-0 bg-inherit">
                      {formatarNomeRecurso(item.recurso)}
                    </td>
                    {Object.entries(item.operacoes).map(([operacao, permitido]) => (
                      <td key={`${item.recurso}-${operacao}`} className="text-center p-3">
                        <div className="flex items-center justify-center">
                          <Checkbox
                            id={`perm-${item.recurso}-${operacao}`}
                            checked={isSuperAdmin || permitido}
                            onCheckedChange={() => {
                              if (canEdit && !isSuperAdmin) {
                                onTogglePermissao(item.recurso, operacao);
                              }
                            }}
                            disabled={!canEdit || isSuperAdmin || isSaving}
                            aria-label={`Permitir ${formatarNomeOperacao(operacao)} em ${formatarNomeRecurso(item.recurso)}`}
                          />
                        </div>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {matriz.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              Nenhuma permissão encontrada
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog de confirmação */}
      <Dialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar alterações de permissões</DialogTitle>
            <DialogDescription>
              Você está prestes a modificar as permissões deste usuário. Esta ação será registrada no log de auditoria.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground">
              <strong>Total de permissões ativas:</strong> {totalPermissoesAtivas} de 81
            </p>
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
