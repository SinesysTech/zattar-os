'use client';

/**
 * PEÇAS JURÍDICAS FEATURE - Editor de Modelo de Peça
 *
 * Editor completo com Plate.js para criação/edição de modelos de peças jurídicas.
 * Suporta inserção de placeholders dinâmicos.
 */

import * as React from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Save,
  Loader2,
  FileText,
  Settings,
  Download,
} from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { AppBadge as Badge } from '@/components/ui/app-badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';

import {
  actionCriarPecaModelo,
  actionAtualizarPecaModelo,
  actionBuscarPecaModelo,
} from '../actions';
import {
  TIPO_PECA_LABELS,
  TIPOS_PECA_JURIDICA,
  type PecaModelo,
} from '../domain';
import { PlaceholderToolbarButton } from './placeholder-insert-menu';
import { exportToDocx, exportTextToPdf } from '@/features/documentos/utils';
import type { Descendant } from 'platejs';

// =============================================================================
// LAZY LOADING
// =============================================================================

function PlateEditorSkeleton() {
  return (
    <div className="mx-auto w-full max-w-4xl space-y-4 p-8">
      <Skeleton className="h-8 w-3/4" />
      <Skeleton className="h-6 w-full" />
      <Skeleton className="h-6 w-full" />
      <Skeleton className="h-6 w-5/6" />
      <Skeleton className="h-6 w-full" />
      <Skeleton className="h-6 w-4/5" />
    </div>
  );
}

const PlateEditor = dynamic(
  () =>
    import('@/components/editor/plate/plate-editor').then((m) => ({
      default: m.PlateEditor,
    })),
  {
    ssr: false,
    loading: () => <PlateEditorSkeleton />,
  }
);

// =============================================================================
// SCHEMA
// =============================================================================

const metadataSchema = z.object({
  titulo: z.string().min(1, 'Título é obrigatório').max(255),
  descricao: z.string().max(1000).optional(),
  tipoPeca: z.enum(TIPOS_PECA_JURIDICA),
  visibilidade: z.enum(['publico', 'privado']),
});

type MetadataValues = z.infer<typeof metadataSchema>;

// =============================================================================
// TYPES
// =============================================================================

interface PecaModeloEditorProps {
  modeloId?: number; // undefined = create mode
}

type Value = Descendant[];

// =============================================================================
// COMPONENT
// =============================================================================

export function PecaModeloEditor({ modeloId }: PecaModeloEditorProps) {
  const router = useRouter();
  const isCreateMode = !modeloId;

  // ---------- State ----------
  const [loading, setLoading] = React.useState(!isCreateMode);
  const [saving, setSaving] = React.useState(false);
  const [modelo, setModelo] = React.useState<PecaModelo | null>(null);
  const [conteudo, setConteudo] = React.useState<Value>([]);
  const [initialized, setInitialized] = React.useState(isCreateMode);
  const [settingsOpen, setSettingsOpen] = React.useState(isCreateMode);
  const [exporting, setExporting] = React.useState<'pdf' | 'docx' | null>(null);
  const editorContentRef = React.useRef<HTMLDivElement>(null);

  // ---------- Form ----------
  const form = useForm<MetadataValues>({
    resolver: zodResolver(metadataSchema),
    defaultValues: {
      titulo: '',
      descricao: '',
      tipoPeca: 'outro',
      visibilidade: 'privado',
    },
  });

  // ---------- Load existing modelo ----------
  React.useEffect(() => {
    if (modeloId && !initialized) {
      setLoading(true);
      actionBuscarPecaModelo(modeloId)
        .then((result) => {
          if (result.success && result.data) {
            setModelo(result.data);
            form.reset({
              titulo: result.data.titulo,
              descricao: result.data.descricao || '',
              tipoPeca: result.data.tipoPeca,
              visibilidade: result.data.visibilidade,
            });
            setConteudo((result.data.conteudo as Value) || []);
            setInitialized(true);
          } else {
            toast.error('Erro ao carregar modelo', { description: result.message });
            router.push('/app/pecas-juridicas');
          }
        })
        .finally(() => setLoading(false));
    }
  }, [modeloId, initialized, form, router]);

  // ---------- Save handler ----------
  const handleSave = async () => {
    const isValid = await form.trigger();
    if (!isValid) {
      setSettingsOpen(true);
      toast.error('Preencha os campos obrigatórios nas configurações');
      return;
    }

    setSaving(true);
    const values = form.getValues();

    try {
      if (isCreateMode) {
        const result = await actionCriarPecaModelo({
          titulo: values.titulo,
          descricao: values.descricao || null,
          tipoPeca: values.tipoPeca,
          visibilidade: values.visibilidade,
          conteudo,
          placeholdersDefinidos: [],
        });

        if (result.success) {
          toast.success('Modelo criado com sucesso');
          router.push('/app/pecas-juridicas');
        } else {
          toast.error('Erro ao criar modelo', { description: result.message });
        }
      } else {
        const result = await actionAtualizarPecaModelo(modeloId!, {
          titulo: values.titulo,
          descricao: values.descricao || null,
          tipoPeca: values.tipoPeca,
          visibilidade: values.visibilidade,
          conteudo,
        });

        if (result.success) {
          toast.success('Modelo atualizado com sucesso');
        } else {
          toast.error('Erro ao atualizar modelo', { description: result.message });
        }
      }
    } finally {
      setSaving(false);
    }
  };

  // ---------- Export handlers ----------
  const handleExportPdf = async () => {
    if (exporting) return;
    setExporting('pdf');
    try {
      await exportTextToPdf(conteudo as unknown[], form.getValues('titulo') || 'modelo');
      toast.success('PDF exportado com sucesso');
    } catch (error) {
      console.error('Erro ao exportar PDF:', error);
      toast.error(error instanceof Error ? error.message : 'Erro ao exportar PDF');
    } finally {
      setExporting(null);
    }
  };

  const handleExportDocx = async () => {
    if (exporting) return;
    setExporting('docx');
    try {
      await exportToDocx(conteudo as unknown[], form.getValues('titulo') || 'modelo');
      toast.success('DOCX exportado com sucesso');
    } catch (error) {
      console.error('Erro ao exportar DOCX:', error);
      toast.error(error instanceof Error ? error.message : 'Erro ao exportar DOCX');
    } finally {
      setExporting(null);
    }
  };

  // ---------- Placeholder insertion ----------
  const handleInsertPlaceholder = (placeholder: string) => {
    // Insert placeholder at cursor position in editor
    // For now, we'll append to content - can be enhanced with editor API
    setConteudo((prev) => {
      if (prev.length === 0) {
        return [{ type: 'p', children: [{ text: placeholder }] }] as Value;
      }
      // Add to end of last paragraph or create new one
      const lastNode = prev[prev.length - 1] as { type: string; children: { text: string }[] };
      if (lastNode.type === 'p') {
        return [
          ...prev.slice(0, -1),
          {
            ...lastNode,
            children: [...lastNode.children, { text: placeholder }],
          },
        ] as Value;
      }
      return [...prev, { type: 'p', children: [{ text: placeholder }] }] as Value;
    });
    toast.success(`Placeholder ${placeholder} inserido`);
  };

  // ---------- Loading state ----------
  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto" />
          <p className="mt-4 text-sm text-muted-foreground">Carregando modelo...</p>
        </div>
      </div>
    );
  }

  // ---------- Render ----------
  return (
    <div className="flex h-full flex-col">
      {/* Header/Toolbar */}
      <div className="border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
        <div className="flex h-14 items-center justify-between px-4 gap-4">
          {/* Left */}
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.push('/app/pecas-juridicas')}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>

            <div className="flex items-center gap-2 min-w-0">
              <FileText className="h-5 w-5 text-muted-foreground shrink-0" />
              <Input
                value={form.watch('titulo')}
                onChange={(e) => form.setValue('titulo', e.target.value)}
                className="max-w-md border-0 bg-transparent font-medium shadow-none focus-visible:ring-0"
                placeholder="Título do modelo"
              />
            </div>

            {saving && (
              <Badge variant="secondary" className="text-xs shrink-0">
                Salvando...
              </Badge>
            )}
          </div>

          {/* Right */}
          <div className="flex items-center gap-2">
            {/* Placeholder button */}
            <PlaceholderToolbarButton onInsert={handleInsertPlaceholder} />

            {/* Settings Sheet */}
            <Sheet open={settingsOpen} onOpenChange={setSettingsOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Settings className="h-4 w-4" />
                </Button>
              </SheetTrigger>
              <SheetContent>
                <SheetHeader>
                  <SheetTitle>Configurações do Modelo</SheetTitle>
                  <SheetDescription>
                    Configure os metadados do modelo de peça
                  </SheetDescription>
                </SheetHeader>

                <ScrollArea className="h-[calc(100vh-150px)] mt-6">
                  <Form {...form}>
                    <form className="space-y-6 pr-4">
                      {/* Título */}
                      <FormField
                        control={form.control}
                        name="titulo"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Título *</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                placeholder="Ex: Petição Inicial Trabalhista"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Descrição */}
                      <FormField
                        control={form.control}
                        name="descricao"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Descrição</FormLabel>
                            <FormControl>
                              <Textarea
                                {...field}
                                placeholder="Descreva o uso deste modelo..."
                                rows={3}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Tipo de Peça */}
                      <FormField
                        control={form.control}
                        name="tipoPeca"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Tipo de Peça *</FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              value={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Selecione" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {Object.entries(TIPO_PECA_LABELS).map(
                                  ([value, label]) => (
                                    <SelectItem key={value} value={value}>
                                      {label}
                                    </SelectItem>
                                  )
                                )}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Visibilidade */}
                      <FormField
                        control={form.control}
                        name="visibilidade"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Visibilidade</FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              value={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Selecione" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="privado">Privado</SelectItem>
                                <SelectItem value="publico">Público</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </form>
                  </Form>
                </ScrollArea>
              </SheetContent>
            </Sheet>

            {/* Export dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" disabled={exporting !== null}>
                  {exporting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Download className="h-4 w-4" />
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleExportPdf} disabled={exporting !== null}>
                  Exportar como PDF
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleExportDocx} disabled={exporting !== null}>
                  Exportar como DOCX
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Save button */}
            <Button onClick={handleSave} disabled={saving}>
              {saving ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              {isCreateMode ? 'Criar' : 'Salvar'}
            </Button>
          </div>
        </div>
      </div>

      {/* Editor */}
      <div className="flex flex-1 overflow-hidden">
        <div className="flex min-h-0 flex-1 overflow-auto">
          <div
            ref={editorContentRef}
            className="flex h-full w-full min-h-0 flex-col p-8"
          >
            <PlateEditor
              initialValue={conteudo}
              onChange={(value) => setConteudo(value as Value)}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
