"use client";

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useDebounce } from '@/hooks/use-debounce';
import { useMinhasPermissoes } from '@/features/usuarios';
import { DataTable, DataShell, DataTableToolbar, DataPagination } from '@/components/shared/data-shell';
import { DataTableColumnHeader } from '@/components/shared/data-shell/data-table-column-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ButtonGroup } from '@/components/ui/button-group';
import { Copy, Trash2, Download, Pencil, Plus, Tags } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { ColumnDef, Table as TanstackTable } from '@tanstack/react-table';
import {
  getFormularioDisplayName,
  formatBooleanBadge,
  getBooleanBadgeVariant,
  formatAtivoStatus,
  getTemplatePreviewText,
  type AssinaturaDigitalFormulario,
  type AssinaturaDigitalSegmento,
  type AssinaturaDigitalTemplate,
} from '@/features/assinatura-digital';
import { toast } from 'sonner';
import { FormularioCreateDialog } from './components/formulario-create-dialog';
import { FormularioDuplicateDialog } from './components/formulario-duplicate-dialog';
import { FormularioDeleteDialog } from './components/formulario-delete-dialog';
import { SegmentoEditDialog, SegmentoDeleteDialog, SegmentoDuplicateDialog, SegmentosManagerDialog } from './components';

interface FormulariosFilters {
  ativo?: boolean;
  foto_necessaria?: boolean;
  geolocation_necessaria?: boolean;
}


function useFormularios(params: { pagina: number; limite: number; busca?: string; ativo?: boolean; foto_necessaria?: boolean; geolocation_necessaria?: boolean; }) {
  const [data, setData] = React.useState<{ formularios: AssinaturaDigitalFormulario[]; total: number; isLoading: boolean; error: string | null; }>({ formularios: [], total: 0, isLoading: false, error: null });

  const fetchFormularios = React.useCallback(async () => {
    setData(prev => ({ ...prev, isLoading: true, error: null }));
    try {
      const searchParams = new URLSearchParams({ pagina: params.pagina.toString(), limite: params.limite.toString() });
      if (params.busca) searchParams.set('search', params.busca);
      if (params.ativo !== undefined) searchParams.set('ativo', params.ativo.toString());
      if (params.foto_necessaria !== undefined) searchParams.set('foto_necessaria', params.foto_necessaria.toString());
      if (params.geolocation_necessaria !== undefined) searchParams.set('geolocation_necessaria', params.geolocation_necessaria.toString());

      const res = await fetch(`/api/assinatura-digital/formularios?${searchParams}`);
      const json = await res.json();
      if (!res.ok || json.error) { throw new Error(json.error || 'Erro ao carregar formulários'); }
      setData({ formularios: json.data || [], total: json.total || 0, isLoading: false, error: null });
    } catch (err) {
      setData({ formularios: [], total: 0, isLoading: false, error: err instanceof Error ? err.message : 'Erro desconhecido' });
    }
  }, [params]);

  React.useEffect(() => { fetchFormularios(); }, [fetchFormularios]);
  return { ...data, refetch: fetchFormularios };
}

function useSegmentos() {
  const [data, setData] = React.useState<{ segmentos: AssinaturaDigitalSegmento[]; isLoading: boolean; error: string | null; }>({ segmentos: [], isLoading: false, error: null });

  const fetchSegmentos = React.useCallback(async () => {
    setData(prev => ({ ...prev, isLoading: true, error: null }));
    try {
      const res = await fetch('/api/assinatura-digital/segmentos?ativo=true');
      const json = await res.json();
      if (!res.ok || json.error) { throw new Error(json.error || 'Erro ao carregar segmentos'); }
      setData({ segmentos: json.data || [], isLoading: false, error: null });
    } catch (err) {
      setData({ segmentos: [], isLoading: false, error: err instanceof Error ? err.message : 'Erro desconhecido' });
    }
  }, []);

  React.useEffect(() => { fetchSegmentos(); }, [fetchSegmentos]);
  return { ...data, refetch: fetchSegmentos };
}

function useTemplates() {
  const [data, setData] = React.useState<{ templates: AssinaturaDigitalTemplate[]; isLoading: boolean; error: string | null; }>({ templates: [], isLoading: false, error: null });

  const fetchTemplates = React.useCallback(async () => {
    setData(prev => ({ ...prev, isLoading: true, error: null }));
    try {
      const res = await fetch('/api/assinatura-digital/templates?ativo=true');
      const json = await res.json();
      if (!res.ok || json.error) { throw new Error(json.error || 'Erro ao carregar templates'); }
      setData({ templates: json.data || [], isLoading: false, error: null });
    } catch (err) {
      setData({ templates: [], isLoading: false, error: err instanceof Error ? err.message : 'Erro desconhecido' });
    }
  }, []);

  React.useEffect(() => { fetchTemplates(); }, [fetchTemplates]);
  return { ...data, refetch: fetchTemplates };
}

function criarColunas(onEditSchema: (formulario: AssinaturaDigitalFormulario) => void, onDuplicate: (formulario: AssinaturaDigitalFormulario) => void, onDelete: (formulario: AssinaturaDigitalFormulario) => void, templates: AssinaturaDigitalTemplate[], canEdit: boolean, canCreate: boolean, canDelete: boolean): ColumnDef<AssinaturaDigitalFormulario>[] {
  return [
    { 
      accessorKey: 'nome', 
      header: ({ column }) => (
        <div className="flex items-center justify-start"><DataTableColumnHeader column={column} title="Nome" /></div>
      ), 
      enableSorting: true, 
      size: 250, 
      meta: { align: 'left', headerLabel: 'Nome' }, 
      cell: ({ row }) => {
        const formulario = row.original;
        const displayName = getFormularioDisplayName(formulario);
        return (
          <div className="min-h-10 flex items-center justify-start text-sm gap-2">
            <span>{displayName}</span>
          </div>
        );
      } 
    },
    { 
      accessorKey: 'segmento', 
      header: ({ column }) => (
        <div className="flex items-center justify-center"><DataTableColumnHeader column={column} title="Segmento" /></div>
      ), 
      enableSorting: false, 
      size: 150, 
      meta: { headerLabel: 'Segmento' },
      cell: ({ row }) => {
        const segmento = row.original.segmento;
        return (
          <div className="min-h-10 flex items-center justify-center">
            <Badge variant="outline" className="capitalize">{segmento?.nome || 'N/A'}</Badge>
          </div>
        );
      } 
    },
    { 
      accessorKey: 'descricao', 
      header: ({ column }) => (
        <div className="flex items-center justify-start"><DataTableColumnHeader column={column} title="Descrição" /></div>
      ), 
      enableSorting: false, 
      size: 200, 
      meta: { align: 'left', headerLabel: 'Descrição' }, 
      cell: ({ row }) => {
        const descricao = row.getValue('descricao') as string | null;
        const truncated = descricao ? (descricao.length > 50 ? descricao.substring(0, 50) + '...' : descricao) : '';
        return (
          <div className="min-h-10 flex items-center justify-start text-sm">
            {truncated ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="truncate max-w-[180px]">{truncated}</span>
                </TooltipTrigger>
                <TooltipContent>{descricao}</TooltipContent>
              </Tooltip>
            ) : (
              <span className="text-muted-foreground">-</span>
            )}
          </div>
        );
      } 
    },
    { 
      accessorKey: 'template_ids', 
      header: ({ column }) => (
        <div className="flex items-center justify-center"><DataTableColumnHeader column={column} title="Templates" /></div>
      ), 
      enableSorting: false, 
      size: 120, 
      meta: { headerLabel: 'Templates' },
      cell: ({ row }) => {
        const templateIds = row.getValue('template_ids') as string[] | null;
        const count = templateIds ? templateIds.length : 0;
        const previewText = templateIds && templateIds.length > 0 ? getTemplatePreviewText(templateIds, templates) : 'Nenhum template';
        return (
          <div className="min-h-10 flex items-center justify-center">
            <Tooltip>
              <TooltipTrigger asChild>
                <Badge variant="secondary" className="capitalize cursor-help">{count}</Badge>
              </TooltipTrigger>
              <TooltipContent>{previewText}</TooltipContent>
            </Tooltip>
          </div>
        );
      } 
    },
    { 
      id: 'verificadores', 
      header: ({ column }) => (
        <div className="flex items-center justify-center"><DataTableColumnHeader column={column} title="Verificadores" /></div>
      ), 
      enableSorting: false, 
      size: 200, 
      meta: { headerLabel: 'Verificadores' },
      cell: ({ row }) => {
        const formulario = row.original;
        const fotoNecessaria = formulario.foto_necessaria ?? false;
        const geolocationNecessaria = formulario.geolocation_necessaria ?? false;
        
        return (
          <div className="min-h-10 flex items-center justify-center gap-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <Badge variant={getBooleanBadgeVariant(fotoNecessaria)} className="capitalize">
                  Foto
                </Badge>
              </TooltipTrigger>
              <TooltipContent>
                Foto necessária: {formatBooleanBadge(fotoNecessaria)}
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Badge variant={getBooleanBadgeVariant(geolocationNecessaria)} className="capitalize">
                  Geo
                </Badge>
              </TooltipTrigger>
              <TooltipContent>
                Geolocalização necessária: {formatBooleanBadge(geolocationNecessaria)}
              </TooltipContent>
            </Tooltip>
          </div>
        );
      } 
    },
    { 
      accessorKey: 'ativo', 
      header: ({ column }) => (
        <div className="flex items-center justify-center"><DataTableColumnHeader column={column} title="Ativo" /></div>
      ), 
      enableSorting: true, 
      size: 100, 
      enableHiding: true,
      meta: { headerLabel: 'Ativo' },
      cell: ({ row }) => {
        const ativo = row.getValue('ativo') as boolean;
        return (
          <div className="min-h-10 flex items-center justify-center">
            <Badge variant={ativo ? 'success' : 'secondary'} className="capitalize">{formatAtivoStatus(ativo)}</Badge>
          </div>
        );
      } 
    },
    { 
      id: 'acoes', 
      header: () => (
        <div className="flex items-center justify-center"><div className="text-sm font-medium">Ações</div></div>
      ), 
      enableSorting: false, 
      size: 150, 
      enableHiding: false,
      meta: { headerLabel: 'Ações' },
      cell: ({ row }) => {
        const formulario = row.original;
        return (
          <div className="min-h-10 flex items-center justify-center">
            <FormularioActions formulario={formulario} onEditSchema={onEditSchema} onDuplicate={onDuplicate} onDelete={onDelete} canEdit={canEdit} canCreate={canCreate} canDelete={canDelete} />
          </div>
        );
      } 
    },
  ];
}

function FormularioActions({
  formulario,
  onEditSchema,
  onDuplicate,
  onDelete,
  canEdit,
  canCreate,
  canDelete,
}: {
  formulario: AssinaturaDigitalFormulario;
  onEditSchema: (formulario: AssinaturaDigitalFormulario) => void;
  onDuplicate: (formulario: AssinaturaDigitalFormulario) => void;
  onDelete: (formulario: AssinaturaDigitalFormulario) => void;
  canEdit: boolean;
  canCreate: boolean;
  canDelete: boolean;
}) {
  return (
    <ButtonGroup>
      {canEdit && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => onEditSchema(formulario)}
            >
              <Pencil className="h-4 w-4" />
              <span className="sr-only">Editar Schema</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>Editar Schema</TooltipContent>
        </Tooltip>
      )}
      {canCreate && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => onDuplicate(formulario)}
            >
              <Copy className="h-4 w-4" />
              <span className="sr-only">Duplicar</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>Duplicar</TooltipContent>
        </Tooltip>
      )}

      {canDelete && (
        <AlertDialog>
          <Tooltip>
            <TooltipTrigger asChild>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <Trash2 className="h-4 w-4" />
                  <span className="sr-only">Deletar formulário</span>
                </Button>
              </AlertDialogTrigger>
            </TooltipTrigger>
            <TooltipContent>Deletar</TooltipContent>
          </Tooltip>

          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Deletar formulário?</AlertDialogTitle>
              <AlertDialogDescription>
                Esta ação não pode ser desfeita. O formulário será permanentemente removido.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={() => onDelete(formulario)}>
                Deletar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </ButtonGroup>
  );
}

export function FormulariosClient() {
  const router = useRouter();
  const [table, setTable] = React.useState<TanstackTable<AssinaturaDigitalFormulario> | null>(null);
  const [busca, setBusca] = React.useState('');
  const [pagina, setPagina] = React.useState(0);
  const [limite, setLimite] = React.useState(50);
  const [filtros, setFiltros] = React.useState<FormulariosFilters>({});
  const [createOpen, setCreateOpen] = React.useState(false);
  const [duplicateOpen, setDuplicateOpen] = React.useState(false);
  const [deleteOpen, setDeleteOpen] = React.useState(false);
  const [novoPopoverOpen, setNovoPopoverOpen] = React.useState(false);
  const [selectedFormulario, setSelectedFormulario] = React.useState<AssinaturaDigitalFormulario | null>(null);
  const [selectedFormularios, setSelectedFormularios] = React.useState<AssinaturaDigitalFormulario[]>([]);
  const [rowSelection, setRowSelection] = React.useState<Record<string, boolean>>({});
  const [segmentosDialogOpen, setSegmentosDialogOpen] = React.useState(false);
  const [segmentoEditOpen, setSegmentoEditOpen] = React.useState(false);
  const [segmentoDeleteOpen, setSegmentoDeleteOpen] = React.useState(false);
  const [segmentoDuplicateOpen, setSegmentoDuplicateOpen] = React.useState(false);
  const [selectedSegmento, setSelectedSegmento] = React.useState<AssinaturaDigitalSegmento | null>(null);

  const { temPermissao } = useMinhasPermissoes('assinatura_digital');
  const canCreate = temPermissao('assinatura_digital', 'criar');
  const canEdit = temPermissao('assinatura_digital', 'editar');
  const canDelete = temPermissao('assinatura_digital', 'deletar');

  const { segmentos, refetch: refetchSegmentos } = useSegmentos();
  const { templates } = useTemplates();

  const buscaDebounced = useDebounce(busca, 500);

  const params = React.useMemo(
    () => ({
      pagina: pagina + 1,
      limite,
      busca: buscaDebounced || undefined,
      ativo: filtros.ativo,
      foto_necessaria: filtros.foto_necessaria,
      geolocation_necessaria: filtros.geolocation_necessaria,
    }),
    [pagina, limite, buscaDebounced, filtros]
  );

  const { formularios, total, isLoading, error, refetch } = useFormularios(params);

  const handleCreateSuccess = React.useCallback(() => { refetch(); setCreateOpen(false); }, [refetch]);
  const handleEditSchema = React.useCallback((formulario: AssinaturaDigitalFormulario) => { router.push(`/assinatura-digital/formularios/${formulario.id}/schema`); }, [router]);
  const handleDuplicate = React.useCallback((formulario: AssinaturaDigitalFormulario) => { setSelectedFormulario(formulario); setDuplicateOpen(true); }, []);
  const handleDelete = React.useCallback(async (formulario: AssinaturaDigitalFormulario) => {
    try {
      const response = await fetch(`/api/assinatura-digital/formularios/${formulario.id}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        const json = await response.json();
        throw new Error(json.error || 'Erro ao deletar formulário');
      }
      toast.success('Formulário deletado com sucesso');
      await refetch();
      router.refresh();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao deletar formulário';
      toast.error(message);
      console.error('Erro ao deletar formulário:', error);
    }
  }, [refetch, router]);
  
  const handleBulkDeleteClick = React.useCallback(() => { 
    const selected = Object.keys(rowSelection).map(id => formularios.find(f => f.id === Number(id))).filter(Boolean) as AssinaturaDigitalFormulario[]; 
    setSelectedFormularios(selected); 
    setDeleteOpen(true); 
  }, [rowSelection, formularios]);
  const handleExportCSV = React.useCallback(() => { const selected = Object.keys(rowSelection).length > 0 ? Object.keys(rowSelection).map(id => formularios.find(f => f.id === Number(id))).filter(Boolean) as AssinaturaDigitalFormulario[] : formularios; const csv = [["Nome","Segmento","Descrição","Templates","Foto Necessária","Geolocalização Necessária","Ativo","UUID"].join(','), ...selected.map(f => [`"${f.nome}"`, `"${f.segmento?.nome || ''}"`, `"${f.descricao || ''}"`, f.template_ids?.length || 0, f.foto_necessaria ? 'Sim' : 'Não', f.geolocation_necessaria ? 'Sim' : 'Não', f.ativo ? 'Ativo' : 'Inativo', f.formulario_uuid].join(','))].join('\n'); const blob = new Blob([csv], { type: 'text/csv' }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = 'formularios.csv'; a.click(); URL.revokeObjectURL(url); }, [rowSelection, formularios]);
  const handleDuplicateSuccess = React.useCallback(() => { refetch(); setDuplicateOpen(false); setSelectedFormulario(null); }, [refetch]);
  const handleDeleteSuccess = React.useCallback(() => { refetch(); setDeleteOpen(false); setSelectedFormularios([]); setRowSelection({}); }, [refetch]);

  const handleAtivoFilterChange = React.useCallback((value: string) => {
    const ativo = value === 'all' ? undefined : value === 'true';
    setFiltros(prev => ({ ...prev, ativo }));
    setPagina(0);
  }, []);

  const handleFotoNecessariaFilterChange = React.useCallback((value: string) => {
    const fotoNecessaria = value === 'all' ? undefined : value === 'true';
    setFiltros(prev => ({ ...prev, foto_necessaria: fotoNecessaria }));
    setPagina(0);
  }, []);

  const handleGeolocationNecessariaFilterChange = React.useCallback((value: string) => {
    const geolocationNecessaria = value === 'all' ? undefined : value === 'true';
    setFiltros(prev => ({ ...prev, geolocation_necessaria: geolocationNecessaria }));
    setPagina(0);
  }, []);

  const colunas = React.useMemo(() => criarColunas(handleEditSchema, handleDuplicate, handleDelete, templates, canEdit, canCreate, canDelete), [handleEditSchema, handleDuplicate, handleDelete, templates, canEdit, canCreate, canDelete]);

  const bulkActions = React.useMemo(() => {
    const selectedCount = Object.keys(rowSelection).length;
    if (selectedCount === 0) return null;
    return (
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">
          {selectedCount} selecionado{selectedCount > 1 ? 's' : ''}
        </span>
        <Button
          variant="outline"
          size="sm"
          className="h-10"
          onClick={handleExportCSV}
        >
          <Download className="h-4 w-4 mr-2" />
          Exportar CSV
        </Button>
        {canDelete && (
          <Button
            variant="destructive"
            size="sm"
            className="h-10"
            onClick={handleBulkDeleteClick}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Deletar
          </Button>
        )}
      </div>
    );
  }, [rowSelection, handleExportCSV, handleBulkDeleteClick, canDelete]);

  const handleOpenNovoFormulario = React.useCallback(() => {
    setNovoPopoverOpen(false);
    setCreateOpen(true);
  }, []);

  const handleOpenSegmentos = React.useCallback(() => {
    setNovoPopoverOpen(false);
    setSegmentosDialogOpen(true);
  }, []);

  return (
    <>
      {error && (
        <div className="rounded-md bg-destructive/15 p-4 text-sm text-destructive">
          <p className="font-semibold">Erro ao carregar formulários:</p>
          <p>{error}</p>
          <Button variant="outline" size="sm" onClick={refetch} className="mt-2">
            Tentar novamente
          </Button>
        </div>
      )}

      <DataShell
        header={
          table ? (
            <DataTableToolbar
              table={table}
              searchValue={busca}
              onSearchValueChange={(value) => {
                setBusca(value);
                setPagina(0);
              }}
              searchPlaceholder="Buscar por nome, slug ou descrição..."
              filtersSlot={
                <>
                  <Select
                    value={filtros.ativo === undefined ? 'all' : filtros.ativo ? 'true' : 'false'}
                    onValueChange={handleAtivoFilterChange}
                  >
                    <SelectTrigger className="h-10 w-[150px]">
                      <SelectValue placeholder="Ativo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="true">Ativo</SelectItem>
                      <SelectItem value="false">Inativo</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select
                    value={filtros.foto_necessaria === undefined ? 'all' : filtros.foto_necessaria ? 'true' : 'false'}
                    onValueChange={handleFotoNecessariaFilterChange}
                  >
                    <SelectTrigger className="h-10 w-[180px]">
                      <SelectValue placeholder="Foto necessária" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas</SelectItem>
                      <SelectItem value="true">Sim</SelectItem>
                      <SelectItem value="false">Não</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select
                    value={filtros.geolocation_necessaria === undefined ? 'all' : filtros.geolocation_necessaria ? 'true' : 'false'}
                    onValueChange={handleGeolocationNecessariaFilterChange}
                  >
                    <SelectTrigger className="h-10 w-[200px]">
                      <SelectValue placeholder="Geolocalização necessária" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas</SelectItem>
                      <SelectItem value="true">Sim</SelectItem>
                      <SelectItem value="false">Não</SelectItem>
                    </SelectContent>
                  </Select>

                  {bulkActions}
                </>
              }
              actionSlot={
                canCreate ? (
                  <Popover open={novoPopoverOpen} onOpenChange={setNovoPopoverOpen}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <PopoverTrigger asChild>
                          <Button
                            size="icon"
                            className="h-10 w-10"
                            aria-label="Novo"
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </PopoverTrigger>
                      </TooltipTrigger>
                      <TooltipContent>Novo</TooltipContent>
                    </Tooltip>
                    <PopoverContent align="end" className="w-64 p-2">
                      <div className="flex flex-col">
                        <Button
                          type="button"
                          variant="ghost"
                          className="justify-start"
                          onClick={handleOpenNovoFormulario}
                        >
                          <Plus className="mr-2 h-4 w-4" />
                          Novo formulário
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          className="justify-start"
                          onClick={handleOpenSegmentos}
                        >
                          <Tags className="mr-2 h-4 w-4" />
                          Segmentos
                        </Button>
                      </div>
                    </PopoverContent>
                  </Popover>
                ) : null
              }
            />
          ) : (
            <div className="p-6" />
          )
        }
        footer={
          total > 0 ? (
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
            data={formularios}
            columns={colunas}
            pagination={{
              pageIndex: pagina,
              pageSize: limite,
              total,
              totalPages: Math.ceil(total / limite),
              onPageChange: setPagina,
              onPageSizeChange: setLimite,
            }}
            sorting={undefined}
            rowSelection={{
              state: rowSelection,
              onRowSelectionChange: setRowSelection,
              getRowId: (row) => row.id.toString(),
            }}
            isLoading={isLoading}
            error={null}
            emptyMessage="Nenhum formulário encontrado."
            onRowClick={(row) => handleEditSchema(row)}
            onTableReady={(t) => {
              const tableInstance = t as TanstackTable<AssinaturaDigitalFormulario>;
              // Ocultar coluna "ativo" por padrão
              tableInstance.getColumn('ativo')?.toggleVisibility(false);
              setTable(tableInstance);
            }}
            hidePagination
            hideTableBorder
          />
        </div>
      </DataShell>

      <FormularioCreateDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onSuccess={handleCreateSuccess}
        segmentos={segmentos}
        templates={templates}
      />

      {selectedFormulario && (<FormularioDuplicateDialog open={duplicateOpen} onOpenChange={setDuplicateOpen} formulario={selectedFormulario} onSuccess={handleDuplicateSuccess} />)}

      <FormularioDeleteDialog open={deleteOpen} onOpenChange={setDeleteOpen} formularios={selectedFormularios} onSuccess={handleDeleteSuccess} />

      <SegmentosManagerDialog
        open={segmentosDialogOpen}
        onOpenChange={setSegmentosDialogOpen}
        onCreated={() => {
          refetchSegmentos();
        }}
        onEdit={(segmento) => {
          setSelectedSegmento(segmento);
          setSegmentoEditOpen(true);
        }}
        onDuplicate={(segmento) => {
          setSelectedSegmento(segmento);
          setSegmentoDuplicateOpen(true);
        }}
        onDelete={(segmento) => {
          setSelectedSegmento(segmento);
          setSegmentoDeleteOpen(true);
        }}
      />

      {selectedSegmento && (
        <SegmentoEditDialog
          open={segmentoEditOpen}
          onOpenChange={setSegmentoEditOpen}
          segmento={selectedSegmento}
          onSuccess={() => {
            refetchSegmentos();
            setSegmentoEditOpen(false);
            setSelectedSegmento(null);
          }}
        />
      )}

      {selectedSegmento && (
        <SegmentoDuplicateDialog
          open={segmentoDuplicateOpen}
          onOpenChange={setSegmentoDuplicateOpen}
          segmento={selectedSegmento}
          onSuccess={() => {
            refetchSegmentos();
            setSegmentoDuplicateOpen(false);
            setSelectedSegmento(null);
          }}
        />
      )}

      <SegmentoDeleteDialog
        open={segmentoDeleteOpen}
        onOpenChange={setSegmentoDeleteOpen}
        segmentos={selectedSegmento ? [selectedSegmento] : []}
        onSuccess={() => {
          refetchSegmentos();
          setSegmentoDeleteOpen(false);
          setSelectedSegmento(null);
        }}
      />
    </>
  );
}
