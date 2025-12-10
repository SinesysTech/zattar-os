'use client';

// Página de templates de assinatura digital

import * as React from 'react';
import { useRouter } from 'next/navigation';
import type { ColumnDef } from '@tanstack/react-table';
import { listarTemplatesAction } from '@/app/actions/assinatura-digital';
import { useDebounce } from '@/app/_lib/hooks/use-debounce';
import { useMinhasPermissoes } from '@/app/_lib/hooks/use-minhas-permissoes';
import { DataTable } from '@/components/ui/data-table';
import { DataTableColumnHeader } from '@/components/ui/data-table-column-header';
import { TableToolbar } from '@/components/ui/table-toolbar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Edit, MoreHorizontal, Copy, Trash2, Download } from 'lucide-react';
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
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuPortal,
  DropdownMenuSubContent,
} from '@/components/ui/dropdown-menu';
import { Plus } from 'lucide-react';
import {
  formatFileSize,
  formatTemplateStatus,
  getStatusBadgeVariant,
  truncateText,
  getTemplateDisplayName,
} from '@/core/assinatura-digital/utils/utils';
import type { Template } from '@/types/assinatura-digital/template.types';
import type { TipoTemplate } from '@/core/assinatura-digital/domain';
import { TemplateCreateDialog } from './components/template-create-dialog';
import { TemplateDuplicateDialog } from './components/template-duplicate-dialog';
import { TemplateDeleteDialog } from './components/template-delete-dialog';
import {
  type TemplatesFilters,
  buildTemplatesFilterOptions,
  buildTemplatesFilterGroups,
  parseTemplatesFilters,
} from './components/template-filters';

// Hook para buscar templates
function useTemplates(params: {
  pagina: number;
  limite: number;
  busca?: string;
  ativo?: boolean;
  tipo_template?: TipoTemplate;
}) {
  const [data, setData] = React.useState<{
    templates: Template[];
    total: number;
    isLoading: boolean;
    error: string | null;
  }>({
    templates: [],
    total: 0,
    isLoading: false,
    error: null,
  });

  const fetchTemplates = React.useCallback(async () => {
    setData(prev => ({ ...prev, isLoading: true, error: null }));
    try {
      const response = await listarTemplatesAction({
        ativo: params.ativo,
        tipo_template: params.tipo_template,
      });

      if (!response.success) {
        throw new Error(response.error || 'Erro ao carregar templates');
      }

      // TODO: Implementar paginação e busca no server action, por enquanto simulando
      let filteredTemplates = response.data || [];
      if (params.busca) {
        const lowerCaseBusca = params.busca.toLowerCase();
        filteredTemplates = filteredTemplates.filter((t: Template) =>
          t.nome.toLowerCase().includes(lowerCaseBusca) ||
          (t.descricao && t.descricao.toLowerCase().includes(lowerCaseBusca))
        );
      }

      const totalFiltered = filteredTemplates.length;
      const startIndex = (params.pagina - 1) * params.limite;
      const endIndex = startIndex + params.limite;
      const paginatedTemplates = filteredTemplates.slice(startIndex, endIndex);

      setData({ templates: paginatedTemplates, total: totalFiltered, isLoading: false, error: null });
    } catch (err) {
      setData({
        templates: [],
        total: 0,
        isLoading: false,
        error: err instanceof Error ? err.message : 'Erro desconhecido',
      });
    }
  }, [params.ativo, params.busca, params.limite, params.pagina, params.tipo_template]);

  React.useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  return { ...data, refetch: fetchTemplates };
}

// Define as colunas da tabela
function criarColunas(
  onEdit: (template: Template) => void,
  onDuplicate: (template: Template) => void,
  onDelete: (template: Template) => void,
  canEdit: boolean,
  canCreate: boolean,
  canDelete: boolean
): ColumnDef<Template>[] {
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
        const template = row.original;
        const displayName = getTemplateDisplayName(template);
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
            {template.tipo_template === 'pdf' && !template.pdf_url && (
              <Badge variant="outline" className="text-xs">
                Sem PDF
              </Badge>
            )}
            {template.tipo_template === 'markdown' && (
              <Badge variant="secondary" className="text-xs">
                Markdown
              </Badge>
            )}
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
        const truncated = truncateText(descricao || '', 50);
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
      accessorKey: 'tipo_template',
      header: ({ column }) => (
        <div className="flex items-center justify-center">
          <DataTableColumnHeader column={column} title="Tipo" />
        </div>
      ),
      enableSorting: true,
      size: 100,
      cell: ({ row }) => {
        const tipo = row.getValue('tipo_template') as TipoTemplate;
        return (
          <div className="min-h-10 flex items-center justify-center text-sm capitalize">
            {tipo === 'pdf' ? 'PDF' : 'Markdown'}
          </div>
        );
      },
    },
    {
      accessorKey: 'status',
      header: ({ column }) => (
        <div className="flex items-center justify-center">
          <DataTableColumnHeader column={column} title="Status" />
        </div>
      ),
      enableSorting: true,
      size: 120,
      cell: ({ row }) => {
        const status = row.getValue('status') as 'ativo' | 'inativo' | 'rascunho';
        return (
          <div className="min-h-10 flex items-center justify-center">
            <Badge variant={getStatusBadgeVariant(status)} className="capitalize">
              {formatTemplateStatus(status)}
            </Badge>
          </div>
        );
      },
    },
    {
      accessorKey: 'versao',
      header: ({ column }) => (
        <div className="flex items-center justify-center">
          <DataTableColumnHeader column={column} title="Versão" />
        </div>
      ),
      enableSorting: true,
      size: 100,
      cell: ({ row }) => (
        <div className="min-h-10 flex items-center justify-center text-sm">
          v{row.getValue('versao')}
        </div>
      ),
    },
    {
      accessorKey: 'arquivo_tamanho',
      header: ({ column }) => (
        <div className="flex items-center justify-center">
          <DataTableColumnHeader column={column} title="Tamanho" />
        </div>
      ),
      enableSorting: true,
      size: 120,
      cell: ({ row }) => {
        const tamanho = (row.original as any).arquivo_tamanho as number; // Ajustado para tipo correto
        return (
          <div className="min-h-10 flex items-center justify-center text-sm">
            {formatFileSize(tamanho)}
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
        const template = row.original;
        return (
          <div className="min-h-10 flex items-center justify-center gap-2">
            <TemplateActions
              template={template}
              onEdit={onEdit}
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

// Componente de ações para cada template
function TemplateActions({
  template,
  onEdit,
  onDuplicate,
  onDelete,
  canEdit,
  canCreate,
  canDelete,
}: {
  template: Template;
  onEdit: (template: Template) => void;
  onDuplicate: (template: Template) => void;
  onDelete: (template: Template) => void;
  canEdit: boolean;
  canCreate: boolean;
  canDelete: boolean;
}) {
  const handleEdit = () => {
    onEdit(template);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
        >
          <MoreHorizontal className="h-4 w-4" />
          <span className="sr-only">Ações do template</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {canEdit && (
          <DropdownMenuItem onClick={handleEdit}>
            <Edit className="mr-2 h-4 w-4" />
            Editar
          </DropdownMenuItem>
        )}
        {canCreate && (
          <DropdownMenuItem onClick={() => onDuplicate(template)}>
            <Copy className="mr-2 h-4 w-4" />
            Duplicar
          </DropdownMenuItem>
        )}
        {canDelete && (
          <DropdownMenuItem onClick={() => onDelete(template)} className="text-destructive">
            <Trash2 className="mr-2 h-4 w-4" />
            Deletar
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default function TemplatesPage() {
  const router = useRouter();
  const [busca, setBusca] = React.useState('');
  const [pagina, setPagina] = React.useState(0);
  const [limite, setLimite] = React.useState(50);
  const [filtros, setFiltros] = React.useState<TemplatesFilters>({});
  const [selectedFilterIds, setSelectedFilterIds] = React.useState<string[]>([]);
  const [createOpen, setCreateOpen] = React.useState(false); // Used only for PDF creation flow
  const [duplicateOpen, setDuplicateOpen] = React.useState(false);
  const [deleteOpen, setDeleteOpen] = React.useState(false);
  const [selectedTemplate, setSelectedTemplate] = React.useState<Template | null>(null);
  const [selectedTemplates, setSelectedTemplates] = React.useState<Template[]>([]);
  const [rowSelection, setRowSelection] = React.useState<Record<string, boolean>>({});

  const { temPermissao } = useMinhasPermissoes('assinatura_digital');
  const canCreate = temPermissao('assinatura_digital', 'criar');
  const canEdit = temPermissao('assinatura_digital', 'editar');
  const canDelete = temPermissao('assinatura_digital', 'deletar');

  // Preparar opções e grupos de filtros
  const filterOptions = React.useMemo(() => buildTemplatesFilterOptions(), []);
  const filterGroups = React.useMemo(() => buildTemplatesFilterGroups(), []);

  // Debounce da busca
  const buscaDebounced = useDebounce(busca, 500);

  // Parâmetros para buscar templates (inclui status para filtro server-side)
  const params = React.useMemo(() => {
    return {
      pagina: pagina + 1, // API usa 1-indexed
      limite,
      busca: buscaDebounced || undefined,
      ativo: filtros.ativo,
      tipo_template: filtros.tipo_template, // Usar tipo_template
    };
  }, [pagina, limite, buscaDebounced, filtros.ativo, filtros.tipo_template]);

  const { templates, total, isLoading, error, refetch } = useTemplates(params);

  // Definir se está buscando (debounced)
  const isSearching = busca !== buscaDebounced && busca.length > 0;

  // Função para atualizar após criação
  const handleCreateSuccess = React.useCallback(() => {
    refetch();
    setCreateOpen(false); // For PDF flow, if still used
  }, [refetch]);

  // Função para atualizar filtros
  const handleFilterIdsChange = React.useCallback((selectedIds: string[]) => {
    setSelectedFilterIds(selectedIds);
    const newFilters = parseTemplatesFilters(selectedIds);
    setFiltros(newFilters);
    setPagina(0);
  }, []);

  // Handlers para ações
  const handleEdit = React.useCallback((template: Template) => {
    if (template.tipo_template === 'markdown') {
      router.push(`/assinatura-digital/templates/${template.id}/edit/markdown`);
    } else {
      router.push(`/assinatura-digital/templates/${template.id}/edit`);
    }
  }, [router]);

  const handleDuplicate = React.useCallback((template: Template) => {
    setSelectedTemplate(template);
    setDuplicateOpen(true);
  }, []);

  const handleDelete = React.useCallback((template: Template) => {
    setSelectedTemplates([template]);
    setDeleteOpen(true);
  }, []);

  const handleBulkDelete = React.useCallback(() => {
    const selected = Object.keys(rowSelection).map(id => templates.find(t => t.id.toString() === id)).filter(Boolean) as Template[];
    setSelectedTemplates(selected);
    setDeleteOpen(true);
  }, [rowSelection, templates]);

  const handleExportCSV = React.useCallback(() => {
    const selected = Object.keys(rowSelection).length > 0
      ? Object.keys(rowSelection).map(id => templates.find(t => t.id.toString() === id)).filter(Boolean) as Template[]
      : templates;

    const csv = [
      ['Nome', 'Descrição', 'Tipo', 'Status', 'Versão', 'Tamanho', 'UUID'].join(','),
      ...selected.map(t => [
        `"${t.nome}"`,
        `"${t.descricao || ''}"`,
        t.tipo_template,
        t.status,
        t.versao,
        t.arquivo_tamanho,
        (t as any).template_uuid, // Ensure template_uuid is present if needed
      ].join(',')),
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'templates.csv';
    a.click();
    URL.revokeObjectURL(url);
  }, [rowSelection, templates]);

  const handleDuplicateSuccess = React.useCallback(() => {
    refetch();
    setDuplicateOpen(false);
    setSelectedTemplate(null);
  }, [refetch]);

  const handleDeleteSuccess = React.useCallback(() => {
    refetch();
    setDeleteOpen(false);
    setSelectedTemplates([]);
    setRowSelection({});
  }, [refetch]);

  const colunas = React.useMemo(() => criarColunas(handleEdit, handleDuplicate, handleDelete, canEdit, canCreate, canDelete), [handleEdit, handleDuplicate, handleDelete, canEdit, canCreate, canDelete]);

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

  const toolbarButtons = React.useMemo(() => {
    const buttons = [];
    if (bulkActions) {
      buttons.push(bulkActions);
    }
    if (canCreate) {
      buttons.push(
        <DropdownMenu key="new-template">
          <DropdownMenuTrigger asChild>
            <Button variant="default">
              <Plus className="mr-2 h-4 w-4" />
              Novo Template
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => router.push('/assinatura-digital/templates/new/pdf')}>
              Template PDF
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => router.push('/assinatura-digital/templates/new/markdown')}>
              Template Markdown
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    }
    return <>{buttons}</>;
  }, [bulkActions, canCreate, router]);

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
          searchPlaceholder="Buscar por nome, UUID ou descrição..."
          filterOptions={filterOptions}
          filterGroups={filterGroups}
          selectedFilters={selectedFilterIds}
          onFiltersChange={handleFilterIdsChange}
          filterButtonsMode="buttons"
          extraButtons={toolbarButtons}
          onNewClick={undefined}
          newButtonTooltip="Novo Template"
        />
      </div>

      {/* Mensagem de erro */}
      {error && (
        <div className="rounded-md bg-destructive/15 p-4 text-sm text-destructive">
          <p className="font-semibold">Erro ao carregar templates:</p>
          <p>{error}</p>
          <Button variant="outline" size="sm" onClick={refetch} className="mt-2">
            Tentar novamente
          </Button>
        </div>
      )}

      {/* Tabela */}
      <DataTable
        data={templates}
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
        emptyMessage="Nenhum template encontrado."
        onRowClick={(row) => handleEdit(row)}
      />

      {/* Dialog para criação de novo template (manter para compatibilidade se houver fluxo PDF direto) */}
      <TemplateCreateDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onSuccess={handleCreateSuccess}
      />

      {/* Dialog para duplicação de template */}
      {selectedTemplate && (
        <TemplateDuplicateDialog
          open={duplicateOpen}
          onOpenChange={setDuplicateOpen}
          template={selectedTemplate}
          onSuccess={handleDuplicateSuccess}
        />
      )}

      {/* Dialog para exclusão de templates */}
      <TemplateDeleteDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        templates={selectedTemplates}
        onSuccess={handleDeleteSuccess}
      />
    </div>
  );
}
