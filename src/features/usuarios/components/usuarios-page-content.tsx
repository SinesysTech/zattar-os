'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import type { Table as TanstackTable, ColumnDef } from '@tanstack/react-table';
import { useDebounce } from '@/hooks/use-debounce';
import {
  DataShell,
  DataPagination,
  DataTable,
  DataTableToolbar,
} from '@/components/shared/data-shell';
import { DataTableColumnHeader } from '@/components/shared/data-shell/data-table-column-header';
import { Button } from '@/components/ui/button';
import { Eye, Settings, KeyRound, ShieldAlert } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

import {
  useUsuarios,
  UsuariosGridView,
  ViewToggle,
  UsuarioCreateDialog,
  CargosManagementDialog,
  RedefinirSenhaDialog,
  UsuariosListFilters,
  formatarCpf,
  formatarTelefone,
  formatarOab,
  type Usuario,
  type ViewMode,
} from '@/features/usuarios';

const VIEW_MODE_STORAGE_KEY = 'usuarios-view-mode';

// =============================================================================
// COLUMNS
// =============================================================================

function criarColunas(
  onRedefinirSenha: (usuario: Usuario) => void,
  router: ReturnType<typeof useRouter>
): ColumnDef<Usuario>[] {
  return [
    {
      accessorKey: 'nomeCompleto',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Nome" />
      ),
      enableSorting: true,
      size: 250,
      meta: {
        align: 'left' as const,
        headerLabel: 'Nome',
      },
      cell: ({ row }) => {
        const usuario = row.original;
        const isSuperAdmin = usuario.isSuperAdmin;
        return (
          <div className="min-h-10 flex items-center justify-start gap-2 text-sm">
            <span>{usuario.nomeCompleto}</span>
            {isSuperAdmin && (
              <ShieldAlert className="h-4 w-4 text-destructive" />
            )}
          </div>
        );
      },
    },
    {
      accessorKey: 'emailCorporativo',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="E-mail Corporativo" />
      ),
      enableSorting: true,
      size: 250,
      meta: {
        align: 'left' as const,
        headerLabel: 'E-mail Corporativo',
      },
      cell: ({ row }) => (
        <div className="min-h-10 flex items-center justify-start text-sm">
          {row.getValue('emailCorporativo')}
        </div>
      ),
    },
    {
      accessorKey: 'cpf',
      header: () => <div className="text-sm font-medium">CPF</div>,
      enableSorting: false,
      size: 150,
      meta: {
        align: 'center' as const,
        headerLabel: 'CPF',
      },
      cell: ({ row }) => (
        <div className="min-h-10 flex items-center justify-center text-sm">
          {formatarCpf(row.getValue('cpf'))}
        </div>
      ),
    },
    {
      id: 'oab',
      header: () => <div className="text-sm font-medium">OAB</div>,
      enableSorting: false,
      size: 120,
      meta: {
        align: 'center' as const,
        headerLabel: 'OAB',
      },
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
      header: () => <div className="text-sm font-medium">Telefone</div>,
      enableSorting: false,
      size: 150,
      meta: {
        align: 'center' as const,
        headerLabel: 'Telefone',
      },
      cell: ({ row }) => (
        <div className="min-h-10 flex items-center justify-center text-sm">
          {formatarTelefone(row.getValue('telefone'))}
        </div>
      ),
    },
    {
      id: 'acoes',
      header: () => <div className="text-sm font-medium">Ações</div>,
      enableSorting: false,
      size: 100,
      meta: {
        align: 'center' as const,
        headerLabel: 'Ações',
      },
      cell: ({ row }) => {
        const usuario = row.original;
        return (
          <div className="min-h-10 flex items-center justify-center gap-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={(e) => {
                    e.stopPropagation();
                    router.push(`/usuarios/${usuario.id}`);
                  }}
                >
                  <Eye className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Visualizar</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={(e) => {
                    e.stopPropagation();
                    onRedefinirSenha(usuario);
                  }}
                >
                  <KeyRound className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Redefinir Senha</TooltipContent>
            </Tooltip>
          </div>
        );
      },
    },
  ];
}

// =============================================================================
// COMPONENT
// =============================================================================

export function UsuariosPageContent() {
  const router = useRouter();

  // Data/Table state
  const [table, setTable] = React.useState<TanstackTable<Usuario> | null>(null);
  const [density, setDensity] = React.useState<'compact' | 'standard' | 'relaxed'>('standard');

  // Search/Pagination state
  const [busca, setBusca] = React.useState('');
  const [pageIndex, setPageIndex] = React.useState(0);
  const [pageSize, setPageSize] = React.useState(50);

  // Filter state (simplified from filterIds)
  const [ativoFiltro, setAtivoFiltro] = React.useState<boolean | 'todos'>(true);
  const [ufOabFiltro, setUfOabFiltro] = React.useState<
    'AC' | 'AL' | 'AP' | 'AM' | 'BA' | 'CE' | 'DF' | 'ES' | 'GO' | 'MA' |
    'MT' | 'MS' | 'MG' | 'PA' | 'PB' | 'PR' | 'PE' | 'PI' | 'RJ' | 'RN' |
    'RS' | 'RO' | 'RR' | 'SC' | 'SP' | 'SE' | 'TO' | 'todos'
  >('todos');
  const [possuiOabFiltro, setPossuiOabFiltro] = React.useState<boolean | 'todos'>('todos');

  // View mode state
  const [viewMode, setViewMode] = React.useState<ViewMode>('table');

  // Dialogs state
  const [createOpen, setCreateOpen] = React.useState(false);
  const [cargosManagementOpen, setCargosManagementOpen] = React.useState(false);
  const [redefinirSenhaOpen, setRedefinirSenhaOpen] = React.useState(false);
  const [usuarioParaRedefinirSenha, setUsuarioParaRedefinirSenha] = React.useState<Usuario | null>(null);

  // Load view mode preference
  React.useEffect(() => {
    const savedViewMode = localStorage.getItem(VIEW_MODE_STORAGE_KEY) as ViewMode | null;
    if (savedViewMode === 'cards' || savedViewMode === 'table') {
      setViewMode(savedViewMode);
    }
  }, []);

  // Save view mode preference
  const handleViewModeChange = React.useCallback((mode: ViewMode) => {
    setViewMode(mode);
    localStorage.setItem(VIEW_MODE_STORAGE_KEY, mode);
  }, []);

  // Debounce search
  const buscaDebounced = useDebounce(busca, 500);

  // Build params for API
  const params = React.useMemo(() => ({
    pagina: pageIndex + 1,
    limite: pageSize,
    busca: buscaDebounced || undefined,
    ativo: ativoFiltro === 'todos' ? undefined : ativoFiltro,
    ufOab: ufOabFiltro === 'todos' ? undefined : ufOabFiltro,
    oab: possuiOabFiltro === 'todos' ? undefined : possuiOabFiltro,
  }), [pageIndex, pageSize, buscaDebounced, ativoFiltro, ufOabFiltro, possuiOabFiltro]);

  const { usuarios, paginacao, isLoading, error, refetch } = useUsuarios(params);

  // Handlers
  const refetchRef = React.useRef(refetch);
  React.useEffect(() => {
    refetchRef.current = refetch;
  }, [refetch]);

  const handleCreateSuccess = React.useCallback(() => {
    refetchRef.current();
  }, []);

  const handleView = React.useCallback(
    (usuario: Usuario) => {
      router.push(`/usuarios/${usuario.id}`);
    },
    [router]
  );

  const handleRedefinirSenha = React.useCallback((usuario: Usuario) => {
    setUsuarioParaRedefinirSenha(usuario);
    setRedefinirSenhaOpen(true);
  }, []);

  const handleRedefinirSenhaSuccess = React.useCallback(() => {
    // Password reset success - no need to refetch since it doesn't affect displayed data
  }, []);

  const handleRowClick = React.useCallback((row: Usuario) => {
    router.push(`/usuarios/${row.id}`);
  }, [router]);

  // Columns
  const colunas = React.useMemo(
    () => criarColunas(handleRedefinirSenha, router),
    [handleRedefinirSenha, router]
  );

  // Pagination data
  const total = paginacao?.total ?? 0;
  const totalPages = paginacao?.totalPaginas ?? 0;

  return (
    <>
      <DataShell
        actionButton={{
          label: 'Novo Usuário',
          onClick: () => setCreateOpen(true),
        }}
        header={
          table ? (
            <DataTableToolbar
              table={table}
              density={density}
              onDensityChange={setDensity}
              searchValue={busca}
              onSearchValueChange={(value) => {
                setBusca(value);
                setPageIndex(0);
              }}
              searchPlaceholder="Buscar por nome, CPF ou e-mail..."
              filtersSlot={
                <UsuariosListFilters
                  ativoFiltro={ativoFiltro}
                  onAtivoChange={(v) => {
                    setAtivoFiltro(v);
                    setPageIndex(0);
                  }}
                  ufOabFiltro={ufOabFiltro}
                  onUfOabChange={(v) => {
                    setUfOabFiltro(v);
                    setPageIndex(0);
                  }}
                  possuiOabFiltro={possuiOabFiltro}
                  onPossuiOabChange={(v) => {
                    setPossuiOabFiltro(v);
                    setPageIndex(0);
                  }}
                />
              }
              actionSlot={
                <>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-10 w-10"
                        onClick={() => setCargosManagementOpen(true)}
                        aria-label="Gerenciar Cargos"
                      >
                        <Settings className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Gerenciar Cargos</TooltipContent>
                  </Tooltip>
                  <ViewToggle viewMode={viewMode} onViewModeChange={handleViewModeChange} />
                </>
              }
            />
          ) : (
            <div className="p-6" />
          )
        }
        footer={
          totalPages > 0 ? (
            <DataPagination
              pageIndex={pageIndex}
              pageSize={pageSize}
              total={total}
              totalPages={totalPages}
              onPageChange={setPageIndex}
              onPageSizeChange={setPageSize}
              isLoading={isLoading}
            />
          ) : null
        }
      >
        {viewMode === 'table' ? (
          <div className="relative border-t">
            <DataTable
              columns={colunas}
              data={usuarios}
              isLoading={isLoading}
              error={error}
              density={density}
              onTableReady={(t) => setTable(t as TanstackTable<Usuario>)}
              onRowClick={handleRowClick}
              hideTableBorder={true}
              emptyMessage="Nenhum usuário encontrado."
              pagination={{
                pageIndex,
                pageSize,
                total,
                totalPages,
                onPageChange: setPageIndex,
                onPageSizeChange: setPageSize,
              }}
            />
          </div>
        ) : (
          <div className="p-4">
            <UsuariosGridView
              usuarios={usuarios}
              paginacao={paginacao}
              onView={handleView}
              onRedefinirSenha={handleRedefinirSenha}
              onPageChange={setPageIndex}
              onPageSizeChange={setPageSize}
            />
          </div>
        )}
      </DataShell>

      {/* Dialog para gerenciar cargos */}
      <CargosManagementDialog
        open={cargosManagementOpen}
        onOpenChange={setCargosManagementOpen}
      />

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
    </>
  );
}
