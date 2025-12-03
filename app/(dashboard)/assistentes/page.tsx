'use client';

// Página de assistentes - Lista assistentes do sistema

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useDebounce } from '@/app/_lib/hooks/use-debounce';
import { DataTable } from '@/components/ui/data-table';
import { DataTableColumnHeader } from '@/components/ui/data-table-column-header';
import { TableToolbar } from '@/components/ui/table-toolbar';
import { buildAssistentesFilterOptions, buildAssistentesFilterGroups, parseAssistentesFilters } from './components/assistentes-toolbar-filters';
import { Button } from '@/components/ui/button';
import { Eye, Pencil, Trash2, MoreHorizontal } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAssistentes } from '@/app/_lib/hooks/use-assistentes';
import { useMinhasPermissoes } from '@/app/_lib/hooks/use-minhas-permissoes';
import { AssistentesGridView } from './components/assistentes-grid-view';
import { ViewToggle } from './components/view-toggle';
import { AssistenteCreateDialog } from './components/assistente-create-dialog';
import { AssistenteEditDialog } from './components/assistente-edit-dialog';
import { AssistenteDeleteDialog } from './components/assistente-delete-dialog';
import type { ColumnDef } from '@tanstack/react-table';
import type { Assistente, AssistentesFilters, ViewMode } from '@/app/_lib/types/assistentes';
import {
  formatarDataCriacao,
  truncarDescricao,
} from '@/app/_lib/utils/format-assistentes';

const VIEW_MODE_STORAGE_KEY = 'assistentes-view-mode';

/**
 * Define as colunas da tabela de assistentes
 */
function criarColunas(
  onEdit: (assistente: Assistente) => void,
  onDelete: (assistente: Assistente) => void,
  canEdit: boolean,
  canDelete: boolean
): ColumnDef<Assistente>[] {
  return [
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
      cell: ({ row }) => (
        <div className="min-h-10 flex items-center justify-start text-sm">
          {row.getValue('nome')}
        </div>
      ),
    },
    {
      accessorKey: 'descricao',
      header: ({ column }) => (
        <div className="flex items-center justify-start">
          <DataTableColumnHeader column={column} title="Descrição" />
        </div>
      ),
      enableSorting: false,
      size: 300,
      meta: { align: 'left' },
      cell: ({ row }) => (
        <div className="min-h-10 flex items-center justify-start text-sm">
          {truncarDescricao(row.getValue('descricao'), 100)}
        </div>
      ),
    },
    {
      accessorKey: 'created_at',
      header: ({ column }) => (
        <div className="flex items-center justify-center">
          <DataTableColumnHeader column={column} title="Data de Criação" />
        </div>
      ),
      enableSorting: true,
      size: 150,
      cell: ({ row }) => (
        <div className="min-h-10 flex items-center justify-center text-sm">
          {formatarDataCriacao(row.getValue('created_at'))}
        </div>
      ),
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
        const assistente = row.original;
        return (
          <div className="min-h-10 flex items-center justify-center gap-2">
            <AssistenteActions assistente={assistente} onEdit={onEdit} onDelete={onDelete} canEdit={canEdit} canDelete={canDelete} />
          </div>
        );
      },
    },
  ];
}

/**
 * Componente de ações para cada assistente
 */
function AssistenteActions({
  assistente,
  onEdit,
  onDelete,
  canEdit,
  canDelete
}: {
  assistente: Assistente;
  onEdit: (assistente: Assistente) => void;
  onDelete: (assistente: Assistente) => void;
  canEdit: boolean;
  canDelete: boolean;
}) {
  const router = useRouter();

  const handleViewClick = () => {
    router.push(`/assistentes/${assistente.id}`);
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
          <span className="sr-only">Ações do assistente</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={handleViewClick}>
          <Eye className="mr-2 h-4 w-4" />
          Visualizar
        </DropdownMenuItem>
        {canEdit && (
          <DropdownMenuItem onClick={() => onEdit(assistente)}>
            <Pencil className="mr-2 h-4 w-4" />
            Editar
          </DropdownMenuItem>
        )}
        {canDelete && (
          <DropdownMenuItem onClick={() => onDelete(assistente)}>
            <Trash2 className="mr-2 h-4 w-4" />
            Deletar
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default function AssistentesPage() {
  const router = useRouter();
  const [busca, setBusca] = React.useState('');
  const [pagina, setPagina] = React.useState(0);
  const [limite, setLimite] = React.useState(50);
  const [filtros, setFiltros] = React.useState<AssistentesFilters>({ ativo: true }); // Default: apenas ativos
  const [selectedFilterIds, setSelectedFilterIds] = React.useState<string[]>(['ativo_true']); // Default: apenas ativos
  const [viewMode, setViewMode] = React.useState<ViewMode>('table');
  const [createOpen, setCreateOpen] = React.useState(false);
  const [editOpen, setEditOpen] = React.useState(false);
  const [selectedAssistente, setSelectedAssistente] = React.useState<Assistente | null>(null);
  const [deleteOpen, setDeleteOpen] = React.useState(false);

  // Buscar permissões do usuário para o recurso 'assistentes'
  const { temPermissao } = useMinhasPermissoes('assistentes');

  // Permissões granulares
  const canCreate = temPermissao('assistentes', 'criar');
  const canEdit = temPermissao('assistentes', 'editar');
  const canDelete = temPermissao('assistentes', 'deletar');

  // Preparar opções e grupos de filtros
  const filterOptions = React.useMemo(() => buildAssistentesFilterOptions(), []);
  const filterGroups = React.useMemo(() => buildAssistentesFilterGroups(), []);

  // Carregar preferência de visualização do localStorage
  React.useEffect(() => {
    const savedViewMode = localStorage.getItem(
      VIEW_MODE_STORAGE_KEY
    ) as ViewMode | null;
    if (savedViewMode === 'cards' || savedViewMode === 'table') {
      setViewMode(savedViewMode);
    }
  }, []);

  // Salvar preferência de visualização no localStorage
  const handleViewModeChange = React.useCallback((mode: ViewMode) => {
    setViewMode(mode);
    localStorage.setItem(VIEW_MODE_STORAGE_KEY, mode);
  }, []);

  // Debounce da busca
  const buscaDebounced = useDebounce(busca, 500);

  // Parâmetros para buscar assistentes
  // Usar valores primitivos do filtros para evitar recriação desnecessária
  const params = React.useMemo(() => {
    return {
      pagina: pagina + 1, // API usa 1-indexed
      limite,
      busca: buscaDebounced || undefined,
      ativo: filtros.ativo,
    };
  }, [pagina, limite, buscaDebounced, filtros.ativo]);

  const { assistentes, paginacao, isLoading, error, refetch } = useAssistentes(params);

  // Definir se está buscando (debounced)
  const isSearching = busca !== buscaDebounced && busca.length > 0;

  // Função para atualizar após criação de novo assistente
  const refetchRef = React.useRef(refetch);
  React.useEffect(() => {
    refetchRef.current = refetch;
  }, [refetch]);

  const handleCreateSuccess = React.useCallback(() => {
    refetchRef.current();
  }, []);

  const handleFilterIdsChange = React.useCallback((selectedIds: string[]) => {
    setSelectedFilterIds(selectedIds);
    const newFilters = parseAssistentesFilters(selectedIds);
    setFiltros(newFilters);
    setPagina(0);
  }, []);

  const handleView = React.useCallback(
    (assistente: Assistente) => {
      router.push(`/assistentes/${assistente.id}`);
    },
    [router]
  );

  const handleEdit = React.useCallback(
    (assistente: Assistente) => {
      setSelectedAssistente(assistente);
      setEditOpen(true);
    },
    []
  );

  const handleDelete = React.useCallback(
    (assistente: Assistente) => {
      setSelectedAssistente(assistente);
      setDeleteOpen(true);
    },
    []
  );

  const colunas = React.useMemo(() => criarColunas(handleEdit, handleDelete, canEdit, canDelete), [handleEdit, handleDelete, canEdit, canDelete]);

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
          searchPlaceholder="Buscar por nome ou descrição..."
          filterOptions={filterOptions}
          filterGroups={filterGroups}
          selectedFilters={selectedFilterIds}
          onFiltersChange={handleFilterIdsChange}
          filterButtonsMode="buttons"
          onNewClick={canCreate ? () => setCreateOpen(true) : undefined}
          newButtonTooltip="Novo Assistente"
        />
        <ViewToggle viewMode={viewMode} onViewModeChange={handleViewModeChange} />
      </div>

      {/* Mensagem de erro */}
      {error && (
        <div className="rounded-md bg-destructive/15 p-4 text-sm text-destructive">
          <p className="font-semibold">Erro ao carregar assistentes:</p>
          <p>{error}</p>
        </div>
      )}

      {/* Conteúdo baseado na visualização selecionada */}
      {viewMode === 'cards' ? (
        <AssistentesGridView
          assistentes={assistentes}
          paginacao={paginacao}
          onView={handleView}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onPageChange={setPagina}
          onPageSizeChange={setLimite}
          canEdit={canEdit}
          canDelete={canDelete}
        />
      ) : (
        <DataTable
          data={assistentes}
          columns={colunas}
          pagination={
            paginacao
              ? {
                  pageIndex: paginacao.pagina - 1, // Converter para 0-indexed
                  pageSize: paginacao.limite,
                  total: paginacao.total,
                  totalPages: paginacao.totalPaginas,
                  onPageChange: setPagina,
                  onPageSizeChange: setLimite,
                }
              : undefined
          }
          sorting={undefined}
          isLoading={isLoading}
          error={error}
          emptyMessage="Nenhum assistente encontrado."
        />
      )}

      {/* Dialog para criação de novo assistente */}
      <AssistenteCreateDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onSuccess={handleCreateSuccess}
      />

      {/* Dialog para editar assistente */}
      {selectedAssistente && (
        <AssistenteEditDialog
          open={editOpen}
          onOpenChange={setEditOpen}
          assistente={selectedAssistente}
          onSuccess={handleCreateSuccess}
        />
      )}

      {/* Dialog para deletar assistente */}
      <AssistenteDeleteDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        assistente={selectedAssistente}
        onSuccess={handleCreateSuccess}
      />
    </div>
  );
}
