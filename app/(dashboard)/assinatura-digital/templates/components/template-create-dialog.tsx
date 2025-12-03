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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Dropzone, DropzoneContent, DropzoneEmptyState } from '@/components/dropzone';
import { useSupabaseUpload } from '@/hooks/use-supabase-upload';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

const createTemplateSchema = z.object({
  nome: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres'),
  descricao: z.string().max(500, 'Descrição deve ter no máximo 500 caracteres').optional(),
  status: z.enum(['ativo', 'inativo', 'rascunho']).default('rascunho'),
  ativo: z.boolean().default(true),
  arquivo_original: z.string().min(1, 'PDF é obrigatório'),
  arquivo_nome: z.string().min(1),
  arquivo_tamanho: z.number().positive(),
});

type CreateTemplateFormData = z.infer<typeof createTemplateSchema>;

interface TemplateCreateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function TemplateCreateDialog({
  open,
  onOpenChange,
  onSuccess,
}: TemplateCreateDialogProps) {
  const form = useForm<CreateTemplateFormData>({
    resolver: zodResolver(createTemplateSchema),
    defaultValues: {
      nome: '',
      descricao: '',
      status: 'rascunho',
      ativo: true,
      arquivo_original: '',
      arquivo_nome: '',
      arquivo_tamanho: 0,
    },
  });

  const { register, handleSubmit, setValue, watch, formState: { errors, isSubmitting }, reset } = form;

  const uploadHook = useSupabaseUpload({
    bucketName: 'templates',
    allowedMimeTypes: ['application/pdf'],
    maxFiles: 1,
    maxFileSize: 10 * 1024 * 1024, // 10MB
  });

  const { files, isSuccess, successes, errors: uploadErrors, loading: isUploading } = uploadHook;

  // When upload succeeds, set the form fields
  React.useEffect(() => {
    if (isSuccess && successes.length > 0 && files.length > 0) {
      const file = files[0];
      setValue('arquivo_original', successes[0]); // Assuming successes[0] is the public URL
      setValue('arquivo_nome', file.name);
      setValue('arquivo_tamanho', file.size);
    }
  }, [isSuccess, successes, files, setValue]);

  // Reset form when dialog closes
  React.useEffect(() => {
    if (!open) {
      reset();
    }
  }, [open, reset]);

  // Check if we have a valid file based on the form fields
  const arquivoOriginal = watch('arquivo_original');
  const arquivoNome = watch('arquivo_nome');
  const arquivoTamanho = watch('arquivo_tamanho');
  const hasValidFile = Boolean(arquivoOriginal && arquivoNome && arquivoTamanho > 0);

  const onSubmit = async (data: CreateTemplateFormData) => {
    try {
      const response = await fetch('/api/assinatura-digital/templates', {
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

      toast.success('Template criado com sucesso!');
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao criar template';
      toast.error(message);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogHeader>
            <DialogTitle>Criar Novo Template</DialogTitle>
            <DialogDescription>
              Faça upload de um PDF e configure o template para assinatura digital.
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
                placeholder="Nome do template"
                disabled={isSubmitting}
              />
              {errors.nome && (
                <p className="text-sm text-destructive">{errors.nome.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="descricao">Descrição</Label>
              <Textarea
                id="descricao"
                {...register('descricao')}
                placeholder="Descrição opcional do template"
                disabled={isSubmitting}
              />
              {errors.descricao && (
                <p className="text-sm text-destructive">{errors.descricao.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label>
                Upload de PDF <span className="text-destructive">*</span>
              </Label>
              <Dropzone {...uploadHook}>
                {files.length > 0 ? <DropzoneContent /> : <DropzoneEmptyState />}
              </Dropzone>
              {errors.arquivo_original && (
                <p className="text-sm text-destructive">{errors.arquivo_original.message}</p>
              )}
              {uploadErrors && uploadErrors.length > 0 && (
                <div className="text-sm text-destructive">
                  {uploadErrors.map((err, i) => (
                    <p key={i}>{err.name}: {err.message || 'Erro no upload do arquivo'}</p>
                  ))}
                </div>
              )}
              {isUploading && (
                <p className="text-sm text-muted-foreground">Fazendo upload...</p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                value={watch('status')}
                onValueChange={(value: 'ativo' | 'inativo' | 'rascunho') => setValue('status', value)}
                disabled={isSubmitting}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="rascunho">Rascunho</SelectItem>
                  <SelectItem value="ativo">Ativo</SelectItem>
                  <SelectItem value="inativo">Inativo</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="ativo"
                checked={watch('ativo')}
                onCheckedChange={(checked) => setValue('ativo', checked)}
                disabled={isSubmitting}
              />
              <Label htmlFor="ativo" className="cursor-pointer">
                Template ativo
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
            <Button type="submit" disabled={isSubmitting || !hasValidFile || isUploading}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Criar Template
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}