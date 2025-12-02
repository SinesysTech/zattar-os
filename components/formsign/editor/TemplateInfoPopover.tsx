'use client';

import { useState } from 'react';
import { FileText, Loader2, Eye, Edit } from 'lucide-react';
import { toast } from 'sonner';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import rehypeSanitize from 'rehype-sanitize';
import { MarkdownRichTextEditorDialog } from './MarkdownRichTextEditorDialog.stub';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { Template, StatusTemplate } from '@/types/formsign';
import { validateMarkdownForForm } from '@/lib/formsign';

interface TemplateInfoPopoverProps {
  trigger: React.ReactNode;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  template?: Template;  // Opcional para modo criação
  onUpdate: (updates: Partial<Template>) => Promise<void>;
  isCreating?: boolean;  // Modo criação
  pdfFile?: File;        // Arquivo PDF para upload (modo criação)
}

const STATUS_OPTIONS: Array<{ value: StatusTemplate; label: string; variant: 'default' | 'secondary' | 'destructive' }> = [
  { value: 'ativo', label: 'Ativo', variant: 'default' },
  { value: 'inativo', label: 'Inativo', variant: 'secondary' },
  { value: 'rascunho', label: 'Rascunho', variant: 'destructive' },
];

export default function TemplateInfoPopover({
  trigger,
  open,
  onOpenChange,
  template,
  onUpdate,
  isCreating = false,
  pdfFile,
}: TemplateInfoPopoverProps) {
  const [formData, setFormData] = useState({
    nome: template?.nome || '',
    descricao: template?.descricao || '',
    status: template?.status || 'ativo' as StatusTemplate,
    conteudo_markdown: template?.conteudo_markdown || '',
  });

  const [isSaving, setIsSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [previewContent, setPreviewContent] = useState('');
  const [showMarkdownEditor, setShowMarkdownEditor] = useState(false);

  const handleOpenPreview = () => {
    if (!formData.conteudo_markdown.trim()) {
      toast.error('Adicione conteúdo Markdown para visualizar');
      return;
    }
    setPreviewContent(formData.conteudo_markdown);
    setShowPreview(true);
  };

  const hasChanges = template ? (
    formData.nome !== template.nome ||
    formData.descricao !== (template.descricao || '') ||
    formData.status !== template.status ||
    formData.conteudo_markdown !== (template.conteudo_markdown || '')
  ) : (
    // Modo criação: validar se tem dados mínimos
    formData.nome.trim() !== ''
  );

  const handleSave = async () => {
    if (!formData.nome.trim()) {
      toast.error('Nome do template é obrigatório');
      return;
    }

    const markdownValidation = validateMarkdownForForm(formData.conteudo_markdown);
    if (!markdownValidation.valid) {
      toast.error(markdownValidation.error);
      return;
    }

    setIsSaving(true);
    try {
      if (isCreating) {
        // Modo criação: fazer upload via FormData
        if (!pdfFile) {
          toast.error('Arquivo PDF é obrigatório');
          return;
        }

        const formDataToSend = new FormData();
        formDataToSend.append('file', pdfFile);
        formDataToSend.append('nome', formData.nome.trim());
        formDataToSend.append('descricao', formData.descricao.trim());
        if (formData.conteudo_markdown.trim()) {
          formDataToSend.append('conteudo_markdown', formData.conteudo_markdown.trim());
        }

        const response = await fetch('/api/assinatura-digital/admin/templates', {
          method: 'POST',
          body: formDataToSend,
          credentials: 'include',
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Erro ao criar template');
        }

        const result = await response.json();
        toast.success('Template criado com sucesso!');

        // Chamar onUpdate com o template criado para que o editor possa atualizar
        await onUpdate(result.data);
        onOpenChange(false);
      } else {
        // Modo edição: enviar payload completo com TODAS as colunas da tabela templates
        if (!template) {
          toast.error('Template não encontrado');
          return;
        }

        await onUpdate({
          template_uuid: template.template_uuid,
          nome: formData.nome.trim(),
          descricao: formData.descricao.trim() || undefined,
          arquivo_original: template.arquivo_original,
          arquivo_nome: template.arquivo_nome,
          arquivo_tamanho: template.arquivo_tamanho,
          status: formData.status,
          versao: template.versao,
          ativo: template.ativo,
          campos: template.campos,
          conteudo_markdown: formData.conteudo_markdown.trim() || null,
          criado_por: template.criado_por,
        });

        toast.success('Informações do template atualizadas com sucesso!');
        onOpenChange(false);
      }
    } catch (error) {
      console.error('Erro ao salvar template:', error);
      toast.error(
        error instanceof Error ? error.message : 'Erro ao salvar template'
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    // Resetar formulário para valores originais
    if (template) {
      setFormData({
        nome: template.nome,
        descricao: template.descricao || '',
        status: template.status,
        conteudo_markdown: template.conteudo_markdown || '',
      });
    }
    onOpenChange(false);
  };

  /**
   * Salvar conteúdo markdown diretamente no backend (sem segundo clique)
   * Usado pelo MarkdownRichTextEditorDialog para salvamento imediato
   *
   * IMPORTANTE: Envia payload completo com todos os campos atualizáveis,
   * não apenas o campo modificado. Isso garante consistência com n8n.
   */
  const handleSaveMarkdownDirectly = async (markdown: string) => {
    if (isCreating) {
      // Modo criação: apenas atualizar estado local, criação completa acontece em handleSave
      setFormData(prev => ({ ...prev, conteudo_markdown: markdown }));
      toast.success('Conteúdo markdown atualizado');
      return;
    }

    if (!template) {
      toast.error('Template não encontrado');
      return;
    }

    // Modo edição: enviar payload completo com TODAS as colunas da tabela templates
    // (exceto id, createdAt, updatedAt que são gerenciados pelo sistema)
    await onUpdate({
      template_uuid: template.template_uuid,
      nome: formData.nome,
      descricao: formData.descricao || undefined,
      arquivo_original: template.arquivo_original,
      arquivo_nome: template.arquivo_nome,
      arquivo_tamanho: template.arquivo_tamanho,
      status: formData.status,
      versao: template.versao,
      ativo: template.ativo,
      campos: template.campos,
      conteudo_markdown: markdown.trim(),
      criado_por: template.criado_por,
    });

    // Atualizar estado local também
    setFormData(prev => ({ ...prev, conteudo_markdown: markdown }));
    toast.success('Conteúdo markdown salvo com sucesso!');
  };

  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>{trigger}</PopoverTrigger>
      <PopoverContent
        side="right"
        sideOffset={12}
        className="w-96 max-h-[85vh] overflow-auto p-4"
      >
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              <h3 className="text-sm font-semibold">
                {isCreating ? 'Informações do Novo Template' : 'Informações do Template'}
              </h3>
            </div>
            {!isCreating && (
              <Badge
                variant={STATUS_OPTIONS.find(s => s.value === formData.status)?.variant || 'default'}
                className="text-xs"
              >
                {STATUS_OPTIONS.find(s => s.value === formData.status)?.label}
              </Badge>
            )}
          </div>

          {/* Nome */}
          <div className="space-y-2">
            <Label htmlFor="template-nome" className="text-xs font-medium">
              Nome do Template *
            </Label>
            <Input
              id="template-nome"
              value={formData.nome}
              onChange={(e) => setFormData(prev => ({ ...prev, nome: e.target.value }))}
              className="h-9 text-sm"
              placeholder="Ex: Contrato Apps - Uber 2024"
            />
          </div>

          {/* Descrição */}
          <div className="space-y-2">
            <Label htmlFor="template-descricao" className="text-xs font-medium">
              Descrição
            </Label>
            <Textarea
              id="template-descricao"
              value={formData.descricao}
              onChange={(e) => setFormData(prev => ({ ...prev, descricao: e.target.value }))}
              className="text-sm resize-none"
              rows={3}
              placeholder="Informações adicionais sobre o uso deste template (opcional)"
            />
          </div>

          <Separator />

          {/* Conteúdo Markdown */}
          <div className="space-y-2">
            <Label htmlFor="template-markdown" className="text-xs font-medium">
              Conteúdo Markdown (Opcional)
            </Label>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowMarkdownEditor(true)}
                className="flex-1 gap-2"
              >
                <Edit className="h-4 w-4" />
                {formData.conteudo_markdown.trim() === '' ? 'Adicionar Conteúdo' : 'Editar Conteúdo'}
              </Button>
              {formData.conteudo_markdown.trim() !== '' && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleOpenPreview}
                  className="flex-1 gap-2"
                >
                  <Eye className="h-4 w-4" />
                  Pré-visualizar
                </Button>
              )}
            </div>
          </div>

          <Separator />

          {/* Status */}
          <div className="space-y-2">
            <Label htmlFor="template-status" className="text-xs font-medium">
              Status *
            </Label>
            <Select
              value={formData.status}
              onValueChange={(value: StatusTemplate) =>
                setFormData(prev => ({ ...prev, status: value }))
              }
            >
              <SelectTrigger id="template-status" className="h-9">
                <SelectValue placeholder="Selecione o status" />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Ações */}
          <div className="flex gap-2 pt-2 border-t">
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={handleCancel}
              disabled={isSaving}
            >
              Cancelar
            </Button>
            <Button
              size="sm"
              className="flex-1 gap-2"
              onClick={handleSave}
              disabled={!hasChanges || isSaving}
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {isCreating ? 'Criando...' : 'Salvando...'}
                </>
              ) : (
                isCreating ? 'Criar Template' : 'Salvar Alterações'
              )}
            </Button>
          </div>
        </div>
      </PopoverContent>

      <MarkdownRichTextEditorDialog
        open={showMarkdownEditor}
        onOpenChange={setShowMarkdownEditor}
        value={formData.conteudo_markdown}
        onChange={(markdown) => setFormData(prev => ({ ...prev, conteudo_markdown: markdown }))}
        formularios={[]}
        title="Editar Conteúdo Markdown do Template"
        onSaveToBackend={handleSaveMarkdownDirectly}
      />

      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-4xl max-h-[85vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>Preview do Markdown</DialogTitle>
            <DialogDescription>
              Visualização do conteúdo formatado (variáveis não são substituídas neste preview)
            </DialogDescription>
          </DialogHeader>
          
          <Separator />
          
          <div className="prose prose-slate dark:prose-invert max-w-none">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              rehypePlugins={[rehypeRaw, rehypeSanitize]}
            >
              {previewContent}
            </ReactMarkdown>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPreview(false)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Popover>
  );
}