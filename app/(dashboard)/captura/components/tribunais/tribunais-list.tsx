'use client';

import { useState, useMemo, useCallback } from 'react';
import { DataTable } from '@/components/ui/data-table';
import { TableToolbar } from '@/components/ui/table-toolbar';
import { useDebounce } from '@/app/_lib/hooks/use-debounce';
import { useTribunais } from '@/app/_lib/hooks/use-tribunais';
import { criarColunasTribunais } from './tribunais-columns';
import { TribunaisDialog } from './tribunais-dialog';
import {
  buildTribunaisFilterOptions,
  buildTribunaisFilterGroups,
  parseTribunaisFilters,
} from './tribunais-toolbar-filters';
import type { TribunalConfig } from '@/app/_lib/types/tribunais';

interface TribunaisListProps {
  onNewClick?: () => void;
  newButtonTooltip?: string;
}

/**
 * Componente de listagem de configurações de tribunais
 */
export function TribunaisList({ onNewClick, newButtonTooltip = 'Nova Configuração de Tribunal' }: TribunaisListProps) {
  const {
    tribunais,
    isLoading,
    error,
    refetch,
  } = useTribunais();

  // Estados de busca e filtros
  const [busca, setBusca] = useState('');
  const [selectedFilterIds, setSelectedFilterIds] = useState<string[]>([]);
  
  // Debounce da busca
  const buscaDebounced = useDebounce(busca, 500);
  const isSearching = busca !== buscaDebounced;
  
  // Converter IDs selecionados para filtros
  const filtros = useMemo(() => parseTribunaisFilters(selectedFilterIds), [selectedFilterIds]);

  // Estado do dialog
  const [tribunalDialog, setTribunalDialog] = useState<{
    open: boolean;
    tribunal: TribunalConfig | null;
  }>({
    open: false,
    tribunal: null,
  });

  // Handler para editar tribunal
  const handleEdit = (tribunal: TribunalConfig) => {
    setTribunalDialog({ open: true, tribunal });
  };

  // Filtrar tribunais
  const tribunaisFiltrados = useMemo(() => {
    return tribunais.filter((tribunal) => {
      // Filtro de busca
      if (buscaDebounced) {
        const buscaLower = buscaDebounced.toLowerCase();
        const match =
          tribunal.tribunal_codigo.toLowerCase().includes(buscaLower) ||
          tribunal.tribunal_nome.toLowerCase().includes(buscaLower) ||
          tribunal.url_base.toLowerCase().includes(buscaLower) ||
          tribunal.url_login_seam.toLowerCase().includes(buscaLower) ||
          tribunal.url_api.toLowerCase().includes(buscaLower);

        if (!match) return false;
      }

      // Filtro de código do tribunal
      if (filtros.tribunal_codigo && tribunal.tribunal_codigo !== filtros.tribunal_codigo) {
        return false;
      }

      // Filtro de tipo de acesso
      if (filtros.tipo_acesso && tribunal.tipo_acesso !== filtros.tipo_acesso) {
        return false;
      }

      return true;
    });
  }, [tribunais, buscaDebounced, filtros]);
  
  // Gerar opções de filtro
  const filterOptions = useMemo(() => buildTribunaisFilterOptions(), []);
  const filterGroups = useMemo(() => buildTribunaisFilterGroups(), []);
  
  // Handler para mudança de filtros
  const handleFilterIdsChange = useCallback((newSelectedIds: string[]) => {
    setSelectedFilterIds(newSelectedIds);
  }, []);

  const colunas = criarColunasTribunais({
    onEdit: handleEdit,
  });

  return (
    <>
      <div className="space-y-4">
        {/* Barra de busca e filtros */}
        <TableToolbar
          searchValue={busca}
          onSearchChange={(value) => setBusca(value)}
          isSearching={isSearching}
          searchPlaceholder="Buscar por tribunal, código ou URL..."
          filterOptions={filterOptions}
          filterGroups={filterGroups}
          selectedFilters={selectedFilterIds}
          onFiltersChange={handleFilterIdsChange}
          onNewClick={onNewClick}
          newButtonTooltip={newButtonTooltip}
        />

        {/* Tabela */}
        {error ? (
          <div className="rounded-md border border-destructive bg-destructive/10 p-4 text-center text-destructive">
            <p className="font-medium">Erro ao carregar configurações de tribunais</p>
            <p className="text-sm">{error}</p>
          </div>
        ) : (
          <DataTable
            columns={colunas}
            data={tribunaisFiltrados}
            isLoading={isLoading}
            emptyMessage="Nenhuma configuração de tribunal encontrada"
          />
        )}
      </div>

      {/* Dialog para criar/editar */}
      <TribunaisDialog
        tribunal={tribunalDialog.tribunal}
        open={tribunalDialog.open}
        onOpenChange={(open) => setTribunalDialog({ open, tribunal: null })}
        onSuccess={() => {
          refetch();
          setTribunalDialog({ open: false, tribunal: null });
        }}
      />
    </>
  );
}
