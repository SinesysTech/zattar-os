'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Search, SlidersHorizontal } from 'lucide-react';
import { useDebounce } from '@/hooks/use-debounce';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Skeleton } from '@/components/ui/skeleton';
import { ClientOnly } from '@/components/shared/client-only';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

import {
  useUsuarios,
  UsuarioCreateDialog,
  CargosManagementDialog,
  RedefinirSenhaDialog,
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

  // Filter state
  const [ativoFiltro, setAtivoFiltro] = React.useState<boolean>(true);

  // Dialogs state
  const [createOpen, setCreateOpen] = React.useState(false);
  const [cargosManagementOpen, setCargosManagementOpen] = React.useState(false);
  const [redefinirSenhaOpen, setRedefinirSenhaOpen] = React.useState(false);
  const [usuarioParaRedefinirSenha, setUsuarioParaRedefinirSenha] = React.useState<Usuario | null>(null);

  // Debounce search
  const buscaDebounced = useDebounce(busca, 500);

  // Build params for API - fetch all users (no pagination, handled by hook)
  const params = React.useMemo(() => ({
    busca: buscaDebounced || undefined,
    ativo: ativoFiltro,
  }), [buscaDebounced, ativoFiltro]);

  const { usuarios, isLoading, refetch } = useUsuarios(params);

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
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 flex-wrap flex-1">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar membro da equipe..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="h-9 w-[300px] pl-8 bg-white dark:bg-gray-950"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Menu (Gerenciar Cargos + Status) */}
          <ClientOnly
            fallback={<Skeleton className="h-9 w-9 rounded-md bg-white dark:bg-gray-950" />}
          >
            <DropdownMenu>
              <Tooltip>
                <TooltipTrigger asChild>
                  <DropdownMenuTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="h-9 w-9 bg-white dark:bg-gray-950"
                      aria-label="Opções de cargos e filtros"
                    >
                      <SlidersHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                </TooltipTrigger>
                <TooltipContent>Opções</TooltipContent>
              </Tooltip>

              <DropdownMenuContent align="end" className="min-w-56">
                <DropdownMenuItem
                  onSelect={(e) => {
                    e.preventDefault();
                    setCargosManagementOpen(true);
                  }}
                >
                  Gerenciar cargos
                </DropdownMenuItem>

                <DropdownMenuSeparator />

                <DropdownMenuSub>
                  <DropdownMenuSubTrigger>
                    Status
                  </DropdownMenuSubTrigger>
                  <DropdownMenuSubContent className="min-w-44">
                    <DropdownMenuLabel>Status</DropdownMenuLabel>
                    <DropdownMenuRadioGroup
                      value={ativoFiltro ? 'true' : 'false'}
                      onValueChange={(value) => setAtivoFiltro(value === 'true')}
                    >
                      <DropdownMenuRadioItem value="true">
                        Ativos
                      </DropdownMenuRadioItem>
                      <DropdownMenuRadioItem value="false">
                        Inativos
                      </DropdownMenuRadioItem>
                    </DropdownMenuRadioGroup>
                  </DropdownMenuSubContent>
                </DropdownMenuSub>
              </DropdownMenuContent>
            </DropdownMenu>
          </ClientOnly>

          {/* Novo Membro (somente ícone) */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                onClick={() => setCreateOpen(true)}
                size="icon"
                className="h-9 w-9"
                aria-label="Novo Membro"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Novo membro</TooltipContent>
          </Tooltip>
        </div>
      </div>

      {/* Grid de Cards */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3">
          {Array.from({ length: 10 }).map((_, i) => (
            <Skeleton key={i} className="h-[200px] rounded-lg" />
          ))}
        </div>
      ) : (
        <UsuariosGridView
          usuarios={usuarios}
          onView={handleView}
          onRedefinirSenha={handleRedefinirSenha}
        />
      )}

      {/* Dialogs */}
      <CargosManagementDialog
        open={cargosManagementOpen}
        onOpenChange={setCargosManagementOpen}
      />
      <UsuarioCreateDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onSuccess={handleCreateSuccess}
      />
      <RedefinirSenhaDialog
        open={redefinirSenhaOpen}
        onOpenChange={setRedefinirSenhaOpen}
        usuario={usuarioParaRedefinirSenha}
        onSuccess={handleRedefinirSenhaSuccess}
      />
    </div>
  );
}
