'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Settings, Search } from 'lucide-react';
import { useDebounce } from '@/hooks/use-debounce';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Skeleton } from '@/components/ui/skeleton';
import { DataShell } from '@/components/shared/data-shell';

import {
  useUsuarios,
  UsuarioCreateDialog,
  CargosManagementDialog,
  RedefinirSenhaDialog,
  UsuariosListFilters,
  UsuariosGridView,
  type Usuario,
} from '@/features/usuarios';

// =============================================================================
// COMPONENT
// =============================================================================

export function UsuariosPageContent() {
  const router = useRouter();

  // Search state
  const [busca, setBusca] = React.useState('');

  // Pagination state
  const [pageIndex, setPageIndex] = React.useState(0);
  const [pageSize, setPageSize] = React.useState(20);

  // Filter state
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

  // Reset to page 0 when filters/search change
  React.useEffect(() => {
    setPageIndex(0);
  }, [buscaDebounced, ativoFiltro, ufOabFiltro, possuiOabFiltro]);

  // Build params for API with pagination
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

  return (
    <div className="flex flex-col gap-4">
      <DataShell
        header={
          <div className="flex items-center justify-between gap-4 p-4 border-b">
            <div className="flex items-center gap-2 flex-wrap flex-1">
              {/* Busca */}
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar membro da equipe..."
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  className="h-9 w-[250px] pl-8"
                />
              </div>

              {/* Filtros */}
              <UsuariosListFilters
                ativoFiltro={ativoFiltro}
                onAtivoChange={setAtivoFiltro}
                ufOabFiltro={ufOabFiltro}
                onUfOabChange={setUfOabFiltro}
                possuiOabFiltro={possuiOabFiltro}
                onPossuiOabChange={setPossuiOabFiltro}
              />
            </div>

            <div className="flex items-center gap-2">
              {/* Gerenciar Cargos */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-9 w-9"
                    onClick={() => setCargosManagementOpen(true)}
                    aria-label="Gerenciar Cargos"
                  >
                    <Settings className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Gerenciar Cargos</TooltipContent>
              </Tooltip>

              {/* Novo Membro */}
              <Button
                onClick={() => setCreateOpen(true)}
                className="h-9"
              >
                <Plus className="h-4 w-4 mr-2" />
                Novo Membro
              </Button>
            </div>
          </div>
        }
        // NO footer prop - UsuariosGridView handles pagination internally
      >
        {/* Loading state */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3 p-4">
            {Array.from({ length: 10 }).map((_, i) => (
              <Skeleton key={i} className="h-[200px] rounded-lg" />
            ))}
          </div>
        ) : (
          <UsuariosGridView
            usuarios={usuarios}
            paginacao={paginacao ? {
              pagina: paginacao.pagina,
              limite: paginacao.limite,
              total: paginacao.total,
              totalPaginas: paginacao.totalPaginas,
            } : null}
            onView={handleView}
            onRedefinirSenha={handleRedefinirSenha}
            onPageChange={setPageIndex}
            onPageSizeChange={setPageSize}
          />
        )}
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
    </div>
  );
}
