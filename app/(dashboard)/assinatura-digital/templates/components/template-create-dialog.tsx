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
import { toast } from 'sonner';
import { Loader2, FileUp, X, FileText } from 'lucide-react';

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

  const [isUploading, setIsUploading] = React.useState(false);
  const [uploadError, setUploadError] = React.useState<string | null>(null);
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Reset form when dialog closes
  React.useEffect(() => {
    if (!open) {
      reset();
      setSelectedFile(null);
      setUploadError(null);
    }
  }, [open, reset]);

  // Check if we have a valid file based on the form fields
  const arquivoOriginal = watch('arquivo_original');
  const arquivoNome = watch('arquivo_nome');
  const arquivoTamanho = watch('arquivo_tamanho');
  const hasValidFile = Boolean(arquivoOriginal && arquivoNome && arquivoTamanho > 0);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (file.type !== 'application/pdf') {
      setUploadError('Apenas arquivos PDF são permitidos');
      return;
    }

    // Validate file size (10MB)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      setUploadError('Arquivo muito grande. Máximo permitido: 10MB');
      return;
    }

    setSelectedFile(file);
    setUploadError(null);
    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/assinatura-digital/templates/upload', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Erro ao fazer upload');
      }

      // Set form fields with upload result
      setValue('arquivo_original', result.data.url);
      setValue('arquivo_nome', result.data.nome);
      setValue('arquivo_tamanho', result.data.tamanho);
      toast.success('PDF enviado com sucesso!');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao fazer upload';
      setUploadError(message);
      setSelectedFile(null);
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setValue('arquivo_original', '');
    setValue('arquivo_nome', '');
    setValue('arquivo_tamanho', 0);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

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

              {!hasValidFile ? (
                <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center hover:border-muted-foreground/50 transition-colors">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="application/pdf"
                    onChange={handleFileSelect}
                    disabled={isUploading || isSubmitting}
                    className="hidden"
                    id="pdf-upload"
                  />
                  <label
                    htmlFor="pdf-upload"
                    className="cursor-pointer flex flex-col items-center gap-2"
                  >
                    {isUploading ? (
                      <>
                        <Loader2 className="h-8 w-8 text-muted-foreground animate-spin" />
                        <span className="text-sm text-muted-foreground">Enviando arquivo...</span>
                      </>
                    ) : (
                      <>
                        <FileUp className="h-8 w-8 text-muted-foreground" />
                        <span className="text-sm font-medium">Clique para selecionar um PDF</span>
                        <span className="text-xs text-muted-foreground">Máximo 10MB</span>
                      </>
                    )}
                  </label>
                </div>
              ) : (
                <div className="border rounded-lg p-4 bg-muted/50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <FileText className="h-8 w-8 text-red-500" />
                      <div>
                        <p className="text-sm font-medium">{arquivoNome}</p>
                        <p className="text-xs text-muted-foreground">{formatFileSize(arquivoTamanho)}</p>
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={handleRemoveFile}
                      disabled={isSubmitting}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}

              {errors.arquivo_original && (
                <p className="text-sm text-destructive">{errors.arquivo_original.message}</p>
              )}
              {uploadError && (
                <p className="text-sm text-destructive">{uploadError}</p>
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