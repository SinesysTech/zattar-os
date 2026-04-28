
'use client';

import {
  useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { AppBadge as Badge } from '@/components/ui/app-badge';
import { cn } from '@/lib/utils';
import { getRoleBannerGradient } from '../shared/role-banner';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Plus,
  Pencil,
  Trash2,
  Save,
  FileX} from 'lucide-react';
import { toast } from 'sonner';
import { useCargos } from '@/app/(authenticated)/cargos';
import { actionCriarCargo,
  actionAtualizarCargo,
  actionDeletarCargo } from '@/app/(authenticated)/cargos';
import { Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle } from '@/components/ui/empty';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
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

import { LoadingSpinner } from "@/components/ui/loading-state"
interface CargosManagementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface CargoFormData {
  nome: string;
  descricao: string;
  ativo: boolean;
}

// Tipo local para simplificar, já que Cargo vem do hook
interface Cargo {
  id: number;
  nome: string;
  descricao?: string | null;
  ativo: boolean;
}

export function CargosManagementDialog({
  open,
  onOpenChange,
}: CargosManagementDialogProps) {
  const { cargos, isLoading, refetch } = useCargos();

  const [isCreating, setIsCreating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [deletingCargo, setDeletingCargo] = useState<Cargo | null>(null);

  const [formData, setFormData] = useState<CargoFormData>({
    nome: '',
    descricao: '',
    ativo: true,
  });

  const resetForm = () => {
    setFormData({ nome: '', descricao: '', ativo: true });
    setIsCreating(false);
    setEditingId(null);
  };

  const handleCreate = async () => {
    if (!formData.nome.trim()) {
      toast.error('Nome do cargo é obrigatório');
      return;
    }

    setIsSaving(true);

    try {
      const response = await actionCriarCargo({
        nome: formData.nome.trim(),
        descricao: formData.descricao.trim() || undefined,
      });

      if (!response.success) {
        throw new Error(response.error || 'Erro ao criar cargo');
      }

      toast.success('Cargo criado com sucesso!');
      resetForm();
      refetch();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Erro ao criar cargo'
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleEdit = (cargo: Cargo) => {
    setEditingId(cargo.id);
    setFormData({
      nome: cargo.nome,
      descricao: cargo.descricao || '',
      ativo: cargo.ativo,
    });
    setIsCreating(false);
  };

  const handleUpdate = async () => {
    if (!editingId || !formData.nome.trim()) {
      toast.error('Nome do cargo é obrigatório');
      return;
    }

    setIsSaving(true);

    try {
      const response = await actionAtualizarCargo(editingId, {
        nome: formData.nome.trim(),
        descricao: formData.descricao.trim() || undefined,
        ativo: formData.ativo,
      });

      if (!response.success) {
        throw new Error(response.error || 'Erro ao atualizar cargo');
      }

      toast.success('Cargo atualizado com sucesso!');
      resetForm();
      refetch();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Erro ao atualizar cargo'
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingCargo) return;

    try {
      const response = await actionDeletarCargo(deletingCargo.id);

      if (!response.success) {
        throw new Error(response.error || 'Erro ao deletar cargo');
      }

      toast.success('Cargo deletado com sucesso!');
      setDeletingCargo(null);
      refetch();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Erro ao deletar cargo'
      );
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent
          showCloseButton={false}
          className="sm:max-w-3xl  overflow-hidden p-0 gap-0 max-h-[90vh] flex flex-col"
        >
          <DialogHeader className="px-6 py-4 border-b border-border/20 shrink-0">
            <DialogTitle>Gerenciar cargos</DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto overflow-x-hidden px-6 py-4 [scrollbar-width:thin]">
        <div className={cn(/* design-system-escape: p-6 → migrar para <Inset variant="dialog">; space-y-4 → migrar para <Stack gap="default"> */ "p-6 space-y-4")}>
          <div className={cn(/* design-system-escape: gap-6 → migrar para <Inline gap="loose"> */ "grid gap-6 lg:grid-cols-2")}>
            {/* Lista */}
            <div className={cn(/* design-system-escape: space-y-3 sem token DS */ "space-y-3")}>
              <div className={cn(/* design-system-escape: gap-3 gap sem token DS */ "flex items-center justify-between gap-3")}>
                <h3 className="scroll-m-20 text-sm font-semibold tracking-tight">Cargos</h3>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setIsCreating(true);
                    setEditingId(null);
                    setFormData({ nome: '', descricao: '', ativo: true });
                  }}
                  disabled={isSaving}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Novo cargo
                </Button>
              </div>

              {isLoading ? (
                <div className={cn(/* design-system-escape: py-10 padding direcional sem Inset equiv. */ "flex items-center justify-center py-10")}>
                  <LoadingSpinner className="size-6 text-muted-foreground" />
                </div>
              ) : cargos.length === 0 ? (
                <Empty>
                  <EmptyHeader>
                    <EmptyMedia variant="icon">
                      <FileX className="h-6 w-6" />
                    </EmptyMedia>
                    <EmptyTitle>Nenhum cargo cadastrado</EmptyTitle>
                  </EmptyHeader>
                </Empty>
              ) : (
                <div className={cn(/* design-system-escape: space-y-1 sem token DS */ "space-y-1 rounded-lg border bg-card")}>
                  {cargos.map((cargo) => (
                    <div
                      key={cargo.id}
                      role="button"
                      tabIndex={0}
                      onClick={() => handleEdit(cargo)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          handleEdit(cargo);
                        }
                      }}
                      className={cn(/* design-system-escape: py-2 padding direcional sem Inset equiv.; px-3 padding direcional sem Inset equiv. */ "w-full text-left flex items-center justify-between py-2 px-3 hover:bg-muted/50 transition-colors cursor-pointer rounded-md")}
                    >
                      <div className={cn(/* design-system-escape: gap-2 → migrar para <Inline gap="tight"> */ "flex items-center gap-2 flex-1 min-w-0")}>
                        <div className={cn('w-1 h-5 rounded-sm bg-linear-to-b shrink-0', getRoleBannerGradient(cargo.nome))} />
                        <span className={cn(/* design-system-escape: font-medium → className de <Text>/<Heading> */ "font-medium")}>{cargo.nome}</span>
                        {!cargo.ativo && (
                          <Badge variant="secondary" className={cn(/* design-system-escape: text-xs → migrar para <Text variant="caption"> */ "text-xs")}>
                            Inativo
                          </Badge>
                        )}
                        {cargo.descricao && (
                          <span className="text-sm text-muted-foreground truncate">
                            - {cargo.descricao}
                          </span>
                        )}
                      </div>

                      <div className={cn(/* design-system-escape: gap-1 gap sem token DS */ "flex items-center gap-1 ml-4")}>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEdit(cargo);
                          }}
                          disabled={editingId === cargo.id}
                          aria-label="Editar cargo"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeletingCargo(cargo);
                          }}
                          aria-label="Deletar cargo"
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Form */}
            <div className={cn(/* design-system-escape: space-y-3 sem token DS */ "space-y-3")}>
              <div className={cn(/* design-system-escape: gap-3 gap sem token DS */ "flex items-center justify-between gap-3")}>
                <h3 className="scroll-m-20 text-sm font-semibold tracking-tight">
                  {editingId ? 'Editar cargo' : isCreating ? 'Novo cargo' : 'Detalhes'}
                </h3>
                {(isCreating || editingId) && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={resetForm}
                    disabled={isSaving}
                  >
                    Limpar
                  </Button>
                )}
              </div>

              {!isCreating && !editingId ? (
                <div className={cn(/* design-system-escape: p-4 → migrar para <Inset variant="card-compact"> */ "rounded-lg border bg-card p-4")}>
                  <p className="text-sm text-muted-foreground">
                    Selecione um cargo para editar ou clique em <strong>Novo cargo</strong>.
                  </p>
                </div>
              ) : (
                <div className={cn(/* design-system-escape: p-4 → migrar para <Inset variant="card-compact">; space-y-4 → migrar para <Stack gap="default"> */ "rounded-lg border bg-card p-4 space-y-4")}>
                  <div className={cn(/* design-system-escape: gap-2 → migrar para <Inline gap="tight"> */ "grid gap-2")}>
                    <Label htmlFor="nome">
                      Nome <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="nome"
                      value={formData.nome}
                      onChange={(e) =>
                        setFormData({ ...formData, nome: e.target.value })
                      }
                      placeholder="Ex: Advogado, Estagiário, Secretária..."
                      disabled={isSaving}
                      className="bg-card"
                    />
                  </div>

                  <div className={cn(/* design-system-escape: gap-2 → migrar para <Inline gap="tight"> */ "grid gap-2")}>
                    <Label htmlFor="descricao">Descrição</Label>
                    <Textarea
                      id="descricao"
                      value={formData.descricao}
                      onChange={(e) =>
                        setFormData({ ...formData, descricao: e.target.value })
                      }
                      placeholder="Descrição opcional do cargo"
                      rows={3}
                      disabled={isSaving}
                      className="bg-card"
                    />
                  </div>

                  <div className={cn(/* design-system-escape: gap-2 → migrar para <Inline gap="tight"> */ "flex items-center gap-2")}>
                    <Checkbox
                      id="ativo"
                      checked={formData.ativo}
                      onCheckedChange={(checked) =>
                        setFormData({ ...formData, ativo: checked === true })
                      }
                      disabled={isSaving}
                    />
                    <Label htmlFor="ativo" className="cursor-pointer">
                      Cargo ativo
                    </Label>
                  </div>

                  <Separator />

                  <div className={cn(/* design-system-escape: gap-2 → migrar para <Inline gap="tight"> */ "flex justify-end gap-2")}>
                    <Button
                      type="button"
                      onClick={editingId ? handleUpdate : handleCreate}
                      disabled={isSaving}
                    >
                      {isSaving ? (
                        <>
                          <LoadingSpinner className="mr-2" />
                          Salvando...
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4 mr-2" />
                          {editingId ? 'Atualizar' : 'Criar'}
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog de confirmação de exclusão */}
      <AlertDialog
        open={!!deletingCargo}
        onOpenChange={(open) => !open && setDeletingCargo(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Deletar Cargo</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja deletar o cargo &quot;{deletingCargo?.nome}&quot;?
              {'\n\n'}
              Esta ação não pode ser desfeita. Se houver usuários com este
              cargo, a operação falhará.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive hover:bg-destructive/90"
            >
              Deletar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
