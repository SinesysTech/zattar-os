'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useDebounce } from '@/hooks/use-debounce';
import {
  DataShell,
  DataPagination,
  DataTableToolbar,
} from '@/components/shared/data-shell';
import { Button } from '@/components/ui/button';
import { Settings } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

import {
  useUsuarios,
  UsuariosGridView,
  UsuarioCreateDialog,
  CargosManagementDialog,
  RedefinirSenhaDialog,
  UsuariosListFilters,
  type Usuario,
} from '@/features/usuarios';

// =============================================================================
// COMPONENT
// =============================================================================

export function UsuariosPageContent() {
  const router = useRouter();

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

  // Dialogs state
  const [createOpen, setCreateOpen] = React.useState(false);
  const [cargosManagementOpen, setCargosManagementOpen] = React.useState(false);
  const [redefinirSenhaOpen, setRedefinirSenhaOpen] = React.useState(false);
  const [usuarioParaRedefinirSenha, setUsuarioParaRedefinirSenha] = React.useState<Usuario | null>(null);

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

  const { usuarios, paginacao, isLoading, refetch } = useUsuarios(params);

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

  // Pagination data
  const total = paginacao?.total ?? 0;
  const totalPages = paginacao?.totalPaginas ?? 0;

  return (
    <>
      <DataShell
        actionButton={{
          label: 'Novo Membro',
          onClick: () => setCreateOpen(true),
        }}
        header={
          <DataTableToolbar
            searchValue={busca}
            onSearchValueChange={(value) => {
              setBusca(value);
              setPageIndex(0);
            }}
            searchPlaceholder="Buscar membro da equipe..."
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
            }
          />
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
      </DataShell>

      {/* Dialog para gerenciar cargos */}
      <CargosManagementDialog
        open={cargosManagementOpen}
        onOpenChange={setCargosManagementOpen}
      />

      {/* Dialog para criacao de novo usuario */}
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
