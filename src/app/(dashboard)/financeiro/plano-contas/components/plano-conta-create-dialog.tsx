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
  NIVEL_LABELS,
  getNaturezaPadrao,
  type TipoContaContabil,
  type NaturezaConta,
  type NivelConta,
} from '@/types/domain/financeiro';

const createPlanoContaSchema = z.object({
  codigo: z
    .string()
    .min(1, 'Código é obrigatório')
    .max(50, 'Código deve ter no máximo 50 caracteres'),
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
  nivel: z.enum(['sintetica', 'analitica'], {
    required_error: 'Nível é obrigatório',
  }),
  contaPaiId: z.number().nullable().optional(),
  ordemExibicao: z.number().nullable().optional(),
  ativo: z.boolean().default(true),
});

type CreatePlanoContaFormData = z.infer<typeof createPlanoContaSchema>;

interface PlanoContaCreateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function PlanoContaCreateDialog({
  open,
  onOpenChange,
  onSuccess,
}: PlanoContaCreateDialogProps) {
  const form = useForm<CreatePlanoContaFormData>({
    resolver: zodResolver(createPlanoContaSchema),
    defaultValues: {
      codigo: '',
      nome: '',
      descricao: '',
      tipoConta: undefined,
      natureza: undefined,
      nivel: undefined,
      contaPaiId: null,
      ordemExibicao: null,
      ativo: true,
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

  const tipoConta = watch('tipoConta');
  const nivel = watch('nivel');

  // Auto-preencher natureza quando tipo de conta mudar
  React.useEffect(() => {
    if (tipoConta) {
      const naturezaPadrao = getNaturezaPadrao(tipoConta);
      setValue('natureza', naturezaPadrao);
    }
  }, [tipoConta, setValue]);

  // Reset form quando dialog fechar
  React.useEffect(() => {
    if (!open) {
      reset();
    }
  }, [open, reset]);

  const onSubmit = async (data: CreatePlanoContaFormData) => {
    try {
      const response = await fetch('/api/plano-contas', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Erro desconhecido' }));
        throw new Error(errorData.error || `Erro ${response.status}: ${response.statusText}`);
      }

      toast.success('Conta criada com sucesso!');
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao criar conta';
      toast.error(message);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogHeader>
            <DialogTitle>Nova Conta Contábil</DialogTitle>
            <DialogDescription>
              Configure uma nova conta no plano de contas.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {Object.keys(errors).length > 0 && (
              <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">
                Corrija os erros no formulário antes de continuar.
              </div>
            )}

            {/* Código */}
            <div className="space-y-2">
              <Label htmlFor="codigo">
                Código <span className="text-destructive">*</span>
              </Label>
              <Input
                id="codigo"
                {...register('codigo')}
                placeholder="Ex: 1.1.01"
                disabled={isSubmitting}
              />
              {errors.codigo && (
                <p className="text-sm text-destructive">{errors.codigo.message}</p>
              )}
              <p className="text-xs text-muted-foreground">
                Código hierárquico da conta. Use pontos para separar os níveis.
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

            {/* Grid para Tipo, Natureza e Nível */}
            <div className="grid grid-cols-3 gap-4">
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

              {/* Nível */}
              <div className="space-y-2">
                <Label>
                  Nível <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={watch('nivel')}
                  onValueChange={(value) => setValue('nivel', value as NivelConta)}
                  disabled={isSubmitting}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(NIVEL_LABELS).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.nivel && (
                  <p className="text-sm text-destructive">{errors.nivel.message}</p>
                )}
              </div>
            </div>

            {nivel && (
              <p className="text-xs text-muted-foreground">
                {nivel === 'sintetica'
                  ? 'Contas sintéticas agrupam outras contas e não aceitam lançamentos diretos.'
                  : 'Contas analíticas recebem lançamentos financeiros diretos.'}
              </p>
            )}

            {/* Conta Pai */}
            <div className="space-y-2">
              <Label>Conta Pai</Label>
              <PlanoContaPaiSelect
                value={watch('contaPaiId')}
                onChange={(value) => setValue('contaPaiId', value)}
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
              Criar Conta
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
