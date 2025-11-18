'use client';

// Página de usuários - Lista usuários do sistema

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useDebounce } from '@/hooks/use-debounce';
import { DataTable } from '@/components/data-table';
import { DataTableColumnHeader } from '@/components/data-table-column-header';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Eye, Pencil, Plus } from 'lucide-react';
import { useUsuarios } from '@/lib/hooks/use-usuarios';
import { UsuariosGridView } from '@/components/usuarios/usuarios-grid-view';
import { ViewToggle } from '@/components/usuarios/view-toggle';
import { UsuariosFiltrosAvancados } from '@/components/usuarios/usuarios-filtros-avancados';
import { UsuarioCreateSheet } from '@/components/usuarios/usuario-create-sheet';
import { UsuarioViewSheet } from '@/components/usuarios/usuario-view-sheet';
import { UsuarioEditSheet } from '@/components/usuarios/usuario-edit-sheet';
import type { ColumnDef } from '@tanstack/react-table';
import type { Usuario } from '@/backend/usuarios/services/persistence/usuario-persistence.service';
import type { UsuariosFilters, ViewMode } from '@/lib/types/usuarios';
import {
  formatarCpf,
  formatarTelefone,
  formatarOab,
  formatarNomeExibicao,
} from '@/lib/utils/format-usuarios';

const VIEW_MODE_STORAGE_KEY = 'usuarios-view-mode';

/**
 * Define as colunas da tabela de usuários
 */
function criarColunas(onEditSuccess: () => void): ColumnDef<Usuario>[] {
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
      cell: ({ row }) => {
        const ativo = row.getValue('ativo') as boolean;
        return (
          <div className="min-h-10 flex items-center justify-center">
            <Badge variant={ativo ? 'default' : 'secondary'}>
              {ativo ? 'Ativo' : 'Inativo'}
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
        const usuario = row.original;
        return (
          <div className="min-h-10 flex items-center justify-center gap-2">
            <UsuarioActions
              usuario={usuario}
              onEditSuccess={onEditSuccess}
            />
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
  onEditSuccess,
}: {
  usuario: Usuario;
  onEditSuccess: () => void;
}) {
  const router = useRouter();

  const handleViewClick = () => {
    router.push(`/usuarios/${usuario.id}`);
  };

  const handleEditClick = () => {
    router.push(`/usuarios/${usuario.id}`);
  };

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        onClick={handleViewClick}
      >
        <Eye className="h-4 w-4" />
        <span className="sr-only">Visualizar usuário</span>
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        onClick={handleEditClick}
      >
        <Pencil className="h-4 w-4" />
        <span className="sr-only">Editar usuário</span>
      </Button>
    </>
  );
}

export default function UsuariosPage() {
  const [busca, setBusca] = React.useState('');
  const [pagina, setPagina] = React.useState(0);
  const [limite, setLimite] = React.useState(50);
  const [filtros, setFiltros] = React.useState<UsuariosFilters>({});
  const [viewMode, setViewMode] = React.useState<ViewMode>('table');
  const [selectedUsuario, setSelectedUsuario] = React.useState<Usuario | null>(
    null
  );
  const [viewOpen, setViewOpen] = React.useState(false);
  const [editOpen, setEditOpen] = React.useState(false);
  const [createOpen, setCreateOpen] = React.useState(false);

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

  // Função para atualizar após edição
  // Usar ref para evitar dependência de refetch que pode mudar
  const refetchRef = React.useRef(refetch);
  React.useEffect(() => {
    refetchRef.current = refetch;
  }, [refetch]);

  const handleEditSuccess = React.useCallback(() => {
    refetchRef.current();
  }, []);

  const colunas = React.useMemo(
    () => criarColunas(handleEditSuccess),
    [handleEditSuccess]
  );

  const handleFiltersChange = React.useCallback(
    (newFilters: UsuariosFilters) => {
      setFiltros(newFilters);
      setPagina(0); // Resetar para primeira página ao aplicar filtros
    },
    []
  );

  const handleFiltersReset = React.useCallback(() => {
    setFiltros({});
    setPagina(0);
  }, []);

  const handleView = React.useCallback((usuario: Usuario) => {
    setSelectedUsuario(usuario);
    setViewOpen(true);
  }, []);

  const handleEdit = React.useCallback((usuario: Usuario) => {
    setSelectedUsuario(usuario);
    setEditOpen(true);
  }, []);

  return (
    <div className="space-y-4">
      {/* Barra de busca, filtros e alternância de visualização */}
      <div className="flex items-center gap-4 justify-between">
        <div className="flex items-center gap-2">
          <Input
            placeholder="Buscar por nome, CPF ou e-mail..."
            value={busca}
            onChange={(e) => {
              setBusca(e.target.value);
              setPagina(0); // Resetar para primeira página ao buscar
            }}
            className="max-w-sm"
          />
          <UsuariosFiltrosAvancados
            filters={filtros}
            onFiltersChange={handleFiltersChange}
            onReset={handleFiltersReset}
          />
          <ViewToggle viewMode={viewMode} onViewModeChange={handleViewModeChange} />
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Novo Usuário
        </Button>
      </div>

      {/* Mensagem de erro */}
      {error && (
        <div className="rounded-md bg-destructive/15 p-4 text-sm text-destructive">
          <p className="font-semibold">Erro ao carregar usuários:</p>
          <p>{error}</p>
        </div>
      )}

      {/* Conteúdo baseado na visualização selecionada */}
      {viewMode === 'cards' ? (
        <UsuariosGridView
          usuarios={usuarios}
          paginacao={paginacao}
          onView={handleView}
          onEdit={handleEdit}
          onPageChange={setPagina}
          onPageSizeChange={setLimite}
        />
      ) : (
        <DataTable
          data={usuarios}
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
          emptyMessage="Nenhum usuário encontrado."
        />
      )}

      {/* Sheets para visualização, edição e criação */}
      <UsuarioViewSheet
        open={viewOpen}
        onOpenChange={setViewOpen}
        usuario={selectedUsuario}
      />
      <UsuarioEditSheet
        open={editOpen}
        onOpenChange={setEditOpen}
        usuario={selectedUsuario}
        onSuccess={handleEditSuccess}
      />
      <UsuarioCreateSheet
        open={createOpen}
        onOpenChange={setCreateOpen}
        onSuccess={handleEditSuccess}
      />
    </div>
  );
}

