'use client';

/**
 * ContratosTableWrapper - Componente Client que encapsula a tabela de contratos
 *
 * Recebe dados iniciais do Server Component e gerencia:
 * - Estado de busca e filtros
 * - Paginação client-side com refresh via Server Actions
 * - Sheets de criação, edição e visualização
 */

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useDebounce } from '@/app/_lib/hooks/use-debounce';
import { TableToolbar } from '@/components/ui/table-toolbar';
import { ContratosTable } from './contratos-table';
import { ContratoForm } from './contrato-form';
import { ContratoViewSheet } from './contrato-view-sheet';
import type { Contrato, ListarContratosParams } from '@/core/contratos/domain';
import { actionListarContratos } from '@/app/actions/contratos';
import {
  buildContratosFilterOptions,
  buildContratosFilterGroups,
  parseContratosFilters,
} from '@/app/(dashboard)/contratos/components/contratos-toolbar-filters';

// =============================================================================
// TIPOS
// =============================================================================

interface ClienteInfo {
  id: number;
  nome: string;
}

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasMore: boolean;
}

// Tipo importado via parseContratosFilters
import type { ContratosFilters } from '@/app/_lib/types/contratos';

interface ContratosTableWrapperProps {
  initialData: Contrato[];
  initialPagination: PaginationInfo | null;
  clientesOptions: ClienteInfo[];
  partesContrariasOptions: ClienteInfo[];
  usuariosOptions?: ClienteInfo[];
}

// Filtros agora importados de contratos-toolbar-filters.tsx (fonte canônica)

// =============================================================================
// COMPONENTE PRINCIPAL
// =============================================================================

export function ContratosTableWrapper({
  initialData,
  initialPagination,
  clientesOptions,
  partesContrariasOptions,
  usuariosOptions = [],
}: ContratosTableWrapperProps) {
  const router = useRouter();
  const [contratos, setContratos] = React.useState<Contrato[]>(initialData);
  const [paginacao, setPaginacao] = React.useState(initialPagination);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const [busca, setBusca] = React.useState('');
  const [pagina, setPagina] = React.useState(0);
  const [limite, setLimite] = React.useState(50);
  const [filtros, setFiltros] = React.useState<ContratosFilters>({});
  const [selectedFilterIds, setSelectedFilterIds] = React.useState<string[]>([]);
  const [createOpen, setCreateOpen] = React.useState(false);
  const [editOpen, setEditOpen] = React.useState(false);
  const [viewOpen, setViewOpen] = React.useState(false);
  const [contratoSelecionado, setContratoSelecionado] = React.useState<Contrato | null>(null);

  const buscaDebounced = useDebounce(busca, 500);
  const isSearching = busca !== buscaDebounced;

  // Criar mapa de clientes para exibição
  const clientesMap = React.useMemo(() => {
    return new Map(clientesOptions.map(c => [c.id, c]));
  }, [clientesOptions]);

  const partesContrariasMap = React.useMemo(() => {
    return new Map(partesContrariasOptions.map(p => [p.id, p]));
  }, [partesContrariasOptions]);

  // Função para recarregar dados
  const refetch = React.useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const params: ListarContratosParams = {
        pagina: pagina + 1,
        limite,
        busca: buscaDebounced || undefined,
        ...filtros,
      };

      const result = await actionListarContratos(params);

      if (result.success) {
        const data = result.data as { data: Contrato[]; pagination: PaginationInfo };
        setContratos(data.data);
        setPaginacao(data.pagination);
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar contratos');
    } finally {
      setIsLoading(false);
    }
  }, [pagina, limite, buscaDebounced, filtros]);

  // Recarregar quando parâmetros mudam
  React.useEffect(() => {
    if (pagina > 0 || buscaDebounced || Object.keys(filtros).length > 0) {
      refetch();
    }
  }, [pagina, buscaDebounced, filtros, refetch]);

  const handleEdit = React.useCallback((contrato: Contrato) => {
    setContratoSelecionado(contrato);
    setEditOpen(true);
  }, []);

  const handleView = React.useCallback((contrato: Contrato) => {
    setContratoSelecionado(contrato);
    setViewOpen(true);
  }, []);

  const handleEditSuccess = React.useCallback(() => {
    refetch();
    setEditOpen(false);
    setContratoSelecionado(null);
    router.refresh();
  }, [refetch, router]);

  const handleCreateSuccess = React.useCallback(() => {
    refetch();
    setCreateOpen(false);
    router.refresh();
  }, [refetch, router]);

  const filterOptions = React.useMemo(() => buildContratosFilterOptions(), []);
  const filterGroups = React.useMemo(() => buildContratosFilterGroups(), []);

  const handleFilterIdsChange = React.useCallback((ids: string[]) => {
    setSelectedFilterIds(ids);
    const newFilters = parseContratosFilters(ids);
    setFiltros(newFilters);
    setPagina(0);
  }, []);

  // Obter nomes para o sheet de visualização
  const getClienteNome = React.useCallback((clienteId: number) => {
    return clientesMap.get(clienteId)?.nome || `Cliente #${clienteId}`;
  }, [clientesMap]);

  const getParteContrariaNome = React.useCallback((parteContrariaId: number | null) => {
    if (!parteContrariaId) return undefined;
    return partesContrariasMap.get(parteContrariaId)?.nome;
  }, [partesContrariasMap]);

  return (
    <div className="space-y-4">
      <TableToolbar
        searchValue={busca}
        onSearchChange={(value) => {
          setBusca(value);
          setPagina(0);
        }}
        isSearching={isSearching}
        searchPlaceholder="Buscar nas observações..."
        filterOptions={filterOptions}
        filterGroups={filterGroups}
        selectedFilters={selectedFilterIds}
        onFiltersChange={handleFilterIdsChange}
        filterButtonsMode="buttons"
        onNewClick={() => setCreateOpen(true)}
        newButtonTooltip="Novo Contrato"
      />

      <ContratosTable
        contratos={contratos}
        clientesMap={clientesMap}
        partesContrariasMap={partesContrariasMap}
        onEdit={handleEdit}
        onView={handleView}
        isLoading={isLoading}
        error={error}
        pagination={
          paginacao
            ? {
                pageIndex: paginacao.page - 1,
                pageSize: paginacao.limit,
                total: paginacao.total,
                totalPages: paginacao.totalPages,
                onPageChange: setPagina,
                onPageSizeChange: setLimite,
              }
            : undefined
        }
      />

      {/* Sheet de criação */}
      <ContratoForm
        open={createOpen}
        onOpenChange={setCreateOpen}
        mode="create"
        clientesOptions={clientesOptions}
        partesContrariasOptions={partesContrariasOptions}
        usuariosOptions={usuariosOptions}
        onSuccess={handleCreateSuccess}
      />

      {/* Sheet de edição */}
      {contratoSelecionado && (
        <ContratoForm
          open={editOpen}
          onOpenChange={(open) => {
            setEditOpen(open);
            if (!open) setContratoSelecionado(null);
          }}
          mode="edit"
          contrato={contratoSelecionado}
          clientesOptions={clientesOptions}
          partesContrariasOptions={partesContrariasOptions}
          usuariosOptions={usuariosOptions}
          onSuccess={handleEditSuccess}
        />
      )}

      {/* Sheet de visualização */}
      {contratoSelecionado && viewOpen && (
        <ContratoViewSheet
          open={viewOpen}
          onOpenChange={(open) => {
            setViewOpen(open);
            if (!open) setContratoSelecionado(null);
          }}
          contrato={contratoSelecionado}
          clienteNome={getClienteNome(contratoSelecionado.clienteId)}
          parteContrariaNome={getParteContrariaNome(contratoSelecionado.parteContrariaId)}
        />
      )}
    </div>
  );
}
