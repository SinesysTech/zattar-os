'use client';

import { useState, useMemo, useCallback } from 'react';
import { DataTable } from '@/components/ui/data-table';
import { TableToolbar } from '@/components/ui/table-toolbar';
import { useDebounce } from '@/hooks/use-debounce';
import { useTribunais } from '@/app/_lib/hooks/use-tribunais';
import { criarColunasTribunais } from '../components/tribunais/tribunais-columns';
import { TribunaisDialog } from '../components/tribunais/tribunais-dialog';
import {
  buildTribunaisFilterOptions,
  buildTribunaisFilterGroups,
  parseTribunaisFilters,
} from '../components/tribunais/tribunais-toolbar-filters';
import type { TribunalConfig } from '@/types/tribunais';

export default function TribunaisPage() {
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
    <div className="space-y-4">
      <TableToolbar
        searchValue={busca}
        onSearchChange={setBusca}
        isSearching={isSearching}
        searchPlaceholder="Buscar tribunais..."
        filterOptions={filterOptions}
        filterGroups={filterGroups}
        selectedFilters={selectedFilterIds}
        onFiltersChange={handleFilterIdsChange}
        onNewClick={() => setTribunalDialog({ open: true, tribunal: null })}
        newButtonTooltip="Nova Configuração de Tribunal"
        filterButtonsMode="buttons"
      />

      <DataTable
        data={tribunaisFiltrados}
        columns={colunas}
        isLoading={isLoading}
        error={error}
        emptyMessage="Nenhuma configuração de tribunal encontrada."
      />

      <TribunaisDialog
        tribunal={tribunalDialog.tribunal}
        open={tribunalDialog.open}
        onOpenChange={(open) => setTribunalDialog({ ...tribunalDialog, open })}
        onSuccess={() => {
          refetch();
          setTribunalDialog({ open: false, tribunal: null });
        }}
      />
    </div>
  );
}

