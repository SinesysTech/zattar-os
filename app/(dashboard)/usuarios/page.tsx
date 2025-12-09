'use client';

// Página de usuários - Lista usuários do sistema

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useDebounce } from '@/app/_lib/hooks/use-debounce';
import { TableToolbar } from '@/components/ui/table-toolbar';
import { TableWithToolbar, type ResponsiveTableColumn } from '@/components/ui/table-with-toolbar';
import { DataTableColumnHeader } from '@/components/ui/data-table-column-header';
import { buildUsuariosFilterOptions, buildUsuariosFilterGroups, parseUsuariosFilters } from './components/usuarios-toolbar-filters';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Eye, Settings, MoreHorizontal, KeyRound } from 'lucide-react';
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
import { useUsuarios } from '@/app/_lib/hooks/use-usuarios';
import { UsuariosGridView } from './components/usuarios-grid-view';
import { ViewToggle } from './components/view-toggle';
import { UsuarioCreateDialog } from './components/usuario-create-dialog';
import { UsuarioEditDialog } from './components/usuario-edit-dialog';
import { CargosManagementDialog } from './components/cargos-management-dialog';
import { RedefinirSenhaDialog } from './components/redefinir-senha-dialog';
import type { Usuario } from '@/backend/usuarios/services/persistence/usuario-persistence.service';
import type { UsuariosFilters, ViewMode } from '@/app/_lib/types/usuarios';
import {
  formatarCpf,
  formatarTelefone,
  formatarOab,
  formatarNomeExibicao,
} from '@/app/_lib/utils/format-usuarios';

const VIEW_MODE_STORAGE_KEY = 'usuarios-view-mode';

/**
 * Define as colunas da tabela de usuários
 */
function criarColunas(
  onRedefinirSenha: (usuario: Usuario) => void
): ResponsiveTableColumn<Usuario>[] {
  return [
    {
      accessorKey: 'nomeExibicao',
      header: ({ column }) => (
        <div className="flex items-center justify-start">
          <DataTableColumnHeader column={column} title="Nome" />
        </div>
      ),
      enableSorting: true,
      size: 250,
      priority: 1,
      sticky: true,
      cardLabel: 'Nome',
      meta: { align: 'left' },
      cell: ({ row }) => (
        <div className="min-h-10 flex items-center justify-start text-sm">
          {formatarNomeExibicao(row.getValue('nomeExibicao'))}
        </div>
      ),
    },
    {
      accessorKey: 'emailCorporativo',
      header: ({ column }) => (
        <div className="flex items-center justify-start">
          <DataTableColumnHeader column={column} title="E-mail Corporativo" />
        </div>
      ),
      enableSorting: true,
      size: 200,
      priority: 2,
      cardLabel: 'E-mail',
      meta: { align: 'left' },
      cell: ({ row }) => (
        <div className="min-h-10 flex items-center justify-start text-sm">
          {row.getValue('emailCorporativo')}
        </div>
      ),
    },
    {
      accessorKey: 'cpf',
      header: () => (
        <div className="flex items-center justify-center">
          <div className="text-sm font-medium">CPF</div>
        </div>
      ),
      enableSorting: false,
      size: 150,
      priority: 5,
      cardLabel: 'CPF',
      cell: ({ row }) => (
        <div className="min-h-10 flex items-center justify-center text-sm">
          {formatarCpf(row.getValue('cpf'))}
        </div>
      ),
    },
    {
      id: 'oab',
      header: () => (
        <div className="flex items-center justify-center">
          <div className="text-sm font-medium">OAB</div>
        </div>
      ),
      enableSorting: false,
      size: 120,
      priority: 6,
      cardLabel: 'OAB',
      cell: ({ row }) => {
        const usuario = row.original;
        return (
          <div className="min-h-10 flex items-center justify-center text-sm">
            {usuario.oab ? formatarOab(usuario.oab, usuario.ufOab) : '-'}
          </div>
        );
      },
    },
    {
      accessorKey: 'telefone',
      header: () => (
        <div className="flex items-center justify-center">
          <div className="text-sm font-medium">Telefone</div>
        </div>
      ),
      enableSorting: false,
      size: 150,
      priority: 4,
      cardLabel: 'Telefone',
      cell: ({ row }) => (
        <div className="min-h-10 flex items-center justify-center text-sm">
          {formatarTelefone(row.getValue('telefone'))}
        </div>
      ),
    },
    {
      accessorKey: 'ativo',
      header: ({ column }) => (
        <div className="flex items-center justify-center">
          <DataTableColumnHeader column={column} title="Status" />
        </div>
      ),
      enableSorting: true,
      size: 100,
      priority: 3,
      cardLabel: 'Status',
      cell: ({ row }) => {
        const ativo = row.getValue('ativo') as boolean;
        return (
          <div className="min-h-10 flex items-center justify-center">
            <Badge variant={ativo ? 'default' : 'outline'}>
              {ativo ? 'Ativo' : 'Inativo'}
            </Badge>
          </div>
        );
      },
    },
    {
      accessorKey: 'isSuperAdmin',
      header: () => (
        <div className="flex items-center justify-center">
          <div className="text-sm font-medium">Tipo</div>
        </div>
      ),
      enableSorting: true,
      size: 120,
      priority: 7,
      cardLabel: 'Tipo',
      cell: ({ row }) => {
        const isSuperAdmin = row.getValue('isSuperAdmin') as boolean;
        if (!isSuperAdmin) return null;
        return (
          <div className="min-h-10 flex items-center justify-center">
            <Badge variant="destructive">
              Super Admin
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
      priority: 8,
      cardLabel: 'Ações',
      cell: ({ row }) => {
        const usuario = row.original;
        return (
          <div className="min-h-10 flex items-center justify-center gap-2">
            <UsuarioActions usuario={usuario} onRedefinirSenha={onRedefinirSenha} />
          </div>
        );
      },
    },
  ];
}

/**
 * Componente de ações para cada usuário
 */
function UsuarioActions({
  usuario,
  onRedefinirSenha
}: {
  usuario: Usuario;
  onRedefinirSenha: (usuario: Usuario) => void;
}) {
  const router = useRouter();

  const handleViewClick = () => {
    router.push(`/usuarios/${usuario.id}`);
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
          <span className="sr-only">Ações do usuário</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={handleViewClick}>
          <Eye className="mr-2 h-4 w-4" />
          Visualizar
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onRedefinirSenha(usuario)}>
          <KeyRound className="mr-2 h-4 w-4" />
          Redefinir Senha
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default function UsuariosPage() {
  const router = useRouter();
  const [busca, setBusca] = React.useState('');
  const [pagina, setPagina] = React.useState(0);
  const [limite, setLimite] = React.useState(50);
  const [filtros, setFiltros] = React.useState<UsuariosFilters>({ ativo: true }); // Default: apenas ativos
  const [selectedFilterIds, setSelectedFilterIds] = React.useState<string[]>(['ativo_true']); // Default: apenas ativos
  const [viewMode, setViewMode] = React.useState<ViewMode>('table');
  const [createOpen, setCreateOpen] = React.useState(false);
  const [editOpen, setEditOpen] = React.useState(false);
  const [selectedUsuario, setSelectedUsuario] = React.useState<Usuario | null>(null);
  const [cargosManagementOpen, setCargosManagementOpen] = React.useState(false);
  const [redefinirSenhaOpen, setRedefinirSenhaOpen] = React.useState(false);
  const [usuarioParaRedefinirSenha, setUsuarioParaRedefinirSenha] = React.useState<Usuario | null>(null);

  // Preparar opções e grupos de filtros
  const filterOptions = React.useMemo(() => buildUsuariosFilterOptions(), []);
  const filterGroups = React.useMemo(() => buildUsuariosFilterGroups(), []);

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

  // Parâmetros para buscar usuários
  // Usar valores primitivos do filtros para evitar recriação desnecessária
  const params = React.useMemo(() => {
    return {
      pagina: pagina + 1, // API usa 1-indexed
      limite,
      busca: buscaDebounced || undefined,
      ativo: filtros.ativo,
      oab: filtros.oab,
      ufOab: filtros.ufOab,
    };
  }, [pagina, limite, buscaDebounced, filtros.ativo, filtros.oab, filtros.ufOab]);

  const { usuarios, paginacao, isLoading, error, refetch } = useUsuarios(params);

  // Definir se está buscando (debounced)
  const isSearching = busca !== buscaDebounced && busca.length > 0;

  // Função para atualizar após criação de novo usuário
  const refetchRef = React.useRef(refetch);
  React.useEffect(() => {
    refetchRef.current = refetch;
  }, [refetch]);

  const handleCreateSuccess = React.useCallback(() => {
    refetchRef.current();
  }, []);

  const handleFilterIdsChange = React.useCallback((selectedIds: string[]) => {
    setSelectedFilterIds(selectedIds);
    const newFilters = parseUsuariosFilters(selectedIds);
    setFiltros(newFilters);
    setPagina(0);
  }, []);

  const handleView = React.useCallback(
    (usuario: Usuario) => {
      router.push(`/usuarios/${usuario.id}`);
    },
    [router]
  );

  const handleEdit = React.useCallback(
    (usuario: Usuario) => {
      setSelectedUsuario(usuario);
      setEditOpen(true);
    },
    []
  );

  const handleRedefinirSenha = React.useCallback(
    (usuario: Usuario) => {
      setUsuarioParaRedefinirSenha(usuario);
      setRedefinirSenhaOpen(true);
    },
    []
  );

  const handleRedefinirSenhaSuccess = React.useCallback(() => {
    // Senha redefinida com sucesso
    // Não precisa refetch pois não afeta dados exibidos na listagem
  }, []);

  const colunas = React.useMemo(() => criarColunas(handleRedefinirSenha), [handleRedefinirSenha]);

  return (
    <div className="space-y-3">
      {viewMode === 'table' ? (
        // Modo Table: Usa TableWithToolbar (unificado com fundo branco)
        <TableWithToolbar
          data={usuarios}
          columns={colunas}
          searchValue={busca}
          onSearchChange={(value) => {
            setBusca(value);
            setPagina(0);
          }}
          isSearching={isSearching}
          searchPlaceholder="Buscar por nome, CPF ou e-mail..."
          filterOptions={filterOptions}
          filterGroups={filterGroups}
          selectedFilters={selectedFilterIds}
          onFiltersChange={handleFilterIdsChange}
          filterButtonsMode="buttons"
          extraButtons={
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setCargosManagementOpen(true)}
                  aria-label="Gerenciar Cargos"
                >
                  <Settings className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                Gerenciar Cargos
              </TooltipContent>
            </Tooltip>
          }
          viewToggle={
            <ViewToggle viewMode={viewMode} onViewModeChange={handleViewModeChange} />
          }
          onNewClick={() => setCreateOpen(true)}
          newButtonTooltip="Novo Usuário"
          pagination={
            paginacao
              ? {
                pageIndex: paginacao.pagina - 1,
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
          mobileLayout="cards"
          stickyFirstColumn={true}
          emptyMessage="Nenhum usuário encontrado."
          rowActions={[
            {
              label: 'Visualizar',
              icon: <Eye className="h-4 w-4" />,
              onClick: handleView,
            },
            {
              label: 'Redefinir Senha',
              icon: <KeyRound className="h-4 w-4" />,
              onClick: handleRedefinirSenha,
            },
          ]}
        />
      ) : (
        // Modo Cards: Toolbar separada (sem fundo branco) + GridView
        <>
          <TableToolbar
            searchValue={busca}
            onSearchChange={(value) => {
              setBusca(value);
              setPagina(0);
            }}
            isSearching={isSearching}
            searchPlaceholder="Buscar por nome, CPF ou e-mail..."
            filterOptions={filterOptions}
            filterGroups={filterGroups}
            selectedFilters={selectedFilterIds}
            onFiltersChange={handleFilterIdsChange}
            filterButtonsMode="buttons"
            extraButtons={
              <>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setCargosManagementOpen(true)}
                      aria-label="Gerenciar Cargos"
                    >
                      <Settings className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    Gerenciar Cargos
                  </TooltipContent>
                </Tooltip>
                <ViewToggle viewMode={viewMode} onViewModeChange={handleViewModeChange} />
              </>
            }
            onNewClick={() => setCreateOpen(true)}
            newButtonTooltip="Novo Usuário"
            className="border-0 bg-transparent p-0"
          />
          <UsuariosGridView
            usuarios={usuarios}
            paginacao={paginacao}
            onView={handleView}
            onEdit={handleEdit}
            onRedefinirSenha={handleRedefinirSenha}
            onPageChange={setPagina}
            onPageSizeChange={setLimite}
          />
        </>
      )}

      {/* Dialog para gerenciar cargos */}
      <CargosManagementDialog
        open={cargosManagementOpen}
        onOpenChange={setCargosManagementOpen}
      />

      {/* Dialog para editar usuário */}
      {selectedUsuario && (
        <UsuarioEditDialog
          open={editOpen}
          onOpenChange={setEditOpen}
          usuario={selectedUsuario}
          onSuccess={handleCreateSuccess}
        />
      )}

      {/* Dialog para criação de novo usuário */}
      <UsuarioCreateDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onSuccess={handleCreateSuccess}
      />

      {/* Dialog para redefinir senha */}
      <RedefinirSenhaDialog
        open={redefinirSenhaOpen}
        onOpenChange={setRedefinirSenhaOpen}
        usuario={usuarioParaRedefinirSenha}
        onSuccess={handleRedefinirSenhaSuccess}
      />
    </div>
  );
}
