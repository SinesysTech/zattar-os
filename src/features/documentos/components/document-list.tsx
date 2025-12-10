'use client';

/**
 * Componente de listagem de documentos
 * Exibe lista de documentos com filtros, busca, paginação e ações
 */

import * as React from 'react';
import { useRouter } from 'next/navigation';
import {
  FileText,
  Plus,
  Search,
  LayoutGrid,
  LayoutList,
  ChevronLeft,
  ChevronRight,
  X,
  Trash2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { FolderTree } from '@/features/documentos/components/folder-tree';
import { DocumentCard } from '@/features/documentos/components/document-card';
import { DocumentTable } from '@/features/documentos/components/document-table';
import { CreateDocumentDialog } from '@/features/documentos/components/create-document-dialog';
import { CreateFolderDialog } from '@/features/documentos/components/create-folder-dialog';
import { TemplateLibraryDialog } from '@/features/documentos/components/template-library-dialog';
import { CommandMenu } from '@/features/documentos/components/command-menu';
import type { DocumentoComUsuario } from '@/backend/types/documentos/types';

type FiltroTipo = 'todos' | 'meus' | 'compartilhados' | 'recentes';

interface PaginationInfo {
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}

const ITEMS_PER_PAGE = 20;

export function DocumentList() {
  const router = useRouter();
  const [documentos, setDocumentos] = React.useState<DocumentoComUsuario[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [viewMode, setViewMode] = React.useState<'grid' | 'list'>('list');
  const [busca, setBusca] = React.useState('');
  const [buscaDebounced, setBuscaDebounced] = React.useState('');
  const [pastaAtual, setPastaAtual] = React.useState<number | null>(null);
  const [filtroTipo, setFiltroTipo] = React.useState<FiltroTipo>('todos');
  const [tagsAtivas, setTagsAtivas] = React.useState<string[]>([]);
  const [pagination, setPagination] = React.useState<PaginationInfo>({
    total: 0,
    limit: ITEMS_PER_PAGE,
    offset: 0,
    hasMore: false,
  });
  const [createDialogOpen, setCreateDialogOpen] = React.useState(false);
  const [createFolderOpen, setCreateFolderOpen] = React.useState(false);
  const [templateDialogOpen, setTemplateDialogOpen] = React.useState(false);
  const [refreshKey, setRefreshKey] = React.useState(0);

  // Debounce para busca
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setBuscaDebounced(busca);
    }, 300);
    return () => clearTimeout(timer);
  }, [busca]);

  // Reset offset quando filtros mudam
  React.useEffect(() => {
    setPagination((prev) => ({ ...prev, offset: 0 }));
  }, [pastaAtual, buscaDebounced, tagsAtivas, filtroTipo]);

  // Buscar documentos
  React.useEffect(() => {
    async function fetchDocumentos() {
      setLoading(true);
      try {
        // Para filtro "compartilhados", usar endpoint específico
        if (filtroTipo === 'compartilhados') {
          const response = await fetch('/api/documentos/compartilhados');
          const data = await response.json();
          if (data.success) {
            setDocumentos(data.data);
            setPagination({
              total: data.data.length,
              limit: ITEMS_PER_PAGE,
              offset: 0,
              hasMore: false,
            });
          }
          return;
        }

        const params = new URLSearchParams();

        // Pasta
        if (pastaAtual !== null) {
          params.set('pasta_id', pastaAtual.toString());
        } else if (filtroTipo !== 'recentes') {
          params.set('pasta_id', 'null');
        }

        // Busca
        if (buscaDebounced) {
          params.set('busca', buscaDebounced);
        }

        // Tags
        if (tagsAtivas.length > 0) {
          params.set('tags', tagsAtivas.join(','));
        }

        // Paginação
        params.set('limit', ITEMS_PER_PAGE.toString());
        params.set('offset', pagination.offset.toString());

        const response = await fetch(`/api/documentos?${params}`);
        const data = await response.json();

        if (data.success) {
          setDocumentos(data.data);
          setPagination(data.pagination);
        }
      } catch (error) {
        console.error('Erro ao buscar documentos:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchDocumentos();
  }, [pastaAtual, buscaDebounced, tagsAtivas, pagination.offset, filtroTipo, refreshKey]);

  const handleDocumentoClick = (id: number) => {
    router.push(`/documentos/${id}`);
  };

  const handleDocumentoCriado = () => {
    setRefreshKey((k) => k + 1);
  };

  const handleFiltroChange = (value: FiltroTipo) => {
    setFiltroTipo(value);
    // Limpar pasta quando mudar filtro
    if (value === 'compartilhados' || value === 'recentes') {
      setPastaAtual(null);
    }
  };

  const handleRemoveTag = (tag: string) => {
    setTagsAtivas((prev) => prev.filter((t) => t !== tag));
  };

  const handlePreviousPage = () => {
    setPagination((prev) => ({
      ...prev,
      offset: Math.max(0, prev.offset - ITEMS_PER_PAGE),
    }));
  };

  const handleNextPage = () => {
    setPagination((prev) => ({
      ...prev,
      offset: prev.offset + ITEMS_PER_PAGE,
    }));
  };

  const currentPage = Math.floor(pagination.offset / ITEMS_PER_PAGE) + 1;
  const totalPages = Math.ceil(pagination.total / ITEMS_PER_PAGE);

  return (
    <div className="flex flex-1 overflow-hidden">
      {/* Sidebar - Árvore de pastas */}
      <div className="w-80 border-r bg-muted/10">
        <div className="flex h-full flex-col">
          <div className="border-b p-4">
            <h2 className="text-sm font-semibold">Documentos</h2>
          </div>
          <div className="flex-1 overflow-auto p-2">
            <FolderTree
              onFolderSelect={setPastaAtual}
              selectedFolderId={pastaAtual}
            />
          </div>
          <div className="space-y-2 border-t p-2">
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={() => setCreateFolderOpen(true)}
            >
              <Plus className="mr-2 h-4 w-4" />
              Nova Pasta
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="w-full text-muted-foreground"
              onClick={() => router.push('/documentos/lixeira')}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Lixeira
            </Button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Toolbar */}
        <div className="border-b p-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex flex-1 items-center gap-2">
              {/* Busca */}
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Buscar documentos..."
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  className="pl-9"
                />
                {busca && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-1 top-1/2 h-6 w-6 -translate-y-1/2"
                    onClick={() => setBusca('')}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                )}
              </div>

              {/* Filtros */}
              <Select value={filtroTipo} onValueChange={handleFiltroChange}>
                <SelectTrigger className="w-44">
                  <SelectValue placeholder="Filtrar por..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="recentes">Recentes</SelectItem>
                  <SelectItem value="meus">Meus documentos</SelectItem>
                  <SelectItem value="compartilhados">Compartilhados comigo</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              {/* View mode toggle */}
              <Tabs
                value={viewMode}
                onValueChange={(v) => setViewMode(v as 'grid' | 'list')}
              >
                <TabsList>
                  <TabsTrigger value="list" className="px-3">
                    <LayoutList className="h-4 w-4" />
                  </TabsTrigger>
                  <TabsTrigger value="grid" className="px-3">
                    <LayoutGrid className="h-4 w-4" />
                  </TabsTrigger>
                </TabsList>
              </Tabs>

              {/* Ações */}
              <Button onClick={() => setCreateDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Novo Documento
              </Button>
            </div>
          </div>

          {/* Tags ativas */}
          {tagsAtivas.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              <span className="text-sm text-muted-foreground">Tags:</span>
              {tagsAtivas.map((tag) => (
                <Badge key={tag} variant="secondary" className="gap-1">
                  {tag}
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(tag)}
                    className="ml-1 rounded-full hover:bg-muted"
                    title={`Remover tag ${tag}`}
                    aria-label={`Remover tag ${tag}`}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-2 text-xs"
                onClick={() => setTagsAtivas([])}
              >
                Limpar
              </Button>
            </div>
          )}
        </div>

        {/* Lista/Grid de documentos */}
        <div className="flex-1 overflow-auto p-4">
          {loading ? (
            <div className="space-y-4">
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
            </div>
          ) : documentos.length === 0 ? (
            <div className="flex h-full items-center justify-center">
              <div className="text-center">
                <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-4 text-lg font-semibold">
                  Nenhum documento encontrado
                </h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  {busca
                    ? 'Tente buscar com outros termos'
                    : filtroTipo === 'compartilhados'
                      ? 'Nenhum documento foi compartilhado com você ainda'
                      : 'Crie seu primeiro documento para começar'}
                </p>
                {!busca && filtroTipo !== 'compartilhados' && (
                  <Button
                    className="mt-4"
                    onClick={() => setCreateDialogOpen(true)}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Criar Documento
                  </Button>
                )}
              </div>
            </div>
          ) : viewMode === 'grid' ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {documentos.map((doc) => (
                <DocumentCard
                  key={doc.id}
                  documento={doc}
                  onClick={() => handleDocumentoClick(doc.id)}
                />
              ))}
            </div>
          ) : (
            <DocumentTable
              documentos={documentos}
              onDocumentoClick={handleDocumentoClick}
            />
          )}
        </div>

        {/* Paginação */}
        {!loading && documentos.length > 0 && pagination.total > ITEMS_PER_PAGE && (
          <div className="border-t px-4 py-3">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Mostrando {pagination.offset + 1} -{' '}
                {Math.min(pagination.offset + documentos.length, pagination.total)} de{' '}
                {pagination.total} documentos
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePreviousPage}
                  disabled={pagination.offset === 0}
                >
                  <ChevronLeft className="mr-1 h-4 w-4" />
                  Anterior
                </Button>
                <span className="text-sm text-muted-foreground">
                  Página {currentPage} de {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleNextPage}
                  disabled={!pagination.hasMore}
                >
                  Próxima
                  <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Dialogs */}
      <CreateDocumentDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        pastaId={pastaAtual}
        onSuccess={handleDocumentoCriado}
      />

      <CreateFolderDialog
        open={createFolderOpen}
        onOpenChange={setCreateFolderOpen}
        pastaPaiId={pastaAtual}
        onSuccess={() => {
          setCreateFolderOpen(false);
          setRefreshKey((k) => k + 1);
        }}
      />

      <TemplateLibraryDialog
        open={templateDialogOpen}
        onOpenChange={setTemplateDialogOpen}
        pastaId={pastaAtual}
      />

      {/* Command Menu (Cmd/Ctrl+Shift+D) */}
      <CommandMenu
        onNewDocument={() => setCreateDialogOpen(true)}
        onNewFolder={() => setCreateFolderOpen(true)}
        onOpenTemplates={() => setTemplateDialogOpen(true)}
      />
    </div>
  );
}
