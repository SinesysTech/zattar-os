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
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { segmentoSchema } from '@/types/assinatura-digital/segmento.types';
import { generateSlug } from '@/app/_lib/assinatura-digital/slug-helpers';

const createSegmentoSchema = segmentoSchema.extend({
  ativo: z.boolean().default(true),
});

type CreateSegmentoFormData = z.infer<typeof createSegmentoSchema>;

interface SegmentoCreateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

/**
 * Dialog component for creating new segmentos.
 * Handles form validation, auto-slug generation, and slug uniqueness checks.
 */
export function SegmentoCreateDialog({
  open,
  onOpenChange,
  onSuccess,
}: SegmentoCreateDialogProps) {
  const form = useForm<CreateSegmentoFormData>({
    resolver: zodResolver(createSegmentoSchema),
    defaultValues: {
      nome: '',
      slug: '',
      descricao: '',
      ativo: true,
    },
  });

  const { register, handleSubmit, setValue, watch, formState: { errors, isSubmitting }, reset, setError } = form;

  // Auto-generate slug on nome blur if slug is empty
  const handleNomeBlur = () => {
    const nome = watch('nome');
    const slug = watch('slug');
    if (nome && !slug) {
      setValue('slug', generateSlug(nome));
    }
  };

  // Reset form when dialog closes
  React.useEffect(() => {
    if (!open) {
      reset();
    }
  }, [open, reset]);

  const onSubmit = async (data: CreateSegmentoFormData) => {
    try {
      // Check slug uniqueness using exact-match lookup
      const checkResponse = await fetch(`/api/assinatura-digital/segmentos?slug=${encodeURIComponent(data.slug)}`);
      if (!checkResponse.ok) {
        throw new Error('Erro ao verificar unicidade do slug');
      }
      const checkData = await checkResponse.json();
      if (checkData.exists) {
        setError('slug', { message: 'Slug já existe. Escolha um slug diferente.' });
        return;
      }

      // Proceed with creation
      const response = await fetch('/api/assinatura-digital/segmentos', {
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

      toast.success('Segmento criado com sucesso!');
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao criar segmento';
      toast.error(message);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogHeader>
            <DialogTitle>Criar Novo Segmento</DialogTitle>
            <DialogDescription>
              Configure o segmento para organizar formulários.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {Object.keys(errors).length > 0 && (
              <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">
                Corrija os erros no formulário antes de continuar.
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="nome">
                Nome <span className="text-destructive">*</span>
              </Label>
              <Input
                id="nome"
                {...register('nome', {
                  onBlur: handleNomeBlur,
                })}
                placeholder="Nome do segmento"
                disabled={isSubmitting}
              />
              {errors.nome && (
                <p className="text-sm text-destructive">{errors.nome.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="slug">
                Slug <span className="text-destructive">*</span>
              </Label>
              <Input
                id="slug"
                {...register('slug')}
                placeholder="Slug gerado automaticamente"
                disabled={isSubmitting}
              />
              {errors.slug && (
                <p className="text-sm text-destructive">{errors.slug.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="descricao">Descrição</Label>
              <Textarea
                id="descricao"
                {...register('descricao')}
                placeholder="Descrição opcional do segmento"
                disabled={isSubmitting}
              />
              {errors.descricao && (
                <p className="text-sm text-destructive">{errors.descricao.message}</p>
              )}
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="ativo"
                checked={watch('ativo')}
                onCheckedChange={(checked) => setValue('ativo', checked)}
                disabled={isSubmitting}
              />
              <Label htmlFor="ativo" className="cursor-pointer">
                Segmento ativo
              </Label>
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
              Criar Segmento
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}