"use client";

// Página de segmentos de assinatura digital

import * as React from 'react';
import { useDebounce } from '@/hooks/use-debounce';
import { DataTable, DataShell, DataTableToolbar, DataPagination } from '@/components/shared/data-shell';
import { DataTableColumnHeader } from '@/components/shared/data-shell/data-table-column-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Edit, Copy, Trash2, Download, Plus } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { ColumnDef, Table as TanstackTable } from '@tanstack/react-table';
import type { Segmento, EscopoSegmento } from '@/features/assinatura-digital';
import { listarSegmentosAction } from '@/features/assinatura-digital/actions';
import { getSegmentoDisplayName, formatAtivoBadge, getAtivoBadgeVariant, truncateText } from '@/features/assinatura-digital';
import { useMinhasPermissoes } from '@/features/usuarios';
import { SegmentoCreateDialog, SegmentoEditDialog, SegmentoDuplicateDialog, SegmentoDeleteDialog } from './components';

interface SegmentosFilters {
  ativo?: boolean;
  escopo?: EscopoSegmento;
}

function parseSegmentosFilters(ativo?: boolean, escopo?: EscopoSegmento): SegmentosFilters {
  const filters: SegmentosFilters = {};
  if (ativo !== undefined) filters.ativo = ativo;
  if (escopo) filters.escopo = escopo;
  return filters;
}

function useSegmentos(params: { pagina: number; limite: number; busca?: string; filtros: SegmentosFilters; }) {
  const [data, setData] = React.useState<{ segmentos: Segmento[]; total: number; isLoading: boolean; error: string | null; }>({ segmentos: [], total: 0, isLoading: false, error: null });

  const fetchSegmentos = React.useCallback(async () => {
    setData(prev => ({ ...prev, isLoading: true, error: null }));
    try {
      const response = await listarSegmentosAction({ ativo: params.filtros.ativo, escopo: params.filtros.escopo });

      if (!response.success) {
        // TypeScript type narrowing: quando success é false, error existe
        const errorResponse = response as { success: false; error: string };
        throw new Error(errorResponse.error || 'Erro ao carregar segmentos');
      }

      // Type narrowing: se success é true, então data existe
      if (!('data' in response)) {
        throw new Error('Resposta inválida do servidor');
      }

      // TODO: Implementar paginação e busca no server action, por enquanto simulando
      let filteredSegmentos = response.data || [];
      if (params.busca) {
        const lowerCaseBusca = params.busca.toLowerCase();
        filteredSegmentos = filteredSegmentos.filter((s: Segmento) =>
          s.nome.toLowerCase().includes(lowerCaseBusca) ||
          (s.slug && s.slug.toLowerCase().includes(lowerCaseBusca)) ||
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
    { accessorKey: 'formularios_count', header: ({ column }) => (<div className="flex items-center justify-center"><DataTableColumnHeader column={column} title="Formulários" /></div>), enableSorting: false, size: 120, cell: ({ row }) => { const segmento = row.original; const count = segmento.formularios_count ?? 0; return (<div className="min-h-10 flex items-center justify-center"><Badge variant="secondary" className="capitalize">{count}</Badge></div>); } },
    { accessorKey: 'ativo', header: ({ column }) => (<div className="flex items-center justify-center"><DataTableColumnHeader column={column} title="Ativo" /></div>), enableSorting: true, size: 100, cell: ({ row }) => { const ativo = row.getValue('ativo') as boolean; return (<div className="min-h-10 flex items-center justify-center"><Badge variant={getAtivoBadgeVariant(ativo)} className="capitalize">{formatAtivoBadge(ativo)}</Badge></div>); } },
    { id: 'acoes', header: () => (<div className="flex items-center justify-center"><div className="text-sm font-medium">Ações</div></div>), enableSorting: false, size: 140, cell: ({ row }) => { const segmento = row.original; return (<div className="min-h-10 flex items-center justify-center"><SegmentoActions segmento={segmento} onEdit={onEdit} onDuplicate={onDuplicate} onDelete={onDelete} canEdit={canEdit} canCreate={canCreate} canDelete={canDelete} /></div>); } },
  ];
}

function SegmentoActions({ segmento, onEdit, onDuplicate, onDelete, canEdit, canCreate, canDelete }: { segmento: Segmento; onEdit: (segmento: Segmento) => void; onDuplicate: (segmento: Segmento) => void; onDelete: (segmento: Segmento) => void; canEdit: boolean; canCreate: boolean; canDelete: boolean; }) {
  if (!canEdit && !canCreate && !canDelete) {
    return null;
  }

  return (
    <div className="flex items-center justify-center gap-1 min-w-[100px]">
      {canEdit && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 shrink-0"
              style={{ color: 'hsl(var(--muted-foreground))' }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = 'hsl(var(--foreground))';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = 'hsl(var(--muted-foreground))';
              }}
              onClick={(e) => {
                e.stopPropagation();
                onEdit(segmento);
              }}
            >
              <Edit className="h-4 w-4" style={{ display: 'block' }} />
              <span className="sr-only">Editar segmento</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>Editar</TooltipContent>
        </Tooltip>
      )}
      {canCreate && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 shrink-0"
              style={{ color: 'hsl(var(--muted-foreground))' }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = 'hsl(var(--foreground))';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = 'hsl(var(--muted-foreground))';
              }}
              onClick={(e) => {
                e.stopPropagation();
                onDuplicate(segmento);
              }}
            >
              <Copy className="h-4 w-4" style={{ display: 'block' }} />
              <span className="sr-only">Duplicar segmento</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>Duplicar</TooltipContent>
        </Tooltip>
      )}
      {canDelete && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 shrink-0"
              style={{ color: 'hsl(var(--muted-foreground))' }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = 'hsl(var(--destructive))';
                e.currentTarget.style.backgroundColor = 'hsl(var(--destructive) / 0.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = 'hsl(var(--muted-foreground))';
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
              onClick={(e) => {
                e.stopPropagation();
                onDelete(segmento);
              }}
            >
              <Trash2 className="h-4 w-4" style={{ display: 'block' }} />
              <span className="sr-only">Deletar segmento</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>Deletar</TooltipContent>
        </Tooltip>
      )}
    </div>
  );
}

export function SegmentosClient() {
  const [busca, setBusca] = React.useState('');
  const [pagina, setPagina] = React.useState(0);
  const [limite, setLimite] = React.useState(50);
  const [filtroAtivo, setFiltroAtivo] = React.useState<'all' | 'true' | 'false'>('all');
  const [filtroEscopo, setFiltroEscopo] = React.useState<EscopoSegmento | 'all'>('all');
  const [table, setTable] = React.useState<TanstackTable<Segmento> | null>(null);
  const [density, setDensity] = React.useState<'compact' | 'standard' | 'relaxed'>('standard');
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

  const filtros = React.useMemo(() => parseSegmentosFilters(
    filtroAtivo === 'all' ? undefined : filtroAtivo === 'true',
    filtroEscopo === 'all' ? undefined : filtroEscopo
  ), [filtroAtivo, filtroEscopo]);

  const params = React.useMemo(() => ({ 
    pagina: pagina + 1, 
    limite, 
    busca: buscaDebounced || undefined, 
    filtros 
  }), [pagina, limite, buscaDebounced, filtros]);
  
  const { segmentos, total, isLoading, error, refetch } = useSegmentos(params);

  const handleCreateSuccess = React.useCallback(() => { 
    refetch(); 
    setCreateOpen(false); 
  }, [refetch]);
  
  const handleEdit = React.useCallback((segmento: Segmento) => { 
    setSelectedSegmento(segmento); 
    setEditOpen(true); 
  }, []);
  
  const handleDuplicate = React.useCallback((segmento: Segmento) => { 
    setSelectedSegmento(segmento); 
    setDuplicateOpen(true); 
  }, []);
  
  const handleDelete = React.useCallback((segmento: Segmento) => { 
    setSelectedSegmentos([segmento]); 
    setDeleteOpen(true); 
  }, []);
  
  const handleBulkDelete = React.useCallback(() => { 
    const selected = Object.keys(rowSelection)
      .map(id => segmentos.find(s => s.id === Number(id)))
      .filter(Boolean) as Segmento[]; 
    setSelectedSegmentos(selected); 
    setDeleteOpen(true); 
  }, [rowSelection, segmentos]);
  
  const handleExportCSV = React.useCallback(() => { 
    const selected = Object.keys(rowSelection).length > 0 
      ? Object.keys(rowSelection).map(id => segmentos.find(s => s.id === Number(id))).filter(Boolean) as Segmento[] 
      : segmentos; 
    const csv = [
      ["Nome","Slug","Descrição","Escopo","Formulários","Ativo"].join(','), 
      ...selected.map(s => [
        `"${s.nome}"`, 
        s.slug || '', 
        `"${s.descricao || ''}"`, 
        s.escopo, 
        (s.formularios_count ?? 0), 
        s.ativo ? 'Ativo' : 'Inativo'
      ].join(','))
    ].join('\n'); 
    const blob = new Blob([csv], { type: 'text/csv' }); 
    const url = URL.createObjectURL(blob); 
    const a = document.createElement('a'); 
    a.href = url; 
    a.download = 'segmentos.csv'; 
    a.click(); 
    URL.revokeObjectURL(url); 
  }, [rowSelection, segmentos]);
  
  const handleEditSuccess = React.useCallback(() => { 
    refetch(); 
    setEditOpen(false); 
    setSelectedSegmento(null); 
  }, [refetch]);
  
  const handleDuplicateSuccess = React.useCallback(() => { 
    refetch(); 
    setDuplicateOpen(false); 
    setSelectedSegmento(null); 
  }, [refetch]);
  
  const handleDeleteSuccess = React.useCallback(() => { 
    refetch(); 
    setDeleteOpen(false); 
    setSelectedSegmentos([]); 
    setRowSelection({}); 
  }, [refetch]);

  const colunas = React.useMemo(
    () => criarColunas(handleEdit, handleDuplicate, handleDelete, canEdit, canCreate, canDelete), 
    [handleEdit, handleDuplicate, handleDelete, canEdit, canCreate, canDelete]
  );

  const bulkActions = React.useMemo(() => {
    const selectedCount = Object.keys(rowSelection).length; 
    if (selectedCount === 0) return null;
    return (
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">
          {selectedCount} selecionado{selectedCount > 1 ? 's' : ''}
        </span>
        <Button variant="outline" size="sm" onClick={handleExportCSV}>
          <Download className="h-4 w-4 mr-2" />
          Exportar CSV
        </Button>
        {canDelete && (
          <Button variant="destructive" size="sm" onClick={handleBulkDelete}>
            <Trash2 className="h-4 w-4 mr-2" />
            Deletar
          </Button>
        )}
      </div>
    );
  }, [rowSelection, handleExportCSV, handleBulkDelete, canDelete]);

  return (
    <div className="space-y-4">
      {error && (
        <div className="rounded-md bg-destructive/15 p-4 text-sm text-destructive">
          <p className="font-semibold">Erro ao carregar segmentos:</p>
          <p>{error}</p>
          <Button variant="outline" size="sm" onClick={refetch} className="mt-2">
            Tentar novamente
          </Button>
        </div>
      )}

      <DataShell
        header={
          table ? (
            <div className="pt-6 pb-4">
              <DataTableToolbar
                table={table}
                density={density}
                onDensityChange={setDensity}
                searchValue={busca}
                onSearchValueChange={(value) => {
                  setBusca(value);
                  setPagina(0);
                }}
                filtersSlot={
                  <div className="flex items-center gap-2">
                    <Select
                      value={filtroAtivo}
                      onValueChange={(val) => {
                        setFiltroAtivo(val as 'all' | 'true' | 'false');
                        setPagina(0);
                      }}
                    >
                      <SelectTrigger className="h-9 w-[150px]">
                        <SelectValue placeholder="Disponibilidade" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todas</SelectItem>
                        <SelectItem value="true">Ativo</SelectItem>
                        <SelectItem value="false">Inativo</SelectItem>
                      </SelectContent>
                    </Select>

                    <Select
                      value={filtroEscopo}
                      onValueChange={(val) => {
                        setFiltroEscopo(val as EscopoSegmento | 'all');
                        setPagina(0);
                      }}
                    >
                      <SelectTrigger className="h-9 w-[180px]">
                        <SelectValue placeholder="Escopo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos</SelectItem>
                        <SelectItem value="global">Global</SelectItem>
                        <SelectItem value="contratos">Contratos</SelectItem>
                        <SelectItem value="assinatura">Assinatura Digital</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                }
                actionSlot={
                  <div className="flex items-center gap-2">
                    {bulkActions}
                    {canCreate && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button onClick={() => setCreateOpen(true)} size="sm">
                            <Plus className="mr-2 h-4 w-4" />
                            Novo Segmento
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Novo Segmento</TooltipContent>
                      </Tooltip>
                    )}
                  </div>
                }
              />
            </div>
          ) : (
            <div className="p-6" />
          )
        }
        footer={
          Math.ceil(total / limite) > 0 ? (
            <DataPagination
              pageIndex={pagina}
              pageSize={limite}
              total={total}
              totalPages={Math.ceil(total / limite)}
              onPageChange={setPagina}
              onPageSizeChange={setLimite}
              isLoading={isLoading}
            />
          ) : null
        }
      >
        <div className="relative border-t">
          <DataTable
            data={segmentos}
            columns={colunas}
            pagination={{
              pageIndex: pagina,
              pageSize: limite,
              total,
              totalPages: Math.ceil(total / limite),
              onPageChange: setPagina,
              onPageSizeChange: setLimite,
            }}
            rowSelection={{
              state: rowSelection,
              onRowSelectionChange: setRowSelection,
              getRowId: (row) => row.id.toString(),
            }}
            isLoading={isLoading}
            error={error}
            density={density}
            onTableReady={(t) => setTable(t as TanstackTable<Segmento>)}
            hideTableBorder={true}
            emptyMessage="Nenhum segmento encontrado."
            onRowClick={(row) => handleEdit(row)}
          />
        </div>
      </DataShell>

      <SegmentoCreateDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onSuccess={handleCreateSuccess}
      />

      {selectedSegmento && (
        <SegmentoEditDialog
          open={editOpen}
          onOpenChange={setEditOpen}
          segmento={selectedSegmento}
          onSuccess={handleEditSuccess}
        />
      )}

      {selectedSegmento && (
        <SegmentoDuplicateDialog
          open={duplicateOpen}
          onOpenChange={setDuplicateOpen}
          segmento={selectedSegmento}
          onSuccess={handleDuplicateSuccess}
        />
      )}

      <SegmentoDeleteDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        segmentos={selectedSegmentos}
        onSuccess={handleDeleteSuccess}
      />
    </div>
  );
}
