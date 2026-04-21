'use client';

/**
 * FileManager — Container unificado do módulo de documentos
 * ============================================================================
 * Segue o padrão Glass Briefing (canônico em audiências, expedientes, partes):
 * header com Heading, KPI strip, filter bar + search, breadcrumbs glass,
 * glass list tipada e detail dialog.
 * ============================================================================
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Home,
  Plus,
  FileText,
  FolderPlus,
  UploadIcon,
  ChevronRight,
} from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Heading } from '@/components/ui/typography';
import { SearchInput } from '@/components/dashboard/search-input';
import { GlassPanel } from '@/components/shared/glass-panel';
import { InsightBanner } from '@/app/(authenticated)/dashboard/widgets/primitives';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

import { FileUploadDialogUnified } from './file-upload-dialog-unified';
import { CreateFolderDialog } from './create-folder-dialog';
import { CreateDocumentDialog } from './create-document-dialog';
import { DocumentosKpiStrip } from './documentos-kpi-strip';
import {
  DocumentosFilterBar,
  type DocumentosFilters,
  type DocumentosCriadorOption,
  type DocumentosTipoFiltro,
} from './documentos-filter-bar';
import { DocumentosGlassList } from './documentos-glass-list';
import { DocumentoDetailDialog } from './documento-detail-dialog';

import {
  actionListarItensUnificados,
  actionDeletarArquivo,
  actionBuscarCaminhoPasta,
} from '../actions/arquivos-actions';
import { actionDeletarDocumento } from '../actions/documentos-actions';
import type { ItemDocumento } from '../domain';

// =============================================================================
// HELPERS — classificação por tipo de filtro
// =============================================================================

function getItemTipoFiltro(item: ItemDocumento): DocumentosTipoFiltro {
  if (item.tipo === 'pasta') return 'pasta';
  if (item.tipo === 'documento') return 'documento';

  const mime = item.dados.tipo_mime;
  if (mime.startsWith('image/')) return 'imagem';
  if (mime.startsWith('video/')) return 'video';
  if (mime.startsWith('audio/')) return 'audio';
  if (mime === 'application/pdf') return 'pdf';
  return 'outro';
}

function matchesPeriodo(item: ItemDocumento, periodo: DocumentosFilters['periodo']): boolean {
  if (!periodo) return true;
  const created = new Date(item.dados.created_at);
  const now = new Date();
  const diffMs = now.getTime() - created.getTime();
  const diffDays = diffMs / (1000 * 60 * 60 * 24);

  if (periodo === 'hoje') {
    return (
      created.getFullYear() === now.getFullYear() &&
      created.getMonth() === now.getMonth() &&
      created.getDate() === now.getDate()
    );
  }
  if (periodo === '7d') return diffDays <= 7;
  if (periodo === '30d') return diffDays <= 30;
  return true;
}

function getItemKey(item: ItemDocumento): string {
  return `${item.tipo}-${item.dados.id}`;
}

function getItemName(item: ItemDocumento): string {
  if (item.tipo === 'pasta') return item.dados.nome;
  if (item.tipo === 'documento') return item.dados.titulo;
  return item.dados.nome;
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function FileManager() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // ── Data State ────────────────────────────────────────────────────────
  const [items, setItems] = useState<ItemDocumento[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ── UI State ──────────────────────────────────────────────────────────
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState<DocumentosFilters>({
    tipo: null,
    criadorId: null,
    periodo: null,
  });
  // ── Detail dialog state ───────────────────────────────────────────────
  const [selectedItem, setSelectedItem] = useState<ItemDocumento | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  // ── Create/Upload dialogs ─────────────────────────────────────────────
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [createFolderOpen, setCreateFolderOpen] = useState(false);
  const [createDocumentOpen, setCreateDocumentOpen] = useState(false);

  // ── Path handling ─────────────────────────────────────────────────────
  const pathParam = searchParams.get('pasta');
  const currentPastaId = pathParam ? parseInt(pathParam) : null;
  const [breadcrumbs, setBreadcrumbs] = useState<{ id: number | null; nome: string }[]>([]);

  // ── Data loading ──────────────────────────────────────────────────────

  const loadItems = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await actionListarItensUnificados({
        pasta_id: currentPastaId,
        busca: search || undefined,
        limit: 500,
        offset: 0,
      });

      if (result.success && result.data) {
        setItems(result.data);
      } else {
        const msg = result.error || 'Erro ao carregar itens';
        setError(msg);
        toast.error(msg);
      }
    } catch (err) {
      console.error('Erro ao carregar itens:', err);
      setError('Erro ao carregar itens');
      toast.error('Erro ao carregar itens');
    } finally {
      setLoading(false);
    }
  }, [currentPastaId, search]);

  useEffect(() => {
    loadItems();
  }, [loadItems]);

  useEffect(() => {
    if (!currentPastaId) {
      setBreadcrumbs([]);
      return;
    }
    const loadBreadcrumbs = async () => {
      try {
        const result = await actionBuscarCaminhoPasta(currentPastaId);
        if (result.success && result.data) {
          setBreadcrumbs(result.data.map((p) => ({ id: p.id, nome: p.nome })));
        }
      } catch (err) {
        console.error('Erro ao carregar breadcrumbs:', err);
      }
    };
    loadBreadcrumbs();
  }, [currentPastaId]);

  useEffect(() => {
    setSelectedItem(null);
    setDetailOpen(false);
  }, [currentPastaId]);

  // ── Derived: criadores únicos (para filter) ──────────────────────────

  const criadores = useMemo<DocumentosCriadorOption[]>(() => {
    const map = new Map<number, DocumentosCriadorOption>();
    items.forEach((item) => {
      const c = item.dados.criador;
      if (!c?.id) return;
      if (!map.has(c.id)) {
        const nome =
          (c as { nomeExibicao?: string | null; nomeCompleto?: string }).nomeExibicao ||
          c.nomeCompleto ||
          `Usuário ${c.id}`;
        const avatar =
          (c as { avatarUrl?: string | null; avatar_url?: string | null })?.avatarUrl ??
          (c as { avatarUrl?: string | null; avatar_url?: string | null })?.avatar_url ??
          null;
        map.set(c.id, { id: c.id, nome, avatarUrl: avatar });
      }
    });
    return Array.from(map.values()).sort((a, b) => a.nome.localeCompare(b.nome));
  }, [items]);

  // ── Derived: counts para filter bar ──────────────────────────────────

  const filterCounts = useMemo(() => {
    const byType: Record<DocumentosTipoFiltro, number> = {
      pasta: 0,
      documento: 0,
      imagem: 0,
      video: 0,
      audio: 0,
      pdf: 0,
      outro: 0,
    };
    items.forEach((item) => {
      byType[getItemTipoFiltro(item)] += 1;
    });
    return {
      total: items.length,
      pastas: byType.pasta,
      documentos: byType.documento,
      imagens: byType.imagem,
      videos: byType.video,
      audios: byType.audio,
      pdfs: byType.pdf,
      outros: byType.outro,
    };
  }, [items]);

  // ── Derived: items filtrados + ordenados ─────────────────────────────

  const visibleItems = useMemo(() => {
    const filtered = items.filter((item) => {
      if (filters.tipo && getItemTipoFiltro(item) !== filters.tipo) return false;
      if (filters.criadorId && item.dados.criador?.id !== filters.criadorId) return false;
      if (!matchesPeriodo(item, filters.periodo)) return false;
      return true;
    });

    // Ordenação default: pastas primeiro, depois nome A→Z (ordem natural pt-BR)
    return [...filtered].sort((a, b) => {
      if (a.tipo === 'pasta' && b.tipo !== 'pasta') return -1;
      if (a.tipo !== 'pasta' && b.tipo === 'pasta') return 1;
      return getItemName(a).localeCompare(getItemName(b), 'pt-BR');
    });
  }, [items, filters]);

  const hasActiveFilters =
    !!filters.tipo || !!filters.criadorId || !!filters.periodo || !!search;

  // ── Handlers ──────────────────────────────────────────────────────────

  const handleItemClick = useCallback(
    (item: ItemDocumento) => {
      if (item.tipo === 'pasta') {
        router.push(`/documentos?pasta=${item.dados.id}`);
      } else if (item.tipo === 'documento') {
        router.push(`/documentos/${item.dados.id}`);
      } else {
        setSelectedItem(item);
        setDetailOpen(true);
      }
    },
    [router],
  );

  const handleDelete = useCallback(
    async (item: ItemDocumento, e?: React.MouseEvent) => {
      e?.stopPropagation();
      try {
        if (item.tipo === 'documento') {
          const result = await actionDeletarDocumento(item.dados.id);
          if (!result.success) throw new Error(result.error);
        } else if (item.tipo === 'arquivo') {
          const result = await actionDeletarArquivo(item.dados.id);
          if (!result.success) throw new Error(result.error);
        }
        toast.success('Item movido para a lixeira');
        setDetailOpen(false);
        loadItems();
      } catch (err) {
        console.error('Erro ao deletar:', err);
        toast.error('Erro ao deletar item');
      }
    },
    [loadItems],
  );

  const handleShare = useCallback((item: ItemDocumento, e?: React.MouseEvent) => {
    e?.stopPropagation();
    toast.message('Compartilhar', { description: 'Em breve.' });
  }, []);

  const handleOpen = useCallback((item: ItemDocumento, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (item.tipo === 'arquivo') {
      window.open(item.dados.b2_url, '_blank');
    }
  }, []);

  // ── Subtitle ──────────────────────────────────────────────────────────

  const subtitle = loading
    ? 'Carregando...'
    : hasActiveFilters
      ? `${visibleItems.length} de ${items.length} ite${items.length === 1 ? 'm' : 'ns'}`
      : `${items.length} ite${items.length === 1 ? 'm' : 'ns'} neste nível`;

  // ── Render ────────────────────────────────────────────────────────────

  return (
    <div className="space-y-5">
      {/* ── Header ─────────────────────────────────────────── */}
      <div className="flex items-end justify-between gap-4">
        <div>
          <Heading level="page">Documentos</Heading>
          <p className="text-sm text-muted-foreground/50 mt-0.5">{subtitle}</p>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="sm" className="rounded-xl">
              <Plus className="size-3.5" />
              Novo
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="rounded-xl">
            <DropdownMenuItem onClick={() => setCreateFolderOpen(true)} className="gap-2 cursor-pointer">
              <FolderPlus className="size-4" />
              Nova pasta
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setCreateDocumentOpen(true)} className="gap-2 cursor-pointer">
              <FileText className="size-4" />
              Novo documento
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => setUploadDialogOpen(true)} className="gap-2 cursor-pointer">
              <UploadIcon className="size-4" />
              Fazer upload
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* ── KPI Strip ──────────────────────────────────────── */}
      <DocumentosKpiStrip items={items} />

      {/* ── Error banner ───────────────────────────────────── */}
      {error && <InsightBanner type="alert">{error}</InsightBanner>}

      {/* ── Filter + Search ────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <DocumentosFilterBar
          filters={filters}
          onChange={setFilters}
          criadores={criadores}
          counts={filterCounts}
        />
        <div className="flex items-center gap-2 flex-1 justify-end">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Buscar pastas, documentos, arquivos..."
          />
        </div>
      </div>

      {/* ── Breadcrumbs (dentro de pasta) ──────────────────── */}
      {currentPastaId && (
        <GlassPanel className="px-4 py-2.5">
          <nav className="flex items-center gap-1.5 text-xs" aria-label="Breadcrumb">
            <button
              type="button"
              onClick={() => router.push('/documentos')}
              className="inline-flex items-center gap-1 text-muted-foreground/70 hover:text-primary transition-colors cursor-pointer"
            >
              <Home className="size-3.5" />
              <span>Raiz</span>
            </button>
            {breadcrumbs.map((bc, i) => {
              const isLast = i === breadcrumbs.length - 1;
              return (
                <div key={bc.id ?? `bc-${i}`} className="flex items-center gap-1.5">
                  <ChevronRight className="size-3 text-muted-foreground/40" />
                  <button
                    type="button"
                    onClick={() =>
                      router.push(bc.id ? `/documentos?pasta=${bc.id}` : '/documentos')
                    }
                    disabled={isLast}
                    className={cn(
                      'transition-colors',
                      isLast
                        ? 'font-semibold text-foreground cursor-default'
                        : 'text-muted-foreground/70 hover:text-primary cursor-pointer',
                    )}
                  >
                    {bc.nome}
                  </button>
                </div>
              );
            })}
          </nav>
        </GlassPanel>
      )}

      {/* ── Lista ──────────────────────────────────────────── */}
      <DocumentosGlassList
        items={visibleItems}
        isLoading={loading}
        onItemClick={handleItemClick}
        onDelete={handleDelete}
        onShare={handleShare}
        onOpen={handleOpen}
        selectedItemKey={selectedItem ? getItemKey(selectedItem) : null}
      />

      {/* ── Detail Dialog ──────────────────────────────────── */}
      <DocumentoDetailDialog
        item={selectedItem}
        open={detailOpen}
        onOpenChange={(open) => {
          setDetailOpen(open);
          if (!open) setSelectedItem(null);
        }}
        onDelete={(item) => handleDelete(item)}
        onShare={(item) => handleShare(item)}
      />

      {/* ── Create/Upload Dialogs ──────────────────────────── */}
      <FileUploadDialogUnified
        open={uploadDialogOpen}
        onOpenChange={setUploadDialogOpen}
        pastaId={currentPastaId}
        onSuccess={loadItems}
      />
      <CreateFolderDialog
        open={createFolderOpen}
        onOpenChange={setCreateFolderOpen}
        pastaPaiId={currentPastaId}
        onSuccess={loadItems}
      />
      <CreateDocumentDialog
        open={createDocumentOpen}
        onOpenChange={setCreateDocumentOpen}
        pastaId={currentPastaId}
        onSuccess={loadItems}
      />
    </div>
  );
}
