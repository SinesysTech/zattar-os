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
import { Combobox } from '@/components/ui/combobox';
import { toast } from 'sonner';
import { Loader2, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { AssinaturaDigitalSegmento, AssinaturaDigitalTemplate } from '@/backend/types/assinatura-digital/types';
import { generateSlug } from '@/app/_lib/assinatura-digital/slug-helpers';

const createFormularioSchema = z.object({
  nome: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres'),
  slug: z.string().min(3, 'Slug deve ter pelo menos 3 caracteres'),
  segmento_id: z.coerce.number().int().positive('Segmento é obrigatório'),
  descricao: z.string().max(500, 'Descrição deve ter no máximo 500 caracteres').optional(),
  template_ids: z.array(z.string()).optional(),
  ativo: z.boolean().default(true),
  foto_necessaria: z.boolean().default(true),
  geolocation_necessaria: z.boolean().default(false),
});

type CreateFormularioFormData = z.infer<typeof createFormularioSchema>;

interface FormularioCreateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  segmentos: AssinaturaDigitalSegmento[];
  templates: AssinaturaDigitalTemplate[];
}

export function FormularioCreateDialog({
  open,
  onOpenChange,
  onSuccess,
  segmentos,
  templates,
}: FormularioCreateDialogProps) {
  const form = useForm<CreateFormularioFormData>({
    resolver: zodResolver(createFormularioSchema),
    defaultValues: {
      nome: '',
      slug: '',
      segmento_id: 0,
      descricao: '',
      template_ids: [],
      ativo: true,
      foto_necessaria: true,
      geolocation_necessaria: false,
    },
  });

  const { register, handleSubmit, setValue, watch, formState: { errors, isSubmitting }, reset } = form;

  const [segmentoId, setSegmentoId] = React.useState<string>('');
  const [templateIds, setTemplateIds] = React.useState<string[]>([]);

  const nome = watch('nome');

  // Auto-generate slug when nome changes
  React.useEffect(() => {
    if (nome) {
      const slug = generateSlug(nome);
      setValue('slug', slug);
    }
  }, [nome, setValue]);

  // Reset form and states when dialog closes
  React.useEffect(() => {
    if (!open) {
      reset();
      setSegmentoId('');
      setTemplateIds([]);
    }
  }, [open, reset]);

  // Update form values for segmento_id and template_ids
  React.useEffect(() => {
    setValue('segmento_id', segmentoId ? parseInt(segmentoId, 10) : 0);
  }, [segmentoId, setValue]);

  React.useEffect(() => {
    setValue('template_ids', templateIds);
  }, [templateIds, setValue]);

  const segmentoOptions = segmentos.map((s) => ({
    value: s.id.toString(),
    label: s.nome,
  }));

  const templateOptions = templates.map((t) => ({
    value: t.template_uuid,
    label: t.nome,
    searchText: t.descricao ?? undefined,
  }));

  const onSubmit = async (data: CreateFormularioFormData) => {
    try {
      const response = await fetch('/api/assinatura-digital/formularios', {
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

      toast.success('Formulário criado com sucesso!');
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao criar formulário';
      toast.error(message);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogHeader>
            <DialogTitle>Criar Novo Formulário</DialogTitle>
            <DialogDescription>
              Configure o formulário e selecione templates opcionais.
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
                {...register('nome')}
                placeholder="Nome do formulário"
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
                readOnly
              />
              {errors.slug && (
                <p className="text-sm text-destructive">{errors.slug.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label>
                Segmento <span className="text-destructive">*</span>
              </Label>
              <Combobox
                options={segmentoOptions}
                value={segmentoId ? [segmentoId] : []}
                onValueChange={(vals) => setSegmentoId(vals[0] || '')}
                placeholder="Selecione um segmento"
                multiple={false}
                disabled={isSubmitting}
              />
              {errors.segmento_id && (
                <p className="text-sm text-destructive">{errors.segmento_id.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="descricao">Descrição</Label>
              <Textarea
                id="descricao"
                {...register('descricao')}
                placeholder="Descrição opcional do formulário"
                disabled={isSubmitting}
              />
              {errors.descricao && (
                <p className="text-sm text-destructive">{errors.descricao.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Templates</Label>
              <Combobox
                options={templateOptions}
                value={templateIds}
                onValueChange={setTemplateIds}
                placeholder="Selecione templates (opcional)"
                multiple={true}
                disabled={isSubmitting}
              />
              {/* Preview dos templates selecionados */}
              {templateIds.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {templateIds.map((templateUuid) => {
                    const template = templates.find(t => t.template_uuid === templateUuid);
                    return (
                      <Badge
                        key={templateUuid}
                        variant="secondary"
                        className="gap-1 pr-1"
                      >
                        <span className="truncate max-w-[150px]">
                          {template?.nome || templateUuid}
                        </span>
                        <button
                          type="button"
                          onClick={() => setTemplateIds(templateIds.filter(id => id !== templateUuid))}
                          className="ml-0.5 rounded-full p-0.5 hover:bg-muted-foreground/20"
                          disabled={isSubmitting}
                        >
                          <X className="h-3 w-3" />
                          <span className="sr-only">Remover {template?.nome || 'template'}</span>
                        </button>
                      </Badge>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="foto_necessaria"
                checked={watch('foto_necessaria')}
                onCheckedChange={(checked) => setValue('foto_necessaria', checked)}
                disabled={isSubmitting}
              />
              <Label htmlFor="foto_necessaria" className="cursor-pointer">
                Foto necessária
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="geolocation_necessaria"
                checked={watch('geolocation_necessaria')}
                onCheckedChange={(checked) => setValue('geolocation_necessaria', checked)}
                disabled={isSubmitting}
              />
              <Label htmlFor="geolocation_necessaria" className="cursor-pointer">
                Geolocalização necessária
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="ativo"
                checked={watch('ativo')}
                onCheckedChange={(checked) => setValue('ativo', checked)}
                disabled={isSubmitting}
              />
              <Label htmlFor="ativo" className="cursor-pointer">
                Formulário ativo
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
              Criar Formulário
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
