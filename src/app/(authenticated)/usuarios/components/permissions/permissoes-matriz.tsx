
'use client';

import { cn } from '@/lib/utils';
import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
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
import { GlassPanel } from '@/components/shared/glass-panel';
import { Heading, Text } from '@/components/ui/typography';
import { PermissionToggle } from './permission-toggle';
import { RolePresetSelect } from './role-preset-select';
import { Shield, Save, RotateCcw, Info, AlertCircle} from 'lucide-react';
import type { PermissaoMatriz } from '../../domain';
import {
  agruparPermissoesPorModulo,
  formatarNomeRecurso,
  formatarNomeOperacao,
  contarPermissoesAtivas,
  obterTotalPermissoes,
} from '../../permissions-utils';
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty';

import { LoadingSpinner } from "@/components/ui/loading-state"
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
  const [presetValue, setPresetValue] = useState('none');

  // Diff tracking: snapshot of initial state, refreshed whenever hasChanges goes false (saved/reset)
  const initialMatriz = useRef<PermissaoMatriz[]>(matriz);
  useEffect(() => {
    if (!hasChanges) {
      initialMatriz.current = matriz;
    }
  }, [hasChanges, matriz]);

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
  const gruposModulo = agruparPermissoesPorModulo(matriz);

  // Helper: lookup initial value for diff
  const getInitialValue = (recurso: string, operacao: string): boolean => {
    const item = initialMatriz.current.find((m) => m.recurso === recurso);
    if (!item) return false;
    return Boolean(item.operacoes[operacao]);
  };

  if (isLoading) {
    return (
      <GlassPanel depth={1} className={cn(/* design-system-escape: p-5 → usar <Inset> */ "p-5 stack-default")}>
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-96 w-full" />
      </GlassPanel>
    );
  }

  return (
    <>
      <GlassPanel depth={1} className={cn(/* design-system-escape: p-5 → usar <Inset> */ "p-5 stack-default-plus")}>
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className={cn("stack-nano")}>
            <div className={cn("flex items-center inline-tight")}>
              <Shield className="size-4 text-muted-foreground/50" />
              <Heading level="card">Permissões do Usuário</Heading>
            </div>
            {!isSuperAdmin && (
              <p className="text-sm text-muted-foreground">
                {totalPermissoesAtivas} de {totalPermissoes} permissões ativas
              </p>
            )}
          </div>

          {canEdit && !isSuperAdmin && hasChanges && (
            <div className={cn("flex items-center inline-tight")}>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onResetar}
                disabled={isSaving}
              >
                <RotateCcw className="h-4 w-4 mr-1.5" />
                Resetar
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={handleSalvarClick}
                disabled={isSaving}
              >
                {isSaving ? (
                  <>
                    <LoadingSpinner className="mr-1.5" />
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

        {/* Content */}
        {isSuperAdmin ? (
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              Este usuário possui acesso total ao sistema. Todas as permissões estão implicitamente concedidas.
            </AlertDescription>
          </Alert>
        ) : (
          <>
            {!canEdit && (
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  Você não tem permissão para gerenciar permissões de usuários. Visualização apenas.
                </AlertDescription>
              </Alert>
            )}

            {/* Role Preset Select — only for editors */}
            {canEdit && (
              <RolePresetSelect
                value={presetValue}
                onValueChange={setPresetValue}
                disabled={isSaving}
              />
            )}

            {/* Module groups — flat layout, always expanded */}
            <div className={cn("stack-default")}>
              {gruposModulo.map((grupo) => {
                const permissoesAtivasModulo = grupo.itens.reduce((acc, item) => {
                  return acc + Object.values(item.operacoes).filter(Boolean).length;
                }, 0);
                const totalModulo = grupo.itens.reduce((acc, item) => {
                  return acc + Object.keys(item.operacoes).length;
                }, 0);

                const allActive = permissoesAtivasModulo === totalModulo && totalModulo > 0;
                const noneActive = permissoesAtivasModulo === 0;

                const badgeClass = allActive
                  ? 'bg-success/12 text-success'
                  : noneActive
                  ? 'bg-muted/8 text-muted-foreground/40'
                  : 'bg-info/12 text-info';

                return (
                  <GlassPanel key={grupo.chave} depth={1} className={cn("inset-card-compact stack-medium")}>
                    {/* Group header */}
                    <div className="flex items-center justify-between">
                      <span className={cn( "text-body-sm font-semibold text-foreground")}>
                        {grupo.titulo}
                      </span>
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${badgeClass}`}
                      >
                        {permissoesAtivasModulo}/{totalModulo}
                      </span>
                    </div>

                    {/* Permissions grid — all resources within group, flat */}
                    <div className={cn("stack-tight")}>
                      {grupo.itens.map((item) => {
                        const permissoesAtivas = Object.values(item.operacoes).filter(Boolean).length;
                        const totalOperacoes = Object.keys(item.operacoes).length;
                        const todasAtivas = permissoesAtivas === totalOperacoes;
                        const nenhumaAtiva = permissoesAtivas === 0;

                        const resourceBadgeClass = todasAtivas
                          ? 'bg-success/12 text-success'
                          : nenhumaAtiva
                          ? 'bg-muted/8 text-muted-foreground/40'
                          : 'bg-info/12 text-info';

                        return (
                          <div key={item.recurso} className={cn("stack-snug")}>
                            <div className={cn("flex items-center inline-tight")}>
                              <Text variant="caption" className="font-medium">
                                {formatarNomeRecurso(item.recurso)}
                              </Text>
                              <span
                                className={`inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-medium ${resourceBadgeClass}`}
                              >
                                {permissoesAtivas}/{totalOperacoes}
                              </span>
                            </div>
                            <div className={cn("grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 inline-snug")}>
                              {Object.entries(item.operacoes).map(([operacao, permitido]) => {
                                const initialValue = getInitialValue(item.recurso, operacao);
                                const isChanged = Boolean(permitido) !== initialValue;

                                return (
                                  <PermissionToggle
                                    key={`${item.recurso}-${operacao}`}
                                    operacao={operacao}
                                    label={formatarNomeOperacao(operacao)}
                                    checked={Boolean(permitido)}
                                    disabled={!canEdit || isSaving}
                                    changed={isChanged}
                                    onToggle={() => {
                                      if (canEdit) {
                                        onTogglePermissao(item.recurso, operacao);
                                      }
                                    }}
                                  />
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </GlassPanel>
                );
              })}
            </div>

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
          </>
        )}
      </GlassPanel>

      {/* Confirmation dialog */}
      <Dialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar alterações de permissões</DialogTitle>
            <DialogDescription>
              Você está prestes a modificar as permissões deste usuário. Esta ação será registrada no log de auditoria.
            </DialogDescription>
          </DialogHeader>
          <div className={cn("py-4")}>
            <p className="text-sm text-muted-foreground">
              <strong>Total de permissões ativas:</strong> {totalPermissoesAtivas} de {totalPermissoes}
            </p>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setConfirmDialogOpen(false)}
              disabled={isSaving}
            >
              Cancelar
            </Button>
            <Button type="button" onClick={handleConfirmarSalvar} disabled={isSaving}>
              {isSaving ? (
                <>
                  <LoadingSpinner className="mr-1.5" />
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
