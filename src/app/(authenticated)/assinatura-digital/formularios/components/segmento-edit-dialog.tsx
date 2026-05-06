import {
  cn } from '@/lib/utils';
import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { generateSlug, type AssinaturaDigitalSegmento } from '@/shared/assinatura-digital';

import { LoadingSpinner } from "@/components/ui/loading-state"
// Schema local para garantir tipagem correta com useForm
const editSegmentoSchema = z.object({
  nome: z.string().min(1, 'Nome é obrigatório'),
  slug: z
    .string()
    .min(1, 'Slug é obrigatório')
    .regex(/^[a-z0-9-]+$/, 'Slug deve conter apenas letras minúsculas, números e hífens'),
  descricao: z.string().optional(),
  ativo: z.boolean(),
});

type EditSegmentoFormData = z.infer<typeof editSegmentoSchema>;

interface SegmentoEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  segmento: AssinaturaDigitalSegmento | null;
  onSuccess: () => void;
}

/**
 * Dialog component for editing existing segmentos.
 * Handles form validation, slug uniqueness checks (excluding current segmento), and partial updates.
 */
export function SegmentoEditDialog({
  open,
  onOpenChange,
  segmento,
  onSuccess,
}: SegmentoEditDialogProps) {
  const form = useForm<EditSegmentoFormData>({
    resolver: zodResolver(editSegmentoSchema),
    defaultValues: {},
  });

  const { register, handleSubmit, setValue, watch, formState: { errors, isSubmitting }, reset, setError } = form;

  // Pre-populate form when segmento changes
  React.useEffect(() => {
    if (segmento) {
      reset({
        nome: segmento.nome,
        slug: segmento.slug,
        descricao: segmento.descricao || '',
        ativo: segmento.ativo,
      });
    }
  }, [segmento, reset]);

  // Reset form when dialog closes
  React.useEffect(() => {
    if (!open) {
      reset();
    }
  }, [open, reset]);

  // Auto-generate slug on nome blur if slug is empty or unchanged
  const handleNomeBlur = () => {
    if (!segmento) return;
    const nome = watch('nome');
    const slug = watch('slug');
    if (nome && slug === segmento.slug) {
      setValue('slug', generateSlug(nome));
    }
  };

  const onSubmit = async (data: EditSegmentoFormData) => {
    if (!segmento) return;

    try {
      // Check slug uniqueness excluding current segmento using exact-match lookup
      if (data.slug !== segmento.slug) {
        const checkResponse = await fetch(`/api/assinatura-digital/segmentos?slug=${encodeURIComponent(data.slug)}`);
        if (!checkResponse.ok) {
          throw new Error('Erro ao verificar unicidade do slug');
        }
        const checkData = await checkResponse.json();
        // Only error if slug exists AND belongs to a different segmento
        if (checkData.exists && checkData.data && checkData.data.id !== segmento.id) {
          setError('slug', { message: 'Slug já existe. Escolha um slug diferente.' });
          return;
        }
      }

      // Compute changed fields for partial update
      const changedData: Partial<EditSegmentoFormData> = {};
      if (data.nome !== segmento.nome) changedData.nome = data.nome;
      if (data.slug !== segmento.slug) changedData.slug = data.slug;
      if (data.descricao !== (segmento.descricao || '')) changedData.descricao = data.descricao;
      if (data.ativo !== segmento.ativo) changedData.ativo = data.ativo;

      if (Object.keys(changedData).length === 0) {
        toast.info('Nenhuma alteração detectada.');
        return;
      }

      // Proceed with update
      const response = await fetch(`/api/assinatura-digital/segmentos/${segmento.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(changedData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Erro desconhecido' }));
        throw new Error(errorData.error || `Erro ${response.status}: ${response.statusText}`);
      }

      toast.success('Segmento atualizado com sucesso!');
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao atualizar segmento';
      toast.error(message);
    }
  };

  if (!segmento) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        data-density="comfortable"
        className="sm:max-w-2xl  overflow-hidden p-0 gap-0 max-h-[90vh] flex flex-col"
      >
        <DialogHeader className="px-6 py-4 border-b border-border/20 shrink-0">
          <DialogTitle>Editar Segmento</DialogTitle>
          <DialogDescription className="sr-only">Edite as informações do segmento.</DialogDescription>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto overflow-x-hidden px-6 py-4 [scrollbar-width:thin]">
          <form id="segmento-edit-form" onSubmit={handleSubmit(onSubmit)} className={cn("flex flex-col stack-default")}>
            {Object.keys(errors).length > 0 && (
              <div className={cn("rounded-md bg-destructive/15 inset-medium text-body-sm text-destructive")}>
                Corrija os erros no formulário antes de continuar.
              </div>
            )}

            <div className={cn("grid grid-cols-1 md:grid-cols-2 inline-default")}>
              <div className={cn("flex flex-col stack-tight md:col-span-2")}>
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
                  <p className={cn("text-body-sm text-destructive")}>{errors.nome.message}</p>
                )}
              </div>

              <div className={cn("flex flex-col stack-tight md:col-span-2")}>
                <Label htmlFor="slug">
                  Slug <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="slug"
                  {...register('slug')}
                  placeholder="Slug único"
                  disabled={isSubmitting}
                />
                {errors.slug && (
                  <p className={cn("text-body-sm text-destructive")}>{errors.slug.message}</p>
                )}
              </div>

              <div className={cn("flex flex-col stack-tight md:col-span-2")}>
                <Label htmlFor="descricao">Descrição</Label>
                <Textarea
                  id="descricao"
                  {...register('descricao')}
                  placeholder="Descrição opcional do segmento"
                  disabled={isSubmitting}
                  rows={3}
                />
                {errors.descricao && (
                  <p className={cn("text-body-sm text-destructive")}>{errors.descricao.message}</p>
                )}
              </div>

              <div className={cn("flex items-center space-x-2 md:col-span-2")}>
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
          </form>
        </div>
        <div className="px-6 py-4 border-t border-border/20 shrink-0 flex items-center justify-between gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <div className="flex items-center gap-2">
            <Button type="submit" form="segmento-edit-form" disabled={isSubmitting}>
              {isSubmitting && <LoadingSpinner className="mr-2" />}
              Salvar Alterações
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
