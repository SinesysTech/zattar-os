'use client';

// Página de formulários de assinatura digital

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useDebounce } from '@/app/_lib/hooks/use-debounce';
import { useMinhasPermissoes } from '@/app/_lib/hooks/use-minhas-permissoes';
import { DataTable } from '@/components/ui/data-table';
import { DataTableColumnHeader } from '@/components/ui/data-table-column-header';
import { TableToolbar } from '@/components/ui/table-toolbar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, Copy, Trash2, Download, FileText } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { ColumnDef } from '@tanstack/react-table';
import type { AssinaturaDigitalFormulario, AssinaturaDigitalSegmento, AssinaturaDigitalTemplate } from '@/backend/types/assinatura-digital/types';
import {
  getFormularioDisplayName,
  formatBooleanBadge,
  getBooleanBadgeVariant,
  getAtivoBadgeTone,
  formatAtivoStatus,
  getTemplatePreviewText,
} from '@/lib/assinatura-digital/utils/formulario-utils';
import { FormularioCreateDialog } from './components/formulario-create-dialog';
import { FormularioDuplicateDialog } from './components/formulario-duplicate-dialog';
import { FormularioDeleteDialog } from './components/formulario-delete-dialog';

// Tipos locais para filtros
interface FormulariosFilters {
  segmento_id?: number[];
  ativo?: boolean;
  foto_necessaria?: boolean;
  geolocation_necessaria?: boolean;
}

// Configurações de filtros
const FORMULARIOS_FILTER_CONFIGS = [
  {
    id: 'segmento_id',
    label: 'Segmento',
    type: 'multi-select' as const,
  },
  {
    id: 'ativo',
    label: 'Ativo',
    type: 'select' as const,
    options: [
      { value: 'true', label: 'Sim' },
      { value: 'false', label: 'Não' },
    ],
  },
  {
    id: 'foto_necessaria',
    label: 'Foto necessária',
    type: 'select' as const,
    options: [
      { value: 'true', label: 'Sim' },
      { value: 'false', label: 'Não' },
    ],
  },
  {
    id: 'geolocation_necessaria',
    label: 'Geolocalização necessária',
    type: 'select' as const,
    options: [
      { value: 'true', label: 'Sim' },
      { value: 'false', label: 'Não' },
    ],
  },
];

// Funções de filtro
function buildFormulariosFilterOptions(segmentos: AssinaturaDigitalSegmento[]) {
  const options = [];
  for (const config of FORMULARIOS_FILTER_CONFIGS) {
    if (config.type === 'select') {
      for (const opt of config.options) {
        options.push({
          value: `${config.id}_${opt.value}`,
          label: opt.label,
          group: config.label,
        });
      }
    } else if (config.type === 'multi-select' && config.id === 'segmento_id') {
      for (const segmento of segmentos) {
        options.push({
          value: `${config.id}_${segmento.id}`,
          label: segmento.nome,
          group: config.label,
        });
      }
    }
  }
  return options;
}

function buildFormulariosFilterGroups(segmentos: AssinaturaDigitalSegmento[]) {
  return FORMULARIOS_FILTER_CONFIGS.map(config => {
    if (config.type === 'select') {
      return {
        label: config.label,
        options: config.options.map(opt => ({
          value: `${config.id}_${opt.value}`,
          label: opt.label,
        })),
      };
    } else if (config.type === 'multi-select' && config.id === 'segmento_id') {
      return {
        label: config.label,
        options: segmentos.map(s => ({
          value: `${config.id}_${s.id}`,
          label: s.nome,
        })),
      };
    }
    return { label: config.label, options: [] };
  });
}

function parseFormulariosFilters(selectedIds: string[]): FormulariosFilters {
  const filters: FormulariosFilters = {};
  for (const id of selectedIds) {
    const [key, value] = id.split('_', 2);
    if (key === 'segmento_id') {
      if (!filters.segmento_id) filters.segmento_id = [];
      filters.segmento_id.push(Number(value));
    } else if (key === 'ativo') {
      filters.ativo = value === 'true';
    } else if (key === 'foto_necessaria') {
      filters.foto_necessaria = value === 'true';
    } else if (key === 'geolocation_necessaria') {
      filters.geolocation_necessaria = value === 'true';
    }
  }
  return filters;
}

// Hook para buscar formulários
function useFormularios(params: {
  pagina: number;
  limite: number;
  busca?: string;
  segmento_id?: number[];
  ativo?: boolean;
  foto_necessaria?: boolean;
  geolocation_necessaria?: boolean;
}) {
  const [data, setData] = React.useState<{
    formularios: AssinaturaDigitalFormulario[];
    total: number;
    isLoading: boolean;
    error: string | null;
  }>({
    formularios: [],
    total: 0,
    isLoading: false,
    error: null,
  });

  const fetchFormularios = React.useCallback(async () => {
    setData(prev => ({ ...prev, isLoading: true, error: null }));
    try {
      const searchParams = new URLSearchParams({
        pagina: params.pagina.toString(),
        limite: params.limite.toString(),
      });
      if (params.busca) searchParams.set('search', params.busca);
      if (params.segmento_id && params.segmento_id.length > 0) {
        params.segmento_id.forEach(id => searchParams.append('segmento_id', id.toString()));
      }
      if (params.ativo !== undefined) searchParams.set('ativo', params.ativo.toString());
      if (params.foto_necessaria !== undefined) searchParams.set('foto_necessaria', params.foto_necessaria.toString());
      if (params.geolocation_necessaria !== undefined) searchParams.set('geolocation_necessaria', params.geolocation_necessaria.toString());

      const res = await fetch(`/api/assinatura-digital/formularios?${searchParams}`);
      const json = await res.json();
      if (!res.ok || json.error) {
        throw new Error(json.error || 'Erro ao carregar formulários');
      }
      setData({
        formularios: json.data || [],
        total: json.total || 0,
        isLoading: false,
        error: null,
      });
    } catch (err) {
      setData({
        formularios: [],
        total: 0,
        isLoading: false,
        error: err instanceof Error ? err.message : 'Erro desconhecido',
      });
    }
  }, [params]);

  React.useEffect(() => {
    fetchFormularios();
  }, [fetchFormularios]);

  return { ...data, refetch: fetchFormularios };
}

// Hook para buscar segmentos
function useSegmentos() {
  const [data, setData] = React.useState<{
    segmentos: AssinaturaDigitalSegmento[];
    isLoading: boolean;
    error: string | null;
  }>({
    segmentos: [],
    isLoading: false,
    error: null,
  });

  const fetchSegmentos = React.useCallback(async () => {
    setData(prev => ({ ...prev, isLoading: true, error: null }));
    try {
      const res = await fetch('/api/assinatura-digital/segmentos?ativo=true');
      const json = await res.json();
      if (!res.ok || json.error) {
        throw new Error(json.error || 'Erro ao carregar segmentos');
      }
      setData({
        segmentos: json.data || [],
        isLoading: false,
        error: null,
      });
    } catch (err) {
      setData({
        segmentos: [],
        isLoading: false,
        error: err instanceof Error ? err.message : 'Erro desconhecido',
      });
    }
  }, []);

  React.useEffect(() => {
    fetchSegmentos();
  }, [fetchSegmentos]);

  return { ...data, refetch: fetchSegmentos };
}

// Hook para buscar templates
function useTemplates() {
  const [data, setData] = React.useState<{
    templates: AssinaturaDigitalTemplate[];
    isLoading: boolean;
    error: string | null;
  }>({
    templates: [],
    isLoading: false,
    error: null,
  });

  const fetchTemplates = React.useCallback(async () => {
    setData(prev => ({ ...prev, isLoading: true, error: null }));
    try {
      const res = await fetch('/api/assinatura-digital/templates?ativo=true');
      const json = await res.json();
      if (!res.ok || json.error) {
        throw new Error(json.error || 'Erro ao carregar templates');
      }
      setData({
        templates: json.data || [],
        isLoading: false,
        error: null,
      });
    } catch (err) {
      setData({
        templates: [],
        isLoading: false,
        error: err instanceof Error ? err.message : 'Erro desconhecido',
      });
    }
  }, []);

  React.useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  return { ...data, refetch: fetchTemplates };
}

// Define as colunas da tabela
function criarColunas(
  onEditSchema: (formulario: AssinaturaDigitalFormulario) => void,
  onDuplicate: (formulario: AssinaturaDigitalFormulario) => void,
  onDelete: (formulario: AssinaturaDigitalFormulario) => void,
  templates: AssinaturaDigitalTemplate[],
  canEdit: boolean,
  canCreate: boolean,
  canDelete: boolean
): ColumnDef<AssinaturaDigitalFormulario>[] {
  return [
    {
      id: 'select',
      header: ({ table }) => (
        <div className="flex items-center justify-center">
          <Checkbox
            checked={
              table.getIsAllPageRowsSelected() ||
              (table.getIsSomePageRowsSelected() && 'indeterminate')
            }
            onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
            aria-label="Selecionar todos"
          />
        </div>
      ),
      cell: ({ row }) => (
        <div className="flex items-center justify-center">
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(value) => row.toggleSelected(!!value)}
            aria-label="Selecionar linha"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      ),
      enableSorting: false,
      enableHiding: false,
      size: 50,
    },
    {
      accessorKey: 'nome',
      header: ({ column }) => (
        <div className="flex items-center justify-start">
          <DataTableColumnHeader column={column} title="Nome" />
        </div>
      ),
      enableSorting: true,
      size: 250,
      meta: { align: 'left' },
      cell: ({ row }) => {
        const formulario = row.original;
        const displayName = getFormularioDisplayName(formulario);
        return (
          <div className="min-h-10 flex items-center justify-start text-sm gap-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="truncate max-w-[200px]">{displayName}</span>
              </TooltipTrigger>
              <TooltipContent>
                {displayName}
              </TooltipContent>
            </Tooltip>
          </div>
        );
      },
    },
    {
      accessorKey: 'segmento',
      header: ({ column }) => (
        <div className="flex items-center justify-center">
          <DataTableColumnHeader column={column} title="Segmento" />
        </div>
      ),
      enableSorting: false,
      size: 150,
      cell: ({ row }) => {
        const segmento = row.original.segmento;
        return (
          <div className="min-h-10 flex items-center justify-center">
            <Badge variant="outline" className="capitalize">
              {segmento?.nome || 'N/A'}
            </Badge>
          </div>
        );
      },
    },
    {
      accessorKey: 'descricao',
      header: ({ column }) => (
        <div className="flex items-center justify-start">
          <DataTableColumnHeader column={column} title="Descrição" />
        </div>
      ),
      enableSorting: false,
      size: 200,
      meta: { align: 'left' },
      cell: ({ row }) => {
        const descricao = row.getValue('descricao') as string | null;
        const truncated = descricao ? descricao.length > 50 ? descricao.substring(0, 50) + '...' : descricao : '';
        return (
          <div className="min-h-10 flex items-center justify-start text-sm">
            {truncated ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="truncate max-w-[180px]">{truncated}</span>
                </TooltipTrigger>
                <TooltipContent>
                  {descricao}
                </TooltipContent>
              </Tooltip>
            ) : (
              <span className="text-muted-foreground">-</span>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: 'template_ids',
      header: ({ column }) => (
        <div className="flex items-center justify-center">
          <DataTableColumnHeader column={column} title="Templates" />
        </div>
      ),
      enableSorting: false,
      size: 120,
      cell: ({ row }) => {
        const templateIds = row.getValue('template_ids') as string[] | null;
        const count = templateIds ? templateIds.length : 0;
        const previewText = templateIds && templateIds.length > 0
          ? getTemplatePreviewText(templateIds, templates)
          : 'Nenhum template';
        return (
          <div className="min-h-10 flex items-center justify-center">
            <Tooltip>
              <TooltipTrigger asChild>
                <Badge variant="secondary" className="capitalize cursor-help">
                  {count}
                </Badge>
              </TooltipTrigger>
              <TooltipContent>
                {previewText}
              </TooltipContent>
            </Tooltip>
          </div>
        );
      },
    },
    {
      accessorKey: 'foto_necessaria',
      header: ({ column }) => (
        <div className="flex items-center justify-center">
          <DataTableColumnHeader column={column} title="Foto Necessária" />
        </div>
      ),
      enableSorting: false,
      size: 140,
      cell: ({ row }) => {
        const value = row.getValue('foto_necessaria') as boolean;
        return (
          <div className="min-h-10 flex items-center justify-center">
            <Badge variant={getBooleanBadgeVariant(value)} className="capitalize">
              {formatBooleanBadge(value)}
            </Badge>
          </div>
        );
      },
    },
    {
      accessorKey: 'geolocation_necessaria',
      header: ({ column }) => (
        <div className="flex items-center justify-center">
          <DataTableColumnHeader column={column} title="Geolocalização Necessária" />
        </div>
      ),
      enableSorting: false,
      size: 160,
      cell: ({ row }) => {
        const value = row.getValue('geolocation_necessaria') as boolean;
        return (
          <div className="min-h-10 flex items-center justify-center">
            <Badge variant={getBooleanBadgeVariant(value)} className="capitalize">
              {formatBooleanBadge(value)}
            </Badge>
          </div>
        );
      },
    },
    {
      accessorKey: 'ativo',
      header: ({ column }) => (
        <div className="flex items-center justify-center">
          <DataTableColumnHeader column={column} title="Ativo" />
        </div>
      ),
      enableSorting: true,
      size: 100,
      cell: ({ row }) => {
        const ativo = row.getValue('ativo') as boolean;
        return (
          <div className="min-h-10 flex items-center justify-center">
            <Badge tone={getAtivoBadgeTone(ativo)} className="capitalize">
              {formatAtivoStatus(ativo)}
            </Badge>
          </div>
        );
      },
    },
    {
      id: 'acoes',
      header: () => (
        <div className="flex items-center justify-center">
          <div className="text-sm font-medium">Ações</div>
        </div>
      ),
      enableSorting: false,
      size: 120,
      cell: ({ row }) => {
        const formulario = row.original;
        return (
          <div className="min-h-10 flex items-center justify-center gap-2">
            <FormularioActions
              formulario={formulario}
              onEditSchema={onEditSchema}
              onDuplicate={onDuplicate}
              onDelete={onDelete}
              canEdit={canEdit}
              canCreate={canCreate}
              canDelete={canDelete}
            />
          </div>
        );
      },
    },
  ];
}

// Componente de ações para cada formulário
function FormularioActions({
  formulario,
  onEditSchema,
  onDuplicate,
  onDelete,
  canEdit,
  canCreate: _canCreate,
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
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
        >
          <MoreHorizontal className="h-4 w-4" />
          <span className="sr-only">Ações do formulário</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {canEdit && (
          <DropdownMenuItem onClick={() => onEditSchema(formulario)}>
            <FileText className="mr-2 h-4 w-4" />
            Editar Schema
          </DropdownMenuItem>
        )}
        {canCreate && (
          <DropdownMenuItem onClick={() => onDuplicate(formulario)}>
            <Copy className="mr-2 h-4 w-4" />
            Duplicar
          </DropdownMenuItem>
        )}
        {canDelete && (
          <DropdownMenuItem onClick={() => onDelete(formulario)} className="text-destructive">
            <Trash2 className="mr-2 h-4 w-4" />
            Deletar
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default function FormulariosPage() {
  const router = useRouter();
  const [busca, setBusca] = React.useState('');
  const [pagina, setPagina] = React.useState(0);
  const [limite, setLimite] = React.useState(50);
  const [filtros, setFiltros] = React.useState<FormulariosFilters>({});
  const [selectedFilterIds, setSelectedFilterIds] = React.useState<string[]>([]);
  const [createOpen, setCreateOpen] = React.useState(false);
  const [duplicateOpen, setDuplicateOpen] = React.useState(false);
  const [deleteOpen, setDeleteOpen] = React.useState(false);
  const [selectedFormulario, setSelectedFormulario] = React.useState<AssinaturaDigitalFormulario | null>(null);
  const [selectedFormularios, setSelectedFormularios] = React.useState<AssinaturaDigitalFormulario[]>([]);
  const [rowSelection, setRowSelection] = React.useState<Record<string, boolean>>({});

  // Buscar permissões do usuário para o recurso 'assinatura_digital'
  const { temPermissao, isLoading: isLoadingPermissoes } = useMinhasPermissoes('assinatura_digital');
  const canCreate = temPermissao('assinatura_digital', 'criar');
  const canEdit = temPermissao('assinatura_digital', 'editar');
  const canDelete = temPermissao('assinatura_digital', 'deletar');

  // Hooks para dados
  const { segmentos, isLoading: segmentosLoading } = useSegmentos();
  const { templates, isLoading: templatesLoading } = useTemplates();

  // Preparar opções e grupos de filtros
  const filterOptions = React.useMemo(() => buildFormulariosFilterOptions(segmentos), [segmentos]);
  const filterGroups = React.useMemo(() => buildFormulariosFilterGroups(segmentos), [segmentos]);

  // Debounce da busca
  const buscaDebounced = useDebounce(busca, 500);

  // Parâmetros para buscar formulários
  const params = React.useMemo(() => {
    return {
      pagina: pagina + 1, // API usa 1-indexed
      limite,
      busca: buscaDebounced || undefined,
      segmento_id: filtros.segmento_id,
      ativo: filtros.ativo,
      foto_necessaria: filtros.foto_necessaria,
      geolocation_necessaria: filtros.geolocation_necessaria,
    };
  }, [pagina, limite, buscaDebounced, filtros]);

  const { formularios, total, isLoading, error, refetch } = useFormularios(params);

  // Definir se está buscando (debounced)
  const isSearching = busca !== buscaDebounced && busca.length > 0;

  // Função para atualizar após criação
  const handleCreateSuccess = React.useCallback(() => {
    refetch();
    setCreateOpen(false);
  }, [refetch]);

  // Função para atualizar filtros
  const handleFilterIdsChange = React.useCallback((selectedIds: string[]) => {
    setSelectedFilterIds(selectedIds);
    const newFilters = parseFormulariosFilters(selectedIds);
    setFiltros(newFilters);
    setPagina(0);
  }, []);

  // Handlers para ações
  const handleEditSchema = React.useCallback((formulario: AssinaturaDigitalFormulario) => {
    router.push(`/assinatura-digital/formularios/${formulario.id}/schema`);
  }, [router]);

  const handleDuplicate = React.useCallback((formulario: AssinaturaDigitalFormulario) => {
    setSelectedFormulario(formulario);
    setDuplicateOpen(true);
  }, []);

  const handleDelete = React.useCallback((formulario: AssinaturaDigitalFormulario) => {
    setSelectedFormularios([formulario]);
    setDeleteOpen(true);
  }, []);

  const handleBulkDelete = React.useCallback(() => {
    const selected = Object.keys(rowSelection).map(id => formularios.find(f => f.id === Number(id))).filter(Boolean) as AssinaturaDigitalFormulario[];
    setSelectedFormularios(selected);
    setDeleteOpen(true);
  }, [rowSelection, formularios]);

  const handleExportCSV = React.useCallback(() => {
    const selected = Object.keys(rowSelection).length > 0
      ? Object.keys(rowSelection).map(id => formularios.find(f => f.id === Number(id))).filter(Boolean) as AssinaturaDigitalFormulario[]
      : formularios;

    const csv = [
      ['Nome', 'Segmento', 'Descrição', 'Templates', 'Foto Necessária', 'Geolocalização Necessária', 'Ativo', 'UUID'].join(','),
      ...selected.map(f => [
        `"${f.nome}"`,
        `"${f.segmento?.nome || ''}"`,
        `"${f.descricao || ''}"`,
        f.template_ids?.length || 0,
        f.foto_necessaria ? 'Sim' : 'Não',
        f.geolocation_necessaria ? 'Sim' : 'Não',
        f.ativo ? 'Ativo' : 'Inativo',
        f.formulario_uuid,
      ].join(',')),
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'formularios.csv';
    a.click();
    URL.revokeObjectURL(url);
  }, [rowSelection, formularios]);

  const handleDuplicateSuccess = React.useCallback(() => {
    refetch();
    setDuplicateOpen(false);
    setSelectedFormulario(null);
  }, [refetch]);

  const handleDeleteSuccess = React.useCallback(() => {
    refetch();
    setDeleteOpen(false);
    setSelectedFormularios([]);
    setRowSelection({});
  }, [refetch]);

  const colunas = React.useMemo(() => criarColunas(handleEditSchema, handleDuplicate, handleDelete, templates, canEdit, canCreate, canDelete), [handleEditSchema, handleDuplicate, handleDelete, templates, canEdit, canCreate, canDelete]);

  // Bulk actions buttons
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
    <div className="space-y-3">
      {/* Toolbar com busca, filtros e ações */}
      <div className="flex items-center gap-3 justify-between">
        <TableToolbar
          searchValue={busca}
          onSearchChange={(value) => {
            setBusca(value);
            setPagina(0);
          }}
          isSearching={isSearching}
          searchPlaceholder="Buscar por nome, slug ou descrição..."
          filterOptions={filterOptions}
          filterGroups={filterGroups}
          selectedFilters={selectedFilterIds}
          onFiltersChange={handleFilterIdsChange}
          filterButtonsMode="buttons"
          extraButtons={bulkActions}
          onNewClick={canCreate ? () => setCreateOpen(true) : undefined}
          newButtonTooltip="Novo Formulário"
        />
      </div>

      {/* Mensagem de erro */}
      {error && (
        <div className="rounded-md bg-destructive/15 p-4 text-sm text-destructive">
          <p className="font-semibold">Erro ao carregar formulários:</p>
          <p>{error}</p>
          <Button variant="outline" size="sm" onClick={refetch} className="mt-2">
            Tentar novamente
          </Button>
        </div>
      )}

      {/* Tabela */}
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
        error={error}
        emptyMessage="Nenhum formulário encontrado."
        onRowClick={(row) => handleEditSchema(row)}
      />

      {/* Dialog para criação de novo formulário */}
      <FormularioCreateDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onSuccess={handleCreateSuccess}
        segmentos={segmentos}
        templates={templates}
      />

      {/* Dialog para duplicação de formulário */}
      {selectedFormulario && (
        <FormularioDuplicateDialog
          open={duplicateOpen}
          onOpenChange={setDuplicateOpen}
          formulario={selectedFormulario}
          onSuccess={handleDuplicateSuccess}
        />
      )}

      {/* Dialog para exclusão de formulários */}
      <FormularioDeleteDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        formularios={selectedFormularios}
        onSuccess={handleDeleteSuccess}
      />
    </div>
  );
}