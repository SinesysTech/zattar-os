'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { PlanoContaPaiSelect } from './plano-conta-select';
import {
  TIPO_CONTA_LABELS,
  NATUREZA_LABELS,
  type PlanoContaComPai,
  type TipoContaContabil,
  type NaturezaConta,
} from '@/backend/types/financeiro/plano-contas.types';

const editPlanoContaSchema = z.object({
  nome: z
    .string()
    .min(1, 'Nome é obrigatório')
    .max(255, 'Nome deve ter no máximo 255 caracteres'),
  descricao: z.string().max(1000, 'Descrição deve ter no máximo 1000 caracteres').optional(),
  tipoConta: z.enum(['ativo', 'passivo', 'receita', 'despesa', 'patrimonio_liquido'], {
    required_error: 'Tipo de conta é obrigatório',
  }),
  natureza: z.enum(['devedora', 'credora'], {
    required_error: 'Natureza é obrigatória',
  }),
  contaPaiId: z.number().nullable().optional(),
  ordemExibicao: z.number().nullable().optional(),
  ativo: z.boolean(),
});

type EditPlanoContaFormData = z.infer<typeof editPlanoContaSchema>;

interface PlanoContaEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  conta: PlanoContaComPai;
  onSuccess: () => void;
}

export function PlanoContaEditDialog({
  open,
  onOpenChange,
  conta,
  onSuccess,
}: PlanoContaEditDialogProps) {
  const form = useForm<EditPlanoContaFormData>({
    resolver: zodResolver(editPlanoContaSchema),
    defaultValues: {
      nome: conta.nome,
      descricao: conta.descricao || '',
      tipoConta: conta.tipoConta,
      natureza: conta.natureza,
      contaPaiId: conta.contaPaiId || null,
      ordemExibicao: conta.ordemExibicao || null,
      ativo: conta.ativo,
    },
  });

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
    reset,
  } = form;

  // Reset form quando conta mudar
  React.useEffect(() => {
    if (open && conta) {
      reset({
        nome: conta.nome,
        descricao: conta.descricao || '',
        tipoConta: conta.tipoConta,
        natureza: conta.natureza,
        contaPaiId: conta.contaPaiId || null,
        ordemExibicao: conta.ordemExibicao || null,
        ativo: conta.ativo,
      });
    }
  }, [open, conta, reset]);

  const onSubmit = async (data: EditPlanoContaFormData) => {
    try {
      const response = await fetch(`/api/plano-contas/${conta.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Erro desconhecido' }));
        throw new Error(errorData.error || `Erro ${response.status}: ${response.statusText}`);
      }

      toast.success('Conta atualizada com sucesso!');
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao atualizar conta';
      toast.error(message);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogHeader>
            <DialogTitle>Editar Conta Contábil</DialogTitle>
            <DialogDescription>
              Atualize os dados da conta <strong>{conta.codigo}</strong>.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {Object.keys(errors).length > 0 && (
              <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">
                Corrija os erros no formulário antes de continuar.
              </div>
            )}

            {/* Código (somente leitura) */}
            <div className="space-y-2">
              <Label>Código</Label>
              <Input value={conta.codigo} disabled className="bg-muted" />
              <p className="text-xs text-muted-foreground">
                O código não pode ser alterado.
              </p>
            </div>

            {/* Nível (somente leitura) */}
            <div className="space-y-2">
              <Label>Nível</Label>
              <Input
                value={conta.nivel === 'sintetica' ? 'Sintética' : 'Analítica'}
                disabled
                className="bg-muted"
              />
              <p className="text-xs text-muted-foreground">
                O nível não pode ser alterado após a criação.
              </p>
            </div>

            {/* Nome */}
            <div className="space-y-2">
              <Label htmlFor="nome">
                Nome <span className="text-destructive">*</span>
              </Label>
              <Input
                id="nome"
                {...register('nome')}
                placeholder="Nome descritivo da conta"
                disabled={isSubmitting}
              />
              {errors.nome && (
                <p className="text-sm text-destructive">{errors.nome.message}</p>
              )}
            </div>

            {/* Descrição */}
            <div className="space-y-2">
              <Label htmlFor="descricao">Descrição</Label>
              <Textarea
                id="descricao"
                {...register('descricao')}
                placeholder="Descrição detalhada do propósito da conta (opcional)"
                disabled={isSubmitting}
              />
              {errors.descricao && (
                <p className="text-sm text-destructive">{errors.descricao.message}</p>
              )}
            </div>

            {/* Grid para Tipo e Natureza */}
            <div className="grid grid-cols-2 gap-4">
              {/* Tipo de Conta */}
              <div className="space-y-2">
                <Label>
                  Tipo <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={watch('tipoConta')}
                  onValueChange={(value) =>
                    setValue('tipoConta', value as TipoContaContabil)
                  }
                  disabled={isSubmitting}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(TIPO_CONTA_LABELS).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.tipoConta && (
                  <p className="text-sm text-destructive">{errors.tipoConta.message}</p>
                )}
              </div>

              {/* Natureza */}
              <div className="space-y-2">
                <Label>
                  Natureza <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={watch('natureza')}
                  onValueChange={(value) => setValue('natureza', value as NaturezaConta)}
                  disabled={isSubmitting}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(NATUREZA_LABELS).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.natureza && (
                  <p className="text-sm text-destructive">{errors.natureza.message}</p>
                )}
              </div>
            </div>

            {/* Conta Pai */}
            <div className="space-y-2">
              <Label>Conta Pai</Label>
              <PlanoContaPaiSelect
                value={watch('contaPaiId')}
                onChange={(value) => setValue('contaPaiId', value)}
                excluirId={conta.id}
                disabled={isSubmitting}
              />
              <p className="text-xs text-muted-foreground">
                Deixe vazio para contas de primeiro nível.
              </p>
            </div>

            {/* Grid para Ordem e Status */}
            <div className="grid grid-cols-2 gap-4">
              {/* Ordem de Exibição */}
              <div className="space-y-2">
                <Label htmlFor="ordemExibicao">Ordem de Exibição</Label>
                <Input
                  id="ordemExibicao"
                  type="number"
                  {...register('ordemExibicao', {
                    setValueAs: (v) => (v === '' ? null : parseInt(v, 10)),
                  })}
                  placeholder="Ex: 1"
                  disabled={isSubmitting}
                />
                <p className="text-xs text-muted-foreground">
                  Menor número aparece primeiro.
                </p>
              </div>

              {/* Status Ativo */}
              <div className="space-y-2">
                <Label>Status</Label>
                <div className="flex items-center space-x-2 pt-2">
                  <Switch
                    id="ativo"
                    checked={watch('ativo')}
                    onCheckedChange={(checked) => setValue('ativo', checked)}
                    disabled={isSubmitting}
                  />
                  <Label htmlFor="ativo" className="cursor-pointer">
                    Conta ativa
                  </Label>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Salvar Alterações
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
