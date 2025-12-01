'use client';

/**
 * Componente de listagem de documentos
 * Exibe lista de documentos com filtros, busca, e ações
 */

import * as React from 'react';
import { useRouter } from 'next/navigation';
import {
  FileText,
  FolderOpen,
  Plus,
  Search,
  Filter,
  LayoutGrid,
  LayoutList,
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
import { FolderTree } from '@/components/documentos/folder-tree';
import { DocumentCard } from '@/components/documentos/document-card';
import { DocumentTable } from '@/components/documentos/document-table';
import { CreateDocumentDialog } from '@/components/documentos/create-document-dialog';
import { CreateFolderDialog } from '@/components/documentos/create-folder-dialog';
import type { DocumentoComUsuario } from '@/backend/types/documentos/types';

export function DocumentList() {
  const router = useRouter();
  const [documentos, setDocumentos] = React.useState<DocumentoComUsuario[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [viewMode, setViewMode] = React.useState<'grid' | 'list'>('list');
  const [busca, setBusca] = React.useState('');
  const [pastaAtual, setPastaAtual] = React.useState<number | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = React.useState(false);
  const [createFolderOpen, setCreateFolderOpen] = React.useState(false);

  // Buscar documentos
  React.useEffect(() => {
    async function fetchDocumentos() {
      setLoading(true);
      try {
        const params = new URLSearchParams();

        if (pastaAtual !== null) {
          params.set('pasta_id', pastaAtual.toString());
        } else {
          params.set('pasta_id', 'null');
        }

        if (busca) {
          params.set('busca', busca);
        }

        const response = await fetch(`/api/documentos?${params}`);
        const data = await response.json();

        if (data.success) {
          setDocumentos(data.data);
        }
      } catch (error) {
        console.error('Erro ao buscar documentos:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchDocumentos();
  }, [pastaAtual, busca]);

  const handleDocumentoClick = (id: number) => {
    router.push(`/documentos/${id}`);
  };

  const handleDocumentoCriado = () => {
    // Recarregar lista
    setBusca('');
    setLoading(true);
    setTimeout(() => setLoading(false), 100);
  };

  return (
    <div className="flex flex-1 overflow-hidden">
      {/* Sidebar - Árvore de pastas */}
      <div className="w-64 border-r bg-muted/10">
        <div className="flex h-full flex-col">
          <div className="border-b p-4">
            <h2 className="text-sm font-semibold">Pastas</h2>
          </div>
          <div className="flex-1 overflow-auto p-2">
            <FolderTree
              onFolderSelect={setPastaAtual}
              selectedFolderId={pastaAtual}
            />
          </div>
          <div className="border-t p-2">
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={() => setCreateFolderOpen(true)}
            >
              <Plus className="mr-2 h-4 w-4" />
              Nova Pasta
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
              </div>

              {/* Filtros */}
              <Select defaultValue="todos">
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Filtrar por..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="recentes">Recentes</SelectItem>
                  <SelectItem value="meus">Meus documentos</SelectItem>
                  <SelectItem value="compartilhados">Compartilhados</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              {/* View mode toggle */}
              <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as 'grid' | 'list')}>
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
                <h3 className="mt-4 text-lg font-semibold">Nenhum documento encontrado</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  {busca
                    ? 'Tente buscar com outros termos'
                    : 'Crie seu primeiro documento para começar'}
                </p>
                {!busca && (
                  <Button className="mt-4" onClick={() => setCreateDialogOpen(true)}>
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
          // Recarregar árvore de pastas
          setCreateFolderOpen(false);
        }}
      />
    </div>
  );
}
