'use client';

import * as React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Loader2, ArrowLeft, FileText, FileUp, X } from 'lucide-react';

import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

import { MarkdownRichTextEditor } from '@/features/assinatura-digital/components/editor/MarkdownRichTextEditor';

import {
  createTemplateSchema,
  listarSegmentosAction,
  Segmento,
  criarTemplateAction,
  TipoTemplate,
} from '@/core/assinatura-digital';

const formSchema = createTemplateSchema.extend({
  // Adicionar campos específicos da UI, se necessário, ou remover os do schema principal se forem apenas de backend
});

type FormData = z.infer<typeof formSchema>;

export default function CreateMarkdownTemplatePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [segments, setSegments] = React.useState<Segmento[]>([]);
  // Aceitar tipo via searchParams ou default para markdown
  const tipoInicial = (searchParams?.get('tipo') as TipoTemplate) || 'markdown';
  const [tipoTemplate, setTipoTemplate] = React.useState<TipoTemplate>(tipoInicial);
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null);
  const [isUploading, setIsUploading] = React.useState(false);
  const [uploadError, setUploadError] = React.useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nome: '',
      descricao: '',
      tipo_template: 'markdown',
      conteudo_markdown: '',
      segmento_id: undefined, // undefined para que o Zod trate como opcional
      ativo: true,
    },
  });

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
    setError,
  } = form;

  React.useEffect(() => {
    async function fetchSegments() {
      const response = await listarSegmentosAction({ ativo: true });
      if (response.success) {
        setSegments(response.data || []);
      } else {
        toast.error('Erro ao carregar segmentos: ' + response.error);
      }
    }
    fetchSegments();
  }, []);

  // Atualizar tipo_template quando o seletor mudar
  React.useEffect(() => {
    setValue('tipo_template', tipoTemplate);
    if (tipoTemplate === 'pdf') {
      setValue('conteudo_markdown', null);
    } else {
      setValue('pdf_url', null);
      setValue('arquivo_original', null);
      setValue('arquivo_nome', null);
      setValue('arquivo_tamanho', null);
    }
  }, [tipoTemplate, setValue]);

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
      setValue('pdf_url', result.data.url);
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
    setValue('pdf_url', null);
    setValue('arquivo_original', null);
    setValue('arquivo_nome', null);
    setValue('arquivo_tamanho', null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const onSubmit = async (data: FormData) => {
    try {
      // Validar campos baseado no tipo
      if (tipoTemplate === 'pdf') {
        if (!data.pdf_url && !data.arquivo_original) {
          setError('pdf_url', { message: 'PDF é obrigatório para templates PDF' });
          return;
        }
      } else {
        if (!data.conteudo_markdown || data.conteudo_markdown.trim() === '') {
          setError('conteudo_markdown', { message: 'Conteúdo Markdown é obrigatório' });
          return;
        }
      }

      const result = await criarTemplateAction({
        ...data,
        tipo_template: tipoTemplate,
      });
      if (!result.success) {
        throw new Error(result.error);
      }
      toast.success(`Template ${tipoTemplate === 'pdf' ? 'PDF' : 'Markdown'} criado com sucesso!`);
      router.push('/assinatura-digital/templates');
    } catch (error) {
      const message = error instanceof Error ? error.message : `Erro ao criar template ${tipoTemplate === 'pdf' ? 'PDF' : 'Markdown'}.`;
      toast.error(message);
    }
  };

  const arquivoOriginal = watch('arquivo_original');
  const arquivoNome = watch('arquivo_nome');
  const arquivoTamanho = watch('arquivo_tamanho');
  const hasValidFile = Boolean(arquivoOriginal && arquivoNome && arquivoTamanho);

  return (
    <div className="container mx-auto py-8">
      <Button
        variant="outline"
        onClick={() => router.push('/assinatura-digital/templates')}
        className="mb-6"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Voltar para Templates
      </Button>

      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle>Criar Novo Template</CardTitle>
          <CardDescription>
            Escolha o tipo de template e configure o conteúdo.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="space-y-6">
            {/* Seletor de Tipo de Template */}
            <div className="space-y-2">
              <Label htmlFor="tipo_template">
                Tipo de Template <span className="text-destructive">*</span>
              </Label>
              <Tabs value={tipoTemplate} onValueChange={(value) => setTipoTemplate(value as TipoTemplate)}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="markdown" className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Editor Texto (Markdown)
                  </TabsTrigger>
                  <TabsTrigger value="pdf" className="flex items-center gap-2">
                    <FileUp className="h-4 w-4" />
                    PDF Upload
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            <Separator />
            <div className="space-y-2">
              <Label htmlFor="nome">Nome do Template</Label>
              <Input
                id="nome"
                {...register('nome')}
                placeholder="Ex: Contrato de Prestação de Serviços"
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
                placeholder="Breve descrição do template"
                disabled={isSubmitting}
              />
              {errors.descricao && (
                <p className="text-sm text-destructive">{errors.descricao.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="segmento_id">Segmento (Opcional)</Label>
              <Select
                onValueChange={(value) => setValue('segmento_id', value === '' ? undefined : Number(value))}
                value={watch('segmento_id')?.toString() || ''}
                disabled={isSubmitting}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um segmento" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Nenhum</SelectItem>
                  {segments.map((segment) => (
                    <SelectItem key={segment.id} value={segment.id.toString()}>
                      {segment.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.segmento_id && (
                <p className="text-sm text-destructive">{errors.segmento_id.message}</p>
              )}
            </div>

            {/* Conteúdo Markdown (apenas para tipo markdown) */}
            {tipoTemplate === 'markdown' && (
              <div className="space-y-2">
                <Label htmlFor="conteudo_markdown">
                  Conteúdo Markdown <span className="text-destructive">*</span>
                </Label>
                <MarkdownRichTextEditor
                  value={watch('conteudo_markdown') || ''}
                  onChange={(value) => setValue('conteudo_markdown', value)}
                  formularios={[]}
                />
                {errors.conteudo_markdown && (
                  <p className="text-sm text-destructive">{errors.conteudo_markdown.message}</p>
                )}
              </div>
            )}

            {/* Upload de PDF (apenas para tipo pdf) */}
            {tipoTemplate === 'pdf' && (
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
                          <p className="text-xs text-muted-foreground">{formatFileSize(arquivoTamanho || 0)}</p>
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

                {errors.pdf_url && (
                  <p className="text-sm text-destructive">{errors.pdf_url.message}</p>
                )}
                {errors.arquivo_original && (
                  <p className="text-sm text-destructive">{errors.arquivo_original.message}</p>
                )}
                {uploadError && (
                  <p className="text-sm text-destructive">{uploadError}</p>
                )}
              </div>
            )}

            <div className="flex items-center space-x-2">
              <Checkbox
                id="ativo"
                checked={watch('ativo')}
                onCheckedChange={(checked) => setValue('ativo', checked)}
                disabled={isSubmitting}
              />
              <Label htmlFor="ativo" className="cursor-pointer">
                Ativo
              </Label>
            </div>

            {/* Variáveis Disponíveis (apenas para tipo markdown) */}
            {tipoTemplate === 'markdown' && (
              <>
                <Separator />
                <div>
                  <h3 className="text-lg font-semibold mb-2">Variáveis Disponíveis</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Use a sintaxe `{{variavel}}` para inserir dados dinâmicos no seu template.
                  </p>
                  {/* Exemplo de variáveis - pode ser dinâmico ou fixo */}
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <h4 className="font-medium">Cliente:</h4>
                      <ul>
                        <li>`{{cliente.nome}}`</li>
                        <li>`{{cliente.cpf_cnpj}}`</li>
                        <li>`{{cliente.endereco}}`</li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-medium">Processo:</h4>
                      <ul>
                        <li>`{{processo.numero}}`</li>
                        <li>`{{processo.vara}}`</li>
                        <li>`{{processo.data}}`</li>
                      </ul>
                    </div>
                  </div>
                  {/* Implementar preview em tempo real aqui */}
                </div>
              </>
            )}
          </CardContent>
          <CardFooter className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push('/assinatura-digital/templates')}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting || (tipoTemplate === 'pdf' && !hasValidFile && !isUploading) || (tipoTemplate === 'markdown' && !watch('conteudo_markdown'))}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Criar Template
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}