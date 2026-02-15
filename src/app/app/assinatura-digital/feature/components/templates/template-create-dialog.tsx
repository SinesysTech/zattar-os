'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DialogFormShell } from '@/components/shared/dialog-shell';
import { TemplateFormFields } from './template-form-fields';
import {
  templateFormSchema,
  type TemplateFormData,
  type CreateTemplateInput,
  type Segmento,
  type TipoTemplate,
} from '../../types';
import { listarSegmentosAction, criarTemplateAction } from '../../actions';

/**
 * Props do TemplateCreateDialog
 */
export interface TemplateCreateDialogProps {
  /** Controla se o diálogo está aberto */
  open: boolean;
  /** Callback quando o estado de abertura muda */
  onOpenChange: (open: boolean) => void;
  /** Callback quando o template é criado com sucesso */
  onSuccess?: () => void;
  /** Tipo de template inicial (default: markdown) */
  initialTipoTemplate?: TipoTemplate;
}

/**
 * Diálogo de criação de template usando DialogFormShell.
 *
 * Features:
 * - Formulário com validação Zod
 * - Suporte para templates PDF e Markdown
 * - Busca automática de segmentos
 * - Estados de loading e erro
 * - Toast de sucesso/erro
 * - Revalidação de cache após sucesso
 */
export function TemplateCreateDialog({
  open,
  onOpenChange,
  onSuccess,
  initialTipoTemplate = 'markdown',
}: TemplateCreateDialogProps) {
  const [segmentos, setSegmentos] = React.useState<Segmento[]>([]);
  const [isLoadingSegmentos, setIsLoadingSegmentos] = React.useState(false);
  const [tipoTemplate, setTipoTemplate] = React.useState<TipoTemplate>(initialTipoTemplate);

  const form = useForm<TemplateFormData>({
    resolver: zodResolver(templateFormSchema),
    defaultValues: {
      nome: '',
      descricao: '',
      tipo_template: initialTipoTemplate,
      conteudo_markdown: '',
      segmento_id: undefined,
      pdf_url: undefined,
      ativo: true,
      status: 'rascunho',
      versao: 1,
    },
  });

  const { handleSubmit, reset, formState: { isSubmitting }, watch, getValues } = form;

  // Buscar segmentos quando o diálogo abre
  React.useEffect(() => {
    if (open) {
      setIsLoadingSegmentos(true);
      listarSegmentosAction({ ativo: true })
        .then((response) => {
          if (!response.success) {
            const errorMsg = 'error' in response ? response.error : 'Erro desconhecido';
            toast.error('Erro ao carregar segmentos: ' + errorMsg);
            return;
          }

          if ('data' in response) {
            setSegmentos(response.data ?? []);
          }
        })
        .catch((error) => {
          toast.error('Erro ao carregar segmentos: ' + error.message);
        })
        .finally(() => {
          setIsLoadingSegmentos(false);
        });
    }
  }, [open]);

  // Reset form quando o diálogo fecha
  React.useEffect(() => {
    if (!open) {
      reset({
        nome: '',
        descricao: '',
        tipo_template: initialTipoTemplate,
        conteudo_markdown: '',
        segmento_id: undefined,
        pdf_url: undefined,
        ativo: true,
        status: 'rascunho',
        versao: 1,
      });
      setTipoTemplate(initialTipoTemplate);
    }
  }, [open, reset, initialTipoTemplate]);

  // Handler para mudança de tipo de template
  const handleTipoTemplateChange = (tipo: TipoTemplate) => {
    setTipoTemplate(tipo);
  };

  // Handler de submit
  const onSubmit = async (data: TemplateFormData) => {
    try {
      // O schema templateFormSchema já valida condicionalmente baseado no tipo_template
      // Não é necessário validação manual adicional aqui

      // Converter para o tipo esperado pela action
      const createInput: CreateTemplateInput = {
        nome: data.nome,
        descricao: data.descricao,
        tipo_template: tipoTemplate,
        conteudo_markdown: data.conteudo_markdown,
        segmento_id: data.segmento_id ?? null,
        pdf_url: data.pdf_url ?? null,
        arquivo_original: data.arquivo_original,
        arquivo_nome: data.arquivo_nome,
        arquivo_tamanho: data.arquivo_tamanho,
        ativo: data.ativo ?? true,
        status: data.status ?? 'rascunho',
        versao: data.versao ?? 1,
      };

      const result = await criarTemplateAction(createInput);

      if (!result.success) {
        throw new Error('error' in result ? result.error : 'Erro ao criar template');
      }

      toast.success(`Template ${tipoTemplate === 'pdf' ? 'PDF' : 'Markdown'} criado com sucesso!`);
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      const message = error instanceof Error
        ? error.message
        : `Erro ao criar template ${tipoTemplate === 'pdf' ? 'PDF' : 'Markdown'}.`;
      toast.error(message);
    }
  };

  // Verificar se pode submeter
  const canSubmit = React.useMemo(() => {
    if (isSubmitting) return false;

    const values = getValues();

    if (tipoTemplate === 'pdf') {
      return Boolean(values.pdf_url || values.arquivo_original);
    }

    return Boolean(values.conteudo_markdown && values.conteudo_markdown.trim());
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSubmitting, tipoTemplate, watch()]);

  return (
    <DialogFormShell
      open={open}
      onOpenChange={onOpenChange}
      title="Criar Novo Template"
      maxWidth="2xl"
      footer={
        <Button
          type="submit"
          form="template-create-form"
          disabled={!canSubmit}
        >
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Criar Template
        </Button>
      }
    >
      {isLoadingSegmentos ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <form
          id="template-create-form"
          onSubmit={handleSubmit(onSubmit)}
          className="px-6 py-4 space-y-4"
        >
          <TemplateFormFields
            form={form}
            tipoTemplate={tipoTemplate}
            onTipoTemplateChange={handleTipoTemplateChange}
            segmentos={segmentos}
            isSubmitting={isSubmitting}
          />
        </form>
      )}
    </DialogFormShell>
  );
}
