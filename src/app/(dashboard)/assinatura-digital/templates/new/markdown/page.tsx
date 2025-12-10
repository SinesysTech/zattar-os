'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Loader2, ArrowLeft } from 'lucide-react';

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

import MarkdownRichTextEditor from '@/components/MarkdownRichTextEditor'; // Reutilizar editor existente

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
  const [segments, setSegments] = React.useState<Segmento[]>([]);
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

  const onSubmit = async (data: FormData) => {
    try {
      const result = await criarTemplateAction(data);
      if (!result.success) {
        throw new Error(result.error);
      }
      toast.success('Template Markdown criado com sucesso!');
      router.push('/assinatura-digital/templates');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao criar template Markdown.';
      toast.error(message);
      // Aqui você pode adicionar lógica para setar erros específicos no formulário, ex: setError('nome', { message: '...' })
    }
  };

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
          <CardTitle>Criar Novo Template Markdown</CardTitle>
          <CardDescription>
            Defina o conteúdo do template usando Markdown e variáveis.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="space-y-6">
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

            <div className="space-y-2">
              <Label htmlFor="conteudo_markdown">Conteúdo Markdown</Label>
              <MarkdownRichTextEditor
                value={watch('conteudo_markdown') || ''}
                onChange={(value) => setValue('conteudo_markdown', value)}
                placeholder="Escreva seu conteúdo Markdown aqui..."
                disabled={isSubmitting}
              />
              {errors.conteudo_markdown && (
                <p className="text-sm text-destructive">{errors.conteudo_markdown.message}</p>
              )}
            </div>

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
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Criar Template
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}