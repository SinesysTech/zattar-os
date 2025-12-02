'use client';

/**
 * Componente principal do editor de documentos
 * Integra Plate.js com auto-save, colaboração, e chat
 */

import * as React from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Save,
  Share2,
  Users,
  MessageSquare,
  MoreVertical,
  FileText,
  Upload,
  Download,
  Loader2,
  History,
  Wifi,
  WifiOff,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { toast } from 'sonner';
import { PlateEditor } from '@/components/plate/plate-editor';
import { CollaboratorsAvatars } from '@/components/documentos/collaborators-avatars';
import { UploadDialog } from '@/components/documentos/upload-dialog';
import { ShareDocumentDialog } from '@/components/documentos/share-document-dialog';
import { VersionHistoryDialog } from '@/components/documentos/version-history-dialog';
import { DocumentChat } from '@/components/documentos/document-chat';
import { useRealtimeCollaboration } from '@/hooks/use-realtime-collaboration';
import { DocumentEditorProvider } from '@/hooks/use-editor-upload';
import { createClient } from '@/app/_lib/supabase/client';
import type { DocumentoComUsuario } from '@/backend/types/documentos/types';
import { exportToDocx } from '@/lib/documentos/export-docx';
import { exportToPdf, exportTextToPdf } from '@/lib/documentos/export-pdf';

interface DocumentEditorProps {
  documentoId: number;
}

export function DocumentEditor({ documentoId }: DocumentEditorProps) {
  const router = useRouter();

  const supabase = createClient();

  const [documento, setDocumento] = React.useState<DocumentoComUsuario | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [titulo, setTitulo] = React.useState('');
  const [conteudo, setConteudo] = React.useState<any>([]);
  const [chatOpen, setChatOpen] = React.useState(false);
  const [uploadOpen, setUploadOpen] = React.useState(false);
  const [shareOpen, setShareOpen] = React.useState(false);
  const [historyOpen, setHistoryOpen] = React.useState(false);
  const [currentUser, setCurrentUser] = React.useState<any>(null);
  const [exporting, setExporting] = React.useState<'pdf' | 'docx' | null>(null);
  const editorContentRef = React.useRef<HTMLDivElement>(null);

  // Colaboração em tempo real
  const {
    collaborators,
    remoteCursors,
    isConnected,
    updateCursor,
    updateSelection,
    broadcastUpdate,
  } = useRealtimeCollaboration({
    documentoId,
    userId: currentUser?.id || 0,
    userName: currentUser?.nomeCompleto || 'Usuário',
    userEmail: currentUser?.emailCorporativo || '',
  });

  // Auto-save timer
  const autoSaveTimerRef = React.useRef<NodeJS.Timeout | null>(null);
  const lastSavedRef = React.useRef<string>('');

  // Carregar documento
  React.useEffect(() => {
    async function fetchDocumento() {
      try {
        const response = await fetch(`/api/documentos/${documentoId}`);
        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(data.error || 'Erro ao carregar documento');
        }

        setDocumento(data.data);
        setTitulo(data.data.titulo);
        setConteudo(data.data.conteudo || []);
        lastSavedRef.current = JSON.stringify(data.data.conteudo);
      } catch (error) {
        console.error('Erro ao carregar documento:', error);
        toast.error(error instanceof Error ? error.message : 'Erro ao carregar documento');
      } finally {
        setLoading(false);
      }
    }

    fetchDocumento();
  }, [documentoId]);

  // Carregar usuário atual
  React.useEffect(() => {
    async function fetchUser() {
      try {
        const { data: { user: authUser } } = await supabase.auth.getUser();

        if (authUser) {
          const response = await fetch('/api/perfil');
          const data = await response.json();

          if (data.success && data.data) {
            setCurrentUser(data.data);
          }
        }
      } catch (error) {
        console.error('Erro ao carregar usuário:', error);
      }
    }

    fetchUser();
  }, [supabase]);

  // Auto-save quando conteúdo mudar
  React.useEffect(() => {
    if (!documento || loading) return;

    const currentContent = JSON.stringify(conteudo);
    if (currentContent === lastSavedRef.current) return;

    // Debounce de 2 segundos
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }

    autoSaveTimerRef.current = setTimeout(() => {
      handleAutoSave();
    }, 2000);

    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, [conteudo, titulo]);

  const handleAutoSave = async () => {
    if (!documento) return;

    setSaving(true);

    try {
      const response = await fetch(`/api/documentos/${documentoId}/auto-save`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          documento_id: documentoId,
          conteudo,
          titulo,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Erro ao salvar');
      }

      lastSavedRef.current = JSON.stringify(conteudo);
    } catch (error) {
      console.error('Erro no auto-save:', error);
      toast.error('Erro ao salvar', { description: 'Não foi possível salvar automaticamente' });
    } finally {
      setSaving(false);
    }
  };

  const handleManualSave = async () => {
    if (!documento) return;

    setSaving(true);

    try {
      const response = await fetch(`/api/documentos/${documentoId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          titulo,
          conteudo,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Erro ao salvar');
      }

      lastSavedRef.current = JSON.stringify(conteudo);

      toast.success('Documento salvo', { description: 'Todas as alterações foram salvas' });
    } catch (error) {
      console.error('Erro ao salvar:', error);
      toast.error(error instanceof Error ? error.message : 'Erro ao salvar documento');
    } finally {
      setSaving(false);
    }
  };

  const handleExportPdf = async () => {
    if (exporting) return;

    setExporting('pdf');
    try {
      // Tentar usar captura visual primeiro
      const editorElement = editorContentRef.current?.querySelector('[data-slate-editor]');
      if (editorElement) {
        await exportToPdf(editorElement as HTMLElement, titulo);
      } else {
        // Fallback para exportação baseada em texto
        await exportTextToPdf(conteudo, titulo);
      }
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
      await exportToDocx(conteudo, titulo);
      toast.success('DOCX exportado com sucesso');
    } catch (error) {
      console.error('Erro ao exportar DOCX:', error);
      toast.error(error instanceof Error ? error.message : 'Erro ao exportar DOCX');
    } finally {
      setExporting(null);
    }
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto" />
          <p className="mt-4 text-sm text-muted-foreground">Carregando documento...</p>
        </div>
      </div>
    );
  }

  if (!documento) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
          <h2 className="mt-4 text-2xl font-semibold">Documento não encontrado</h2>
          <p className="text-muted-foreground mt-2">
            O documento que você está procurando não existe ou foi removido.
          </p>
          <Button className="mt-4" onClick={() => router.push('/documentos')}>
            Voltar para documentos
          </Button>
        </div>
      </div>
    );
  }

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
              onClick={() => router.push('/documentos')}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>

            <Input
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              className="max-w-md border-0 bg-transparent font-medium shadow-none focus-visible:ring-0"
              placeholder="Título do documento"
            />

            {saving && (
              <Badge variant="secondary" className="text-xs">
                Salvando...
              </Badge>
            )}
          </div>

          {/* Right */}
          <div className="flex items-center gap-2">
            {/* Indicador de conexão em tempo real */}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div
                    className={`flex items-center gap-1 rounded-full px-2 py-1 text-xs ${
                      isConnected
                        ? 'bg-green-500/10 text-green-600'
                        : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {isConnected ? (
                      <Wifi className="h-3 w-3" />
                    ) : (
                      <WifiOff className="h-3 w-3" />
                    )}
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs">
                    {isConnected
                      ? 'Colaboração em tempo real ativa'
                      : 'Conectando...'}
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            {/* Avatares dos colaboradores */}
            <CollaboratorsAvatars collaborators={collaborators} />

            <Button
              variant="ghost"
              size="icon"
              onClick={() => setChatOpen(!chatOpen)}
            >
              <MessageSquare className="h-4 w-4" />
            </Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={() => setUploadOpen(true)}
            >
              <Upload className="h-4 w-4" />
            </Button>

            <Button variant="outline" size="sm" onClick={handleManualSave} disabled={saving}>
              <Save className="mr-2 h-4 w-4" />
              Salvar
            </Button>

            <Button size="sm" onClick={() => setShareOpen(true)}>
              <Share2 className="mr-2 h-4 w-4" />
              Compartilhar
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleExportPdf} disabled={exporting !== null}>
                  {exporting === 'pdf' ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Download className="mr-2 h-4 w-4" />
                  )}
                  Exportar como PDF
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleExportDocx} disabled={exporting !== null}>
                  {exporting === 'docx' ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Download className="mr-2 h-4 w-4" />
                  )}
                  Exportar como DOCX
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setHistoryOpen(true)}>
                  <History className="mr-2 h-4 w-4" />
                  Histórico de versões
                </DropdownMenuItem>
                <DropdownMenuItem>Configurações</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* Editor */}
      <div className="flex flex-1 overflow-hidden">
        <div className="flex-1 overflow-auto">
          <div ref={editorContentRef} className="mx-auto max-w-4xl p-8">
            <DocumentEditorProvider documentoId={documentoId}>
              <PlateEditor
                initialValue={conteudo}
                onChange={(value) => setConteudo(value)}
              />
            </DocumentEditorProvider>
          </div>
        </div>

        {/* Chat Sidebar (conditional) */}
        {chatOpen && currentUser && (
          <div className="w-80 border-l bg-muted/10">
            <DocumentChat
              documentoId={documentoId}
              currentUserId={currentUser.id}
              currentUserName={currentUser.nomeCompleto || currentUser.nomeExibicao || 'Usuário'}
            />
          </div>
        )}
      </div>

      {/* Upload Dialog */}
      <UploadDialog
        open={uploadOpen}
        onOpenChange={setUploadOpen}
        documentoId={documentoId}
        onSuccess={(url) => {
          toast.success('Arquivo enviado! URL copiada para área de transferência');
          navigator.clipboard.writeText(url);
        }}
      />

      {/* Share Dialog */}
      <ShareDocumentDialog
        open={shareOpen}
        onOpenChange={setShareOpen}
        documentoId={documentoId}
        documentoTitulo={titulo}
      />

      {/* Version History Dialog */}
      <VersionHistoryDialog
        open={historyOpen}
        onOpenChange={setHistoryOpen}
        documentoId={documentoId}
        onVersionRestored={() => {
          // Recarregar documento após restaurar versão
          window.location.reload();
        }}
      />
    </div>
  );
}
