"use client";

// Página de segmentos de assinatura digital

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useDebounce } from '@/app/_lib/hooks/use-debounce';
import { DataTable } from '@/components/ui/data-table';
import { DataTableColumnHeader } from '@/components/ui/data-table-column-header';
import { TableToolbar } from '@/components/ui/table-toolbar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Edit, MoreHorizontal, Copy, Trash2, Download } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import type { ColumnDef } from '@tanstack/react-table';
import type { AssinaturaDigitalSegmento } from '@/backend/types/assinatura-digital/types';
import { getSegmentoDisplayName, formatAtivoBadge, getAtivoBadgeVariant, truncateText } from '@/lib/assinatura-digital/utils';
import { useMinhasPermissoes } from '@/app/_lib/hooks/use-minhas-permissoes';
import { SegmentoCreateDialog, SegmentoEditDialog, SegmentoDuplicateDialog, SegmentoDeleteDialog } from './components';

interface SegmentosFilters { ativo?: boolean }

const SEGMENTOS_FILTER_CONFIGS = [
  { id: 'ativo', label: 'Disponibilidade', type: 'select' as const, options: [
    { value: 'true', label: 'Sim' },
    { value: 'false', label: 'Não' },
  ] },
];

function buildSegmentosFilterOptions() {
  const options: { value: string; label: string; group: string }[] = [];
  for (const config of SEGMENTOS_FILTER_CONFIGS) {
    if (config.type === 'select') {
      for (const opt of config.options) {
        options.push({ value: `${config.id}_${opt.value}`, label: opt.label, group: config.label });
      }
    }
  }
  return options;
}

function buildSegmentosFilterGroups() {
  return SEGMENTOS_FILTER_CONFIGS.map(config => ({ label: config.label, options: config.options.map(opt => ({ value: `${config.id}_${opt.value}`, label: opt.label })) }));
}

function parseSegmentosFilters(selectedIds: string[]): SegmentosFilters {
  const filters: SegmentosFilters = {};
  for (const id of selectedIds) {
    const [key, value] = id.split('_', 2);
    if (key === 'ativo') filters.ativo = value === 'true';
  }
  return filters;
}

function useSegmentos(params: { pagina: number; limite: number; busca?: string; ativo?: boolean; }) {
  const [data, setData] = React.useState<{ segmentos: AssinaturaDigitalSegmento[]; total: number; isLoading: boolean; error: string | null; }>({ segmentos: [], total: 0, isLoading: false, error: null });

  const fetchSegmentos = React.useCallback(async () => {
    setData(prev => ({ ...prev, isLoading: true, error: null }));
    try {
      const searchParams = new URLSearchParams({ pagina: params.pagina.toString(), limite: params.limite.toString() });
      if (params.busca) searchParams.set('search', params.busca);
      if (params.ativo !== undefined) searchParams.set('ativo', params.ativo.toString());

      const res = await fetch(`/api/assinatura-digital/segmentos?${searchParams}`);
      const json = await res.json();
      if (!res.ok || json.error) throw new Error(json.error || 'Erro ao carregar segmentos');
      setData({ segmentos: json.data || [], total: json.total || 0, isLoading: false, error: null });
    } catch (err) {
      setData({ segmentos: [], total: 0, isLoading: false, error: err instanceof Error ? err.message : 'Erro desconhecido' });
    }
  }, [params]);

  React.useEffect(() => { fetchSegmentos() }, [fetchSegmentos]);
  return { ...data, refetch: fetchSegmentos };
}

function criarColunas(onEdit: (segmento: AssinaturaDigitalSegmento) => void, onDuplicate: (segmento: AssinaturaDigitalSegmento) => void, onDelete: (segmento: AssinaturaDigitalSegmento) => void, canEdit: boolean, canCreate: boolean, canDelete: boolean): ColumnDef<AssinaturaDigitalSegmento>[] {
  return [
    { accessorKey: 'nome', header: ({ column }) => (<div className="flex items-center justify-start"><DataTableColumnHeader column={column} title="Nome" /></div>), enableSorting: true, size: 250, meta: { align: 'left' }, cell: ({ row }) => { const segmento = row.original; const displayName = getSegmentoDisplayName(segmento); return (<div className="min-h-10 flex items-center justify-start text-sm gap-2"><Tooltip><TooltipTrigger asChild><span className="truncate max-w-[200px]">{displayName}</span></TooltipTrigger><TooltipContent>{displayName}</TooltipContent></Tooltip></div>); } },
    { accessorKey: 'slug', header: ({ column }) => (<div className="flex items-center justify-start"><DataTableColumnHeader column={column} title="Slug" /></div>), enableSorting: false, size: 200, meta: { align: 'left' }, cell: ({ row }) => { const slug = row.getValue('slug') as string; return (<div className="min-h-10 flex items-center justify-start text-sm font-mono">{slug}</div>); } },
    { accessorKey: 'descricao', header: ({ column }) => (<div className="flex items-center justify-start"><DataTableColumnHeader column={column} title="Descrição" /></div>), enableSorting: false, size: 200, meta: { align: 'left' }, cell: ({ row }) => { const descricao = row.getValue('descricao') as string | null; const truncated = truncateText(descricao || '', 50); return (<div className="min-h-10 flex items-center justify-start text-sm">{truncated ? (<Tooltip><TooltipTrigger asChild><span className="truncate max-w-[180px]">{truncated}</span></TooltipTrigger><TooltipContent>{descricao}</TooltipContent></Tooltip>) : (<span className="text-muted-foreground">-</span>)}</div>); } },
    { accessorKey: 'formularios_count', header: ({ column }) => (<div className="flex items-center justify-center"><DataTableColumnHeader column={column} title="Formulários" /></div>), enableSorting: false, size: 120, cell: ({ row }) => { const count = row.getValue('formularios_count') as number; return (<div className="min-h-10 flex items-center justify-center"><Badge variant="secondary" className="capitalize">{count}</Badge></div>); } },
    { accessorKey: 'ativo', header: ({ column }) => (<div className="flex items-center justify-center"><DataTableColumnHeader column={column} title="Ativo" /></div>), enableSorting: true, size: 100, cell: ({ row }) => { const ativo = row.getValue('ativo') as boolean; return (<div className="min-h-10 flex items-center justify-center"><Badge variant={getAtivoBadgeVariant(ativo)} className="capitalize">{formatAtivoBadge(ativo)}</Badge></div>); } },
    { id: 'acoes', header: () => (<div className="flex items-center justify-center"><div className="text-sm font-medium">Ações</div></div>), enableSorting: false, size: 120, cell: ({ row }) => { const segmento = row.original; return (<div className="min-h-10 flex items-center justify-center gap-2"><SegmentoActions segmento={segmento} onEdit={onEdit} onDuplicate={onDuplicate} onDelete={onDelete} canEdit={canEdit} canCreate={canCreate} canDelete={canDelete} /></div>); } },
  ];
}

function SegmentoActions({ segmento, onEdit, onDuplicate, onDelete, canEdit, canCreate, canDelete }: { segmento: AssinaturaDigitalSegmento; onEdit: (segmento: AssinaturaDigitalSegmento) => void; onDuplicate: (segmento: AssinaturaDigitalSegmento) => void; onDelete: (segmento: AssinaturaDigitalSegmento) => void; canEdit: boolean; canCreate: boolean; canDelete: boolean; }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <MoreHorizontal className="h-4 w-4" />
          <span className="sr-only">Ações do segmento</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {canEdit && (<DropdownMenuItem onClick={() => onEdit(segmento)}><Edit className="mr-2 h-4 w-4" />Editar</DropdownMenuItem>)}
        {canCreate && (<DropdownMenuItem onClick={() => onDuplicate(segmento)}><Copy className="mr-2 h-4 w-4" />Duplicar</DropdownMenuItem>)}
        {canDelete && (<DropdownMenuItem onClick={() => onDelete(segmento)} className="text-destructive"><Trash2 className="mr-2 h-4 w-4" />Deletar</DropdownMenuItem>)}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function SegmentosClient() {
  const _router = useRouter();
  const [busca, setBusca] = React.useState('');
  const [pagina, setPagina] = React.useState(0);
  const [limite, setLimite] = React.useState(50);
  const [filtros, setFiltros] = React.useState<SegmentosFilters>({});
  const [selectedFilterIds, setSelectedFilterIds] = React.useState<string[]>([]);
  const [createOpen, setCreateOpen] = React.useState(false);
  const [editOpen, setEditOpen] = React.useState(false);
  const [duplicateOpen, setDuplicateOpen] = React.useState(false);
  const [deleteOpen, setDeleteOpen] = React.useState(false);
  const [selectedSegmento, setSelectedSegmento] = React.useState<AssinaturaDigitalSegmento | null>(null);
  const [selectedSegmentos, setSelectedSegmentos] = React.useState<AssinaturaDigitalSegmento[]>([]);
  const [rowSelection, setRowSelection] = React.useState<Record<string, boolean>>({});

  const { temPermissao } = useMinhasPermissoes('assinatura_digital');
  const canCreate = temPermissao('assinatura_digital', 'criar');
  const canEdit = temPermissao('assinatura_digital', 'editar');
  const canDelete = temPermissao('assinatura_digital', 'deletar');

  const filterOptions = React.useMemo(() => buildSegmentosFilterOptions(), []);
  const filterGroups = React.useMemo(() => buildSegmentosFilterGroups(), []);

  const buscaDebounced = useDebounce(busca, 500);

  const params = React.useMemo(() => ({ pagina: pagina + 1, limite, busca: buscaDebounced || undefined, ativo: filtros.ativo }), [pagina, limite, buscaDebounced, filtros.ativo]);
  const { segmentos, total, isLoading, error, refetch } = useSegmentos(params);

  const isSearching = busca !== buscaDebounced && busca.length > 0;

  const handleCreateSuccess = React.useCallback(() => { refetch(); setCreateOpen(false); }, [refetch]);
  const handleFilterIdsChange = React.useCallback((selectedIds: string[]) => { setSelectedFilterIds(selectedIds); const newFilters = parseSegmentosFilters(selectedIds); setFiltros(newFilters); setPagina(0); }, []);
  const handleEdit = React.useCallback((segmento: AssinaturaDigitalSegmento) => { setSelectedSegmento(segmento); setEditOpen(true); }, []);
  const handleDuplicate = React.useCallback((segmento: AssinaturaDigitalSegmento) => { setSelectedSegmento(segmento); setDuplicateOpen(true); }, []);
  const handleDelete = React.useCallback((segmento: AssinaturaDigitalSegmento) => { setSelectedSegmentos([segmento]); setDeleteOpen(true); }, []);
  const handleBulkDelete = React.useCallback(() => { const selected = Object.keys(rowSelection).map(id => segmentos.find(s => s.id === Number(id))).filter(Boolean) as AssinaturaDigitalSegmento[]; setSelectedSegmentos(selected); setDeleteOpen(true); }, [rowSelection, segmentos]);
  const handleExportCSV = React.useCallback(() => { const selected = Object.keys(rowSelection).length > 0 ? Object.keys(rowSelection).map(id => segmentos.find(s => s.id === Number(id))).filter(Boolean) as AssinaturaDigitalSegmento[] : segmentos; const csv = [["Nome","Slug","Descrição","Formulários","Ativo"].join(','), ...selected.map(s => [`"${s.nome}"`, s.slug, `"${s.descricao || ''}"`, s.formularios_count || 0, s.ativo ? 'Ativo' : 'Inativo'].join(','))].join('\n'); const blob = new Blob([csv], { type: 'text/csv' }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = 'segmentos.csv'; a.click(); URL.revokeObjectURL(url); }, [rowSelection, segmentos]);
  const handleEditSuccess = React.useCallback(() => { refetch(); setEditOpen(false); setSelectedSegmento(null); }, [refetch]);
  const handleDuplicateSuccess = React.useCallback(() => { refetch(); setDuplicateOpen(false); setSelectedSegmento(null); }, [refetch]);
  const handleDeleteSuccess = React.useCallback(() => { refetch(); setDeleteOpen(false); setSelectedSegmentos([]); setRowSelection({}); }, [refetch]);

  const colunas = React.useMemo(() => criarColunas(handleEdit, handleDuplicate, handleDelete, canEdit, canCreate, canDelete), [handleEdit, handleDuplicate, handleDelete, canEdit, canCreate, canDelete]);

  const bulkActions = React.useMemo(() => {
    const selectedCount = Object.keys(rowSelection).length; if (selectedCount === 0) return null;
    return (
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">{selectedCount} selecionado{selectedCount > 1 ? 's' : ''}</span>
        <Button variant="outline" size="sm" onClick={handleExportCSV}><Download className="h-4 w-4 mr-2" />Exportar CSV</Button>
        {canDelete && (<Button variant="destructive" size="sm" onClick={handleBulkDelete}><Trash2 className="h-4 w-4 mr-2" />Deletar</Button>)}
      </div>
    );
  }, [rowSelection, handleExportCSV, handleBulkDelete, canDelete]);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3 justify-between">
        <TableToolbar searchValue={busca} onSearchChange={(value) => { setBusca(value); setPagina(0); }} isSearching={isSearching} searchPlaceholder="Buscar por nome, slug ou descrição..." filterOptions={buildSegmentosFilterOptions()} filterGroups={buildSegmentosFilterGroups()} selectedFilters={selectedFilterIds} onFiltersChange={handleFilterIdsChange} filterButtonsMode="buttons" extraButtons={bulkActions} onNewClick={canCreate ? () => setCreateOpen(true) : undefined} newButtonTooltip="Novo Segmento" />
      </div>

      {error && (<div className="rounded-md bg-destructive/15 p-4 text-sm text-destructive"><p className="font-semibold">Erro ao carregar segmentos:</p><p>{error}</p><Button variant="outline" size="sm" onClick={refetch} className="mt-2">Tentar novamente</Button></div>)}

      <DataTable data={segmentos} columns={colunas} pagination={{ pageIndex: pagina, pageSize: limite, total, totalPages: Math.ceil(total / limite), onPageChange: setPagina, onPageSizeChange: setLimite }} sorting={undefined} rowSelection={{ state: rowSelection, onRowSelectionChange: setRowSelection, getRowId: (row) => row.id.toString() }} isLoading={isLoading} error={error} emptyMessage="Nenhum segmento encontrado." onRowClick={(row) => handleEdit(row)} />

      <SegmentoCreateDialog open={createOpen} onOpenChange={setCreateOpen} onSuccess={handleCreateSuccess} />

      {selectedSegmento && (<SegmentoEditDialog open={editOpen} onOpenChange={setEditOpen} segmento={selectedSegmento} onSuccess={handleEditSuccess} />)}

      {selectedSegmento && (<SegmentoDuplicateDialog open={duplicateOpen} onOpenChange={setDuplicateOpen} segmento={selectedSegmento} onSuccess={handleDuplicateSuccess} />)}

      <SegmentoDeleteDialog open={deleteOpen} onOpenChange={setDeleteOpen} segmentos={selectedSegmentos} onSuccess={handleDeleteSuccess} />
    </div>
  );
}
