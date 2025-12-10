"use client";

// Página de segmentos de assinatura digital

import * as React from 'react';
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
import type { Segmento, EscopoSegmento } from '@/features/assinatura-digital';
import { listarSegmentosAction } from '@/app/actions/assinatura-digital';
import { getSegmentoDisplayName, formatAtivoBadge, getAtivoBadgeVariant, truncateText } from '@/features/assinatura-digital';
import { useMinhasPermissoes } from '@/app/_lib/hooks/use-minhas-permissoes';
import { SegmentoCreateDialog, SegmentoEditDialog, SegmentoDuplicateDialog, SegmentoDeleteDialog } from './components';

interface SegmentosFilters {
  ativo?: boolean;
  escopo?: EscopoSegmento;
}

const SEGMENTOS_FILTER_CONFIGS = [
  { id: 'ativo', label: 'Disponibilidade', type: 'select' as const, options: [
    { value: 'true', label: 'Sim' },
    { value: 'false', label: 'Não' },
  ] },
  { id: 'escopo', label: 'Escopo', type: 'select' as const, options: [
    { value: 'global', label: 'Global' },
    { value: 'contratos', label: 'Contratos' },
    { value: 'assinatura', label: 'Assinatura Digital' },
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
    if (key === 'escopo') filters.escopo = value as EscopoSegmento;
  }
  return filters;
}

function useSegmentos(params: { pagina: number; limite: number; busca?: string; filtros: SegmentosFilters; }) {
  const [data, setData] = React.useState<{ segmentos: Segmento[]; total: number; isLoading: boolean; error: string | null; }>({ segmentos: [], total: 0, isLoading: false, error: null });

  const fetchSegmentos = React.useCallback(async () => {
    setData(prev => ({ ...prev, isLoading: true, error: null }));
    try {
      const response = await listarSegmentosAction({ ativo: params.filtros.ativo, escopo: params.filtros.escopo });

      if (!response.success) {
        throw new Error(response.error || 'Erro ao carregar segmentos');
      }

      // TODO: Implementar paginação e busca no server action, por enquanto simulando
      let filteredSegmentos = response.data || [];
      if (params.busca) {
        const lowerCaseBusca = params.busca.toLowerCase();
        filteredSegmentos = filteredSegmentos.filter(s =>
          s.nome.toLowerCase().includes(lowerCaseBusca) ||
          (s.slug && s.slug.toLowerCase().includes(lowerCaseBusca)) || // Add null check for slug
          (s.descricao && s.descricao.toLowerCase().includes(lowerCaseBusca))
        );
      }

      const totalFiltered = filteredSegmentos.length;
      const startIndex = (params.pagina - 1) * params.limite;
      const endIndex = startIndex + params.limite;
      const paginatedSegmentos = filteredSegmentos.slice(startIndex, endIndex);

      setData({ segmentos: paginatedSegmentos, total: totalFiltered, isLoading: false, error: null });
    } catch (err) {
      setData({ segmentos: [], total: 0, isLoading: false, error: err instanceof Error ? err.message : 'Erro desconhecido' });
    }
  }, [params.busca, params.filtros.ativo, params.filtros.escopo, params.limite, params.pagina]);

  React.useEffect(() => { fetchSegmentos() }, [fetchSegmentos]);
  return { ...data, refetch: fetchSegmentos };
}

function criarColunas(onEdit: (segmento: Segmento) => void, onDuplicate: (segmento: Segmento) => void, onDelete: (segmento: Segmento) => void, canEdit: boolean, canCreate: boolean, canDelete: boolean): ColumnDef<Segmento>[] {
  return [
    { accessorKey: 'nome', header: ({ column }) => (<div className="flex items-center justify-start"><DataTableColumnHeader column={column} title="Nome" /></div>), enableSorting: true, size: 250, meta: { align: 'left' }, cell: ({ row }) => { const segmento = row.original; const displayName = getSegmentoDisplayName(segmento); return (<div className="min-h-10 flex items-center justify-start text-sm gap-2"><Tooltip><TooltipTrigger asChild><span className="truncate max-w-[200px]">{displayName}</span></TooltipTrigger><TooltipContent>{displayName}</TooltipContent></Tooltip></div>); } },
    { accessorKey: 'slug', header: ({ column }) => (<div className="flex items-center justify-start"><DataTableColumnHeader column={column} title="Slug" /></div>), enableSorting: false, size: 200, meta: { align: 'left' }, cell: ({ row }) => { const slug = row.getValue('slug') as string; return (<div className="min-h-10 flex items-center justify-start text-sm font-mono">{slug}</div>); } },
    { accessorKey: 'descricao', header: ({ column }) => (<div className="flex items-center justify-start"><DataTableColumnHeader column={column} title="Descrição" /></div>), enableSorting: false, size: 200, meta: { align: 'left' }, cell: ({ row }) => { const descricao = row.getValue('descricao') as string | null; const truncated = truncateText(descricao || '', 50); return (<div className="min-h-10 flex items-center justify-start text-sm">{truncated ? (<Tooltip><TooltipTrigger asChild><span className="truncate max-w-[180px]">{truncated}</span></TooltipTrigger><TooltipContent>{descricao}</TooltipContent></Tooltip>) : (<span className="text-muted-foreground">-</span>)}</div>); } },
    { accessorKey: 'escopo', header: ({ column }) => (<div className="flex items-center justify-center"><DataTableColumnHeader column={column} title="Escopo" /></div>), enableSorting: true, size: 120, cell: ({ row }) => { const escopo = row.getValue('escopo') as EscopoSegmento; let variant: 'secondary' | 'outline' | 'default' | 'destructive' | 'success' | 'warning' | null | undefined; switch (escopo) { case 'global': variant = 'default'; break; case 'contratos': variant = 'secondary'; break; case 'assinatura': variant = 'outline'; break; default: variant = 'secondary'; } return (<div className="min-h-10 flex items-center justify-center"><Badge variant={variant} className="capitalize">{escopo}</Badge></div>); } },
    { accessorKey: 'formularios_count', header: ({ column }) => (<div className="flex items-center justify-center"><DataTableColumnHeader column={column} title="Formulários" /></div>), enableSorting: false, size: 120, cell: ({ row }) => { const count = (row.original as any).formularios_count as number; return (<div className="min-h-10 flex items-center justify-center"><Badge variant="secondary" className="capitalize">{count}</Badge></div>); } },
    { accessorKey: 'ativo', header: ({ column }) => (<div className="flex items-center justify-center"><DataTableColumnHeader column={column} title="Ativo" /></div>), enableSorting: true, size: 100, cell: ({ row }) => { const ativo = row.getValue('ativo') as boolean; return (<div className="min-h-10 flex items-center justify-center"><Badge variant={getAtivoBadgeVariant(ativo)} className="capitalize">{formatAtivoBadge(ativo)}</Badge></div>); } },
    { id: 'acoes', header: () => (<div className="flex items-center justify-center"><div className="text-sm font-medium">Ações</div></div>), enableSorting: false, size: 120, cell: ({ row }) => { const segmento = row.original; return (<div className="min-h-10 flex items-center justify-center gap-2"><SegmentoActions segmento={segmento} onEdit={onEdit} onDuplicate={onDuplicate} onDelete={onDelete} canEdit={canEdit} canCreate={canCreate} canDelete={canDelete} /></div>); } },
  ];
}

function SegmentoActions({ segmento, onEdit, onDuplicate, onDelete, canEdit, canCreate, canDelete }: { segmento: Segmento; onEdit: (segmento: Segmento) => void; onDuplicate: (segmento: Segmento) => void; onDelete: (segmento: Segmento) => void; canEdit: boolean; canCreate: boolean; canDelete: boolean; }) {
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
  const [busca, setBusca] = React.useState('');
  const [pagina, setPagina] = React.useState(0);
  const [limite, setLimite] = React.useState(50);
  const [filtros, setFiltros] = React.useState<SegmentosFilters>({});
  const [selectedFilterIds, setSelectedFilterIds] = React.useState<string[]>([]);
  const [createOpen, setCreateOpen] = React.useState(false);
  const [editOpen, setEditOpen] = React.useState(false);
  const [duplicateOpen, setDuplicateOpen] = React.useState(false);
  const [deleteOpen, setDeleteOpen] = React.useState(false);
  const [selectedSegmento, setSelectedSegmento] = React.useState<Segmento | null>(null);
  const [selectedSegmentos, setSelectedSegmentos] = React.useState<Segmento[]>([]);
  const [rowSelection, setRowSelection] = React.useState<Record<string, boolean>>({});

  const { temPermissao } = useMinhasPermissoes('assinatura_digital');
  const canCreate = temPermissao('assinatura_digital', 'criar');
  const canEdit = temPermissao('assinatura_digital', 'editar');
  const canDelete = temPermissao('assinatura_digital', 'deletar');

  const buscaDebounced = useDebounce(busca, 500);

  const params = React.useMemo(() => ({ pagina: pagina + 1, limite, busca: buscaDebounced || undefined, filtros }), [pagina, limite, buscaDebounced, filtros]);
  const { segmentos, total, isLoading, error, refetch } = useSegmentos(params);

  const isSearching = busca !== buscaDebounced && busca.length > 0;

  const handleCreateSuccess = React.useCallback(() => { refetch(); setCreateOpen(false); }, [refetch]);
  const handleFilterIdsChange = React.useCallback((selectedIds: string[]) => { setSelectedFilterIds(selectedIds); const newFilters = parseSegmentosFilters(selectedIds); setFiltros(newFilters); setPagina(0); }, []);
  const handleEdit = React.useCallback((segmento: Segmento) => { setSelectedSegmento(segmento); setEditOpen(true); }, []);
  const handleDuplicate = React.useCallback((segmento: Segmento) => { setSelectedSegmento(segmento); setDuplicateOpen(true); }, []);
  const handleDelete = React.useCallback((segmento: Segmento) => { setSelectedSegmentos([segmento]); setDeleteOpen(true); }, []);
  const handleBulkDelete = React.useCallback(() => { const selected = Object.keys(rowSelection).map(id => segmentos.find(s => s.id === Number(id))).filter(Boolean) as Segmento[]; setSelectedSegmentos(selected); setDeleteOpen(true); }, [rowSelection, segmentos]);
  const handleExportCSV = React.useCallback(() => { const selected = Object.keys(rowSelection).length > 0 ? Object.keys(rowSelection).map(id => segmentos.find(s => s.id === Number(id))).filter(Boolean) as Segmento[] : segmentos; const csv = [["Nome","Slug","Descrição","Escopo","Formulários","Ativo"].join(','), ...selected.map(s => [`"${s.nome}"`, s.slug || '', `"${s.descricao || ''}"`, s.escopo, ((s as any).formularios_count || 0), s.ativo ? 'Ativo' : 'Inativo'].join(','))].join('\n'); const blob = new Blob([csv], { type: 'text/csv' }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = 'segmentos.csv'; a.click(); URL.revokeObjectURL(url); }, [rowSelection, segmentos]);
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
