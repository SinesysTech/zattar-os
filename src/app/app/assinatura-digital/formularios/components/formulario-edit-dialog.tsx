import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { DialogFormShell } from '@/components/shared/dialog-shell/dialog-form-shell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Combobox } from '@/components/ui/combobox';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Loader2, Pencil, X } from 'lucide-react';
import {
  generateSlug,
  type AssinaturaDigitalFormulario,
  type AssinaturaDigitalSegmento,
  type AssinaturaDigitalTemplate,
} from '../../feature';

const editFormularioSchema = z.object({
  nome: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres'),
  slug: z
    .string()
    .min(3, 'Slug deve ter pelo menos 3 caracteres')
    .regex(/^[a-z0-9-]+$/, 'Slug deve conter apenas letras minúsculas, números e hífens'),
  segmento_id: z.coerce.number().int().positive('Segmento é obrigatório'),
  descricao: z.string().max(500, 'Descrição deve ter no máximo 500 caracteres').optional(),
  template_ids: z.array(z.string()).optional(),
  ativo: z.boolean(),
  foto_necessaria: z.boolean(),
  geolocation_necessaria: z.boolean(),
});

type EditFormularioFormData = z.infer<typeof editFormularioSchema>;

interface FormularioEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  formulario: AssinaturaDigitalFormulario | null;
  onSuccess: () => void;
  onEditSchema: (formulario: AssinaturaDigitalFormulario) => void;
  segmentos: AssinaturaDigitalSegmento[];
  templates: AssinaturaDigitalTemplate[];
}

export function FormularioEditDialog({
  open,
  onOpenChange,
  formulario,
  onSuccess,
  onEditSchema,
  segmentos,
  templates,
}: FormularioEditDialogProps) {
  const form = useForm<EditFormularioFormData>({
    resolver: zodResolver(editFormularioSchema),
    defaultValues: {},
  });

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
    reset,
    setError,
  } = form;

  const [segmentoId, setSegmentoId] = React.useState<string>('');
  const [templateIds, setTemplateIds] = React.useState<string[]>([]);

  // Pre-populate form when formulario changes
  React.useEffect(() => {
    if (formulario) {
      reset({
        nome: formulario.nome,
        slug: formulario.slug,
        segmento_id: formulario.segmento_id,
        descricao: formulario.descricao || '',
        template_ids: formulario.template_ids || [],
        ativo: formulario.ativo,
        foto_necessaria: formulario.foto_necessaria ?? true,
        geolocation_necessaria: formulario.geolocation_necessaria ?? false,
      });
      setSegmentoId(formulario.segmento_id.toString());
      setTemplateIds(formulario.template_ids || []);
    }
  }, [formulario, reset]);

  // Reset form when dialog closes
  React.useEffect(() => {
    if (!open) {
      reset();
      setSegmentoId('');
      setTemplateIds([]);
    }
  }, [open, reset]);

  // Sync segmento_id and template_ids with form
  React.useEffect(() => {
    setValue('segmento_id', segmentoId ? parseInt(segmentoId, 10) : 0);
  }, [segmentoId, setValue]);

  React.useEffect(() => {
    setValue('template_ids', templateIds);
  }, [templateIds, setValue]);

  // Auto-generate slug on nome blur if slug hasn't been manually changed
  const handleNomeBlur = () => {
    if (!formulario) return;
    const nome = watch('nome');
    const slug = watch('slug');
    if (nome && slug === formulario.slug) {
      setValue('slug', generateSlug(nome));
    }
  };

  const segmentoOptions = segmentos.map((s) => ({
    value: s.id.toString(),
    label: s.nome,
  }));

  const templateOptions = templates.map((t) => ({
    value: t.template_uuid,
    label: t.nome,
    searchText: t.descricao ?? undefined,
  }));

  const onSubmit = async (data: EditFormularioFormData) => {
    if (!formulario) return;

    try {
      // Check slug uniqueness excluding current formulario
      if (data.slug !== formulario.slug) {
        const checkResponse = await fetch(
          `/api/assinatura-digital/formularios?search=${encodeURIComponent(data.slug)}`
        );
        if (checkResponse.ok) {
          const checkData = await checkResponse.json();
          const existing = (checkData.data || []).find(
            (f: AssinaturaDigitalFormulario) =>
              f.slug === data.slug && f.id !== formulario.id
          );
          if (existing) {
            setError('slug', { message: 'Slug já existe. Escolha um slug diferente.' });
            return;
          }
        }
      }

      // Compute changed fields for partial update
      const changedData: Record<string, unknown> = {};
      if (data.nome !== formulario.nome) changedData.nome = data.nome;
      if (data.slug !== formulario.slug) changedData.slug = data.slug;
      if (data.segmento_id !== formulario.segmento_id) changedData.segmento_id = data.segmento_id;
      if (data.descricao !== (formulario.descricao || '')) changedData.descricao = data.descricao;
      if (data.ativo !== formulario.ativo) changedData.ativo = data.ativo;
      if (data.foto_necessaria !== (formulario.foto_necessaria ?? true))
        changedData.foto_necessaria = data.foto_necessaria;
      if (data.geolocation_necessaria !== (formulario.geolocation_necessaria ?? false))
        changedData.geolocation_necessaria = data.geolocation_necessaria;

      // Compare template_ids arrays
      const originalIds = [...(formulario.template_ids || [])].sort();
      const newIds = [...(data.template_ids || [])].sort();
      if (JSON.stringify(originalIds) !== JSON.stringify(newIds)) {
        changedData.template_ids = data.template_ids || [];
      }

      if (Object.keys(changedData).length === 0) {
        toast.info('Nenhuma alteração detectada.');
        return;
      }

      const response = await fetch(`/api/assinatura-digital/formularios/${formulario.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(changedData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Erro desconhecido' }));
        throw new Error(errorData.error || `Erro ${response.status}: ${response.statusText}`);
      }

      toast.success('Formulário atualizado com sucesso!');
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao atualizar formulário';
      toast.error(message);
    }
  };

  if (!formulario) return null;

  return (
    <DialogFormShell
      open={open}
      onOpenChange={onOpenChange}
      title="Editar Formulário"
      maxWidth="2xl"
      footer={
        <Button type="submit" form="formulario-edit-form" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Salvar Alterações
        </Button>
      }
    >
      <form id="formulario-edit-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4 p-6">
        {Object.keys(errors).length > 0 && (
          <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">
            Corrija os erros no formulário antes de continuar.
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="edit-nome">
            Nome <span className="text-destructive">*</span>
          </Label>
          <Input
            id="edit-nome"
            {...register('nome', { onBlur: handleNomeBlur })}
            placeholder="Nome do formulário"
            disabled={isSubmitting}
          />
          {errors.nome && <p className="text-sm text-destructive">{errors.nome.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="edit-slug">
            Slug <span className="text-destructive">*</span>
          </Label>
          <Input
            id="edit-slug"
            {...register('slug')}
            placeholder="Slug único"
            disabled={isSubmitting}
          />
          {errors.slug && <p className="text-sm text-destructive">{errors.slug.message}</p>}
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
          <Label htmlFor="edit-descricao">Descrição</Label>
          <Textarea
            id="edit-descricao"
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
          {templateIds.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {templateIds.map((templateUuid) => {
                const template = templates.find((t) => t.template_uuid === templateUuid);
                return (
                  <Badge key={templateUuid} variant="secondary" className="gap-1 pr-1">
                    <span className="truncate max-w-[150px]">
                      {template?.nome || templateUuid}
                    </span>
                    <button
                      type="button"
                      onClick={() => setTemplateIds(templateIds.filter((id) => id !== templateUuid))}
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
            id="edit-foto_necessaria"
            checked={watch('foto_necessaria')}
            onCheckedChange={(checked) => setValue('foto_necessaria', checked)}
            disabled={isSubmitting}
          />
          <Label htmlFor="edit-foto_necessaria" className="cursor-pointer">
            Foto necessária
          </Label>
        </div>

        <div className="flex items-center space-x-2">
          <Switch
            id="edit-geolocation_necessaria"
            checked={watch('geolocation_necessaria')}
            onCheckedChange={(checked) => setValue('geolocation_necessaria', checked)}
            disabled={isSubmitting}
          />
          <Label htmlFor="edit-geolocation_necessaria" className="cursor-pointer">
            Geolocalização necessária
          </Label>
        </div>

        <div className="flex items-center space-x-2">
          <Switch
            id="edit-ativo"
            checked={watch('ativo')}
            onCheckedChange={(checked) => setValue('ativo', checked)}
            disabled={isSubmitting}
          />
          <Label htmlFor="edit-ativo" className="cursor-pointer">
            Formulário ativo
          </Label>
        </div>

        <div className="pt-2 border-t">
          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={() => {
              onOpenChange(false);
              onEditSchema(formulario);
            }}
            disabled={isSubmitting}
          >
            <Pencil className="mr-2 h-4 w-4" />
            Editar campos do formulário
          </Button>
        </div>
      </form>
    </DialogFormShell>
  );
}
