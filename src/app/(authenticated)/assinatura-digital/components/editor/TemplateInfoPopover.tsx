'use client';

import { cn } from '@/lib/utils';
import { useState } from 'react';
import { FileText, Eye, Edit} from 'lucide-react';
import { toast } from 'sonner';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import rehypeSanitize from 'rehype-sanitize';
import { MarkdownRichTextEditorDialog } from './MarkdownRichTextEditorDialog.stub';

import { AppBadge as Badge } from '@/components/ui/app-badge';
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
import { listarFormulariosQueUsamTemplateAction } from '@/shared/assinatura-digital/actions';
import { AlertTriangle } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { StatusTemplate } from '@/shared/assinatura-digital/types/domain';
import type { Template } from '@/shared/assinatura-digital/types/template.types';
import { validateMarkdownForForm } from './editor-helpers';

import { LoadingSpinner } from "@/components/ui/loading-state"
import { Text } from '@/components/ui/typography';
interface TemplateInfoPopoverProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  template?: Template;
  onUpdate: (updates: Partial<Template>) => Promise<void>;
  isCreating?: boolean;
  pdfFile?: File;
}

const STATUS_OPTIONS: Array<{ value: StatusTemplate; label: string; variant: 'default' | 'secondary' | 'destructive' }> = [
  { value: 'ativo', label: 'Ativo', variant: 'default' },
  { value: 'inativo', label: 'Inativo', variant: 'secondary' },
  { value: 'rascunho', label: 'Rascunho', variant: 'destructive' },
];

export default function TemplateInfoPopover({
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

  // Aviso: formulários que dependem deste template (quando o usuário tenta inativar).
  const [desativacaoCheck, setDesativacaoCheck] = useState<{
    open: boolean;
    isChecking: boolean;
    formularios: Array<{
      id: number;
      nome: string;
      slug: string;
      ativo: boolean;
      segmento_nome: string | null;
      tipo_formulario: string | null;
    }>;
  }>({ open: false, isChecking: false, formularios: [] });

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
    formData.nome.trim() !== ''
  );

  // Dispara o salvamento, inserindo a checagem de "template em uso" como gate
  // quando o admin está transicionando o status para 'inativo'.
  const handleRequestSave = async () => {
    if (!formData.nome.trim()) {
      toast.error('Nome do template é obrigatório');
      return;
    }

    const markdownValidation = validateMarkdownForForm(formData.conteudo_markdown);
    if (!markdownValidation.valid) {
      toast.error(markdownValidation.error);
      return;
    }

    // Pré-check só faz sentido quando: editando (não criação) + transicionando
    // PARA inativo + template tem UUID (é um template persistido).
    const estaInativando =
      !isCreating &&
      formData.status === 'inativo' &&
      template?.status !== 'inativo' &&
      template?.template_uuid;

    if (estaInativando && template?.template_uuid) {
      setDesativacaoCheck((prev) => ({ ...prev, isChecking: true }));
      try {
        const resp = await listarFormulariosQueUsamTemplateAction(
          template.template_uuid,
        );
        if (!resp.success) {
          toast.error(resp.error ?? 'Erro ao verificar uso em formulários.');
          setDesativacaoCheck((prev) => ({ ...prev, isChecking: false }));
          return;
        }
        if (resp.data.length > 0) {
          setDesativacaoCheck({
            open: true,
            isChecking: false,
            formularios: resp.data,
          });
          return;
        }
      } catch (err) {
        toast.error(
          err instanceof Error
            ? err.message
            : 'Erro ao verificar uso em formulários.',
        );
        setDesativacaoCheck((prev) => ({ ...prev, isChecking: false }));
        return;
      }
      setDesativacaoCheck((prev) => ({ ...prev, isChecking: false }));
    }

    await performSave();
  };

  const performSave = async () => {
    setIsSaving(true);
    try {
      if (isCreating) {
        if (!pdfFile) {
          toast.error('Arquivo PDF é obrigatório');
          return;
        }

        const formDataToSend = new FormData();
        formDataToSend.append('file', pdfFile);

        const uploadResponse = await fetch('/api/assinatura-digital/templates/upload', {
          method: 'POST',
          body: formDataToSend,
          credentials: 'include',
        });

        if (!uploadResponse.ok) {
          const error = await uploadResponse.json().catch(() => null);
          throw new Error(error?.error || 'Erro ao fazer upload do PDF');
        }

        const uploadResult = await uploadResponse.json();
        const { url, nome: arquivoNome, tamanho } = uploadResult.data;

        const response = await fetch('/api/assinatura-digital/templates', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            nome: formData.nome.trim(),
            descricao: formData.descricao.trim() || null,
            arquivo_original: url,
            pdf_url: url,
            arquivo_nome: arquivoNome,
            arquivo_tamanho: tamanho,
            conteudo_markdown: formData.conteudo_markdown.trim() || null,
          }),
        });

        if (!response.ok) {
          const error = await response.json().catch(() => null);
          throw new Error(error?.error || 'Erro ao criar template');
        }

        const result = await response.json();
        toast.success('Template criado com sucesso!');

        await onUpdate(result.data);
        onOpenChange(false);
      } else {
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

  const handleSaveMarkdownDirectly = async (markdown: string) => {
    if (isCreating) {
      setFormData(prev => ({ ...prev, conteudo_markdown: markdown }));
      toast.success('Conteúdo Markdown atualizado');
      return;
    }

    if (!template) {
      toast.error('Template não encontrado');
      return;
    }

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

    setFormData(prev => ({ ...prev, conteudo_markdown: markdown }));
    toast.success('Conteúdo Markdown salvo com sucesso!');
  };

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="right" className={cn("w-96 overflow-y-auto inset-default-plus")}>
          <SheetHeader className={cn("inset-none pb-1")}>
            <div className="flex items-center justify-between">
              <div className={cn("flex items-center inline-tight")}>
                <FileText className="h-4 w-4 text-muted-foreground" />
                <SheetTitle className={cn( "text-body font-semibold")}>
                  {isCreating ? 'Novo Template' : 'Informações do Template'}
                </SheetTitle>
              </div>
              {!isCreating && (
                <Badge
                  variant={STATUS_OPTIONS.find(s => s.value === formData.status)?.variant || 'default'}
                  className={cn("text-caption")}
                >
                  {STATUS_OPTIONS.find(s => s.value === formData.status)?.label}
                </Badge>
              )}
            </div>
            <SheetDescription className={cn("text-caption")}>
              Editar nome, descrição e status do template
            </SheetDescription>
          </SheetHeader>

          <Separator className={cn("my-3")} />

          <div className={cn("flex flex-col stack-default")}>
            {/* Nome */}
            <div className={cn("flex flex-col stack-snug")}>
              <Label htmlFor="template-nome" className={cn("text-caption text-muted-foreground")}>
                Nome do Template *
              </Label>
              <Input
                id="template-nome"
                value={formData.nome}
                onChange={(e) => setFormData(prev => ({ ...prev, nome: e.target.value }))}
                className={cn("h-8 text-caption")}
                placeholder="Ex: Contrato Apps - Uber 2024"
              />
            </div>

            {/* Descricao */}
            <div className={cn("flex flex-col stack-snug")}>
              <Label htmlFor="template-descricao" className={cn("text-caption text-muted-foreground")}>
                Descrição
              </Label>
              <Textarea
                id="template-descricao"
                value={formData.descricao}
                onChange={(e) => setFormData(prev => ({ ...prev, descricao: e.target.value }))}
                className={cn("text-caption resize-none")}
                rows={3}
                placeholder="Informações adicionais sobre o uso deste template (opcional)"
              />
            </div>

            <Separator />

            {/* Conteudo Markdown */}
            <div className={cn("flex flex-col stack-snug")}>
              <Label htmlFor="template-markdown" className={cn("text-caption text-muted-foreground")}>
                Conteúdo Markdown (Opcional)
              </Label>
              <div className={cn("flex inline-tight")}>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowMarkdownEditor(true)}
                  className={cn("flex flex-1 inline-tight text-caption")}
                >
                  <Edit className="h-3.5 w-3.5" />
                  {formData.conteudo_markdown.trim() === '' ? 'Adicionar Conteúdo' : 'Editar Conteúdo'}
                </Button>
                {formData.conteudo_markdown.trim() !== '' && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleOpenPreview}
                    className={cn("flex flex-1 inline-tight text-caption")}
                  >
                    <Eye className="h-3.5 w-3.5" />
                    Pré-visualizar
                  </Button>
                )}
              </div>
            </div>

            <Separator />

            {/* Status */}
            <div className={cn("flex flex-col stack-snug")}>
              <Label htmlFor="template-status" className={cn("text-caption text-muted-foreground")}>
                Status *
              </Label>
              <Select
                value={formData.status}
                onValueChange={(value: StatusTemplate) =>
                  setFormData(prev => ({ ...prev, status: value }))
                }
              >
                <SelectTrigger id="template-status" className={cn("h-8 text-caption")}>
                  <SelectValue placeholder="Selecione o status" />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value} className={cn("text-caption")}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Acoes */}
            <div className={cn("flex inline-tight pt-2 border-t")}>
              <Button
                variant="outline"
                size="sm"
                className={cn("flex-1 text-caption")}
                onClick={handleCancel}
                disabled={isSaving}
              >
                Cancelar
              </Button>
              <Button
                size="sm"
                className={cn("flex flex-1 inline-tight text-caption")}
                onClick={handleRequestSave}
                disabled={!hasChanges || isSaving || desativacaoCheck.isChecking}
              >
                {isSaving ? (
                  <>
                    <LoadingSpinner size="sm" />
                    {isCreating ? 'Criando...' : 'Salvando...'}
                  </>
                ) : desativacaoCheck.isChecking ? (
                  <>
                    <LoadingSpinner size="sm" />
                    Verificando uso...
                  </>
                ) : (
                  isCreating ? 'Criar Template' : 'Salvar Alterações'
                )}
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      <MarkdownRichTextEditorDialog
        open={showMarkdownEditor}
        onOpenChange={setShowMarkdownEditor}
        value={formData.conteudo_markdown}
        onChange={(markdown) => setFormData(prev => ({ ...prev, conteudo_markdown: markdown }))}
        formularios={[]}
        title="Editar Conteúdo Markdown do Template"
        onSaveToBackend={handleSaveMarkdownDirectly}
      />

      <Dialog
        open={desativacaoCheck.open}
        onOpenChange={(open) =>
          setDesativacaoCheck((prev) => ({ ...prev, open }))
        }
      >
        <DialogContent className=" max-w-lg">
          <DialogHeader>
            <DialogTitle className={cn("flex items-center inline-tight")}>
              <AlertTriangle className="size-5 text-warning" />
              Template em uso em {desativacaoCheck.formularios.length} formulário
              {desativacaoCheck.formularios.length > 1 ? 's' : ''}
            </DialogTitle>
            <DialogDescription>
              Desativar este template vai interromper a geração automática dos
              documentos nos segmentos abaixo. Contratos novos que dependem
              deste template deixarão de ser gerados até que você revise o
              formulário ou reative o template.
            </DialogDescription>
          </DialogHeader>

          <div className={cn("flex flex-col max-h-64 overflow-y-auto stack-tight py-2")}>
            {desativacaoCheck.formularios.map((f) => (
              <div
                key={f.id}
                className={cn("flex items-start justify-between inline-medium rounded-lg border border-border/40 bg-muted/30 px-3 py-2")}
              >
                <div className="min-w-0 flex-1">
                  <div className={cn("flex items-center inline-tight flex-wrap")}>
                    <Text variant="caption" weight="medium" className="text-foreground truncate">
                      {f.nome}
                    </Text>
                    <Badge
                      variant={f.ativo ? 'default' : 'secondary'}
                      className="text-[10px] shrink-0"
                    >
                      {f.ativo ? 'Ativo' : 'Inativo'}
                    </Badge>
                    {f.tipo_formulario && (
                      <Badge
                        variant="secondary"
                        className="text-[10px] shrink-0"
                      >
                        {f.tipo_formulario}
                      </Badge>
                    )}
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    Segmento: {f.segmento_nome ?? '—'}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                setDesativacaoCheck((prev) => ({ ...prev, open: false }))
              }
              disabled={isSaving}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={async () => {
                setDesativacaoCheck((prev) => ({ ...prev, open: false }));
                await performSave();
              }}
              disabled={isSaving}
            >
              {isSaving ? 'Salvando…' : 'Desativar mesmo assim'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-4xl max-h-[85vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>Preview do Markdown</DialogTitle>
            <DialogDescription className={cn("text-caption")}>
              Visualização do conteúdo formatado (variáveis não são substituídas neste preview)
            </DialogDescription>
          </DialogHeader>

          <Separator />

          <div className="prose prose-sm prose-slate dark:prose-invert max-w-none">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              rehypePlugins={[rehypeRaw, rehypeSanitize]}
            >
              {previewContent}
            </ReactMarkdown>
          </div>

          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setShowPreview(false)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
