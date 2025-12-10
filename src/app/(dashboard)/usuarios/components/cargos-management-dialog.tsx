'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Loader2,
  Plus,
  Pencil,
  Trash2,
  Save,
  X,
  Briefcase,
  FileX,
} from 'lucide-react';
import { toast } from 'sonner';
import { useCargos } from '@/core/app/_lib/hooks/use-cargos';
import type { Cargo } from '@/backend/types/cargos/types';
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty';
import { Typography } from '@/components/ui/typography';
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

interface CargosManagementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface CargoFormData {
  nome: string;
  descricao: string;
  ativo: boolean;
}

export function CargosManagementDialog({
  open,
  onOpenChange,
}: CargosManagementDialogProps) {
  const { cargos, isLoading, mutate } = useCargos({ limite: 100, ordenarPor: 'nome' });

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
      const response = await fetch('/api/cargos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome: formData.nome.trim(),
          descricao: formData.descricao.trim() || undefined,
          ativo: formData.ativo,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erro ao criar cargo');
      }

      toast.success('Cargo criado com sucesso!');
      resetForm();
      mutate();
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
      const response = await fetch(`/api/cargos/${editingId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome: formData.nome.trim(),
          descricao: formData.descricao.trim() || undefined,
          ativo: formData.ativo,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erro ao atualizar cargo');
      }

      toast.success('Cargo atualizado com sucesso!');
      resetForm();
      mutate();
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
      const response = await fetch(`/api/cargos/${deletingCargo.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erro ao deletar cargo');
      }

      toast.success('Cargo deletado com sucesso!');
      setDeletingCargo(null);
      mutate();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Erro ao deletar cargo'
      );
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Briefcase className="h-5 w-5" />
              Gerenciar Cargos
            </DialogTitle>
            <DialogDescription>
              Crie, edite ou exclua cargos do sistema.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Formulário de Criação/Edição */}
            {(isCreating || editingId) && (
              <div className="border rounded-lg p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <Typography.Small className="font-medium">
                    {editingId ? 'Editar Cargo' : 'Novo Cargo'}
                  </Typography.Small>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={resetForm}
                    disabled={isSaving}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                <div className="grid gap-4">
                  <div className="grid gap-2">
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
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="descricao">Descrição</Label>
                    <Textarea
                      id="descricao"
                      value={formData.descricao}
                      onChange={(e) =>
                        setFormData({ ...formData, descricao: e.target.value })
                      }
                      placeholder="Descrição opcional do cargo"
                      rows={2}
                      disabled={isSaving}
                    />
                  </div>

                  <div className="flex items-center gap-2">
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
                </div>

                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={resetForm}
                    disabled={isSaving}
                  >
                    Cancelar
                  </Button>
                  <Button
                    onClick={editingId ? handleUpdate : handleCreate}
                    disabled={isSaving}
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
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

            {/* Botão para adicionar novo */}
            {!isCreating && !editingId && (
              <Button
                onClick={() => setIsCreating(true)}
                variant="outline"
                className="w-full"
              >
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Novo Cargo
              </Button>
            )}

            <Separator />

            {/* Lista de Cargos */}
            <div>
              <Typography.Small className="font-medium mb-3 text-center block">Cargos Cadastrados</Typography.Small>

              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
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
                <div className="space-y-1">
                  {cargos.map((cargo) => (
                    <div
                      key={cargo.id}
                      className="flex items-center justify-between py-2 px-3 hover:bg-muted/50 transition-colors rounded"
                    >
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <span className="font-medium">{cargo.nome}</span>
                        {!cargo.ativo && (
                          <Badge variant="secondary" className="text-xs">
                            Inativo
                          </Badge>
                        )}
                        {cargo.descricao && (
                          <Typography.Muted as="span" className="truncate">
                            - {cargo.descricao}
                          </Typography.Muted>
                        )}
                      </div>

                      <div className="flex items-center gap-1 ml-4">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleEdit(cargo)}
                          disabled={editingId === cargo.id}
                          title="Editar"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => setDeletingCargo(cargo)}
                          title="Deletar"
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
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
