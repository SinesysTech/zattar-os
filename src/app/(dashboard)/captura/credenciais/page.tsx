'use client';

import { useState, useMemo, useCallback } from 'react';
import { DataTable } from '@/components/ui/data-table';
import { TableToolbar } from '@/components/ui/table-toolbar';
import { useDebounce } from '@/app/_lib/hooks/use-debounce';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useCredenciais } from '@/app/_lib/hooks/use-credenciais';
import { criarColunasCredenciais } from '../components/credenciais/credenciais-columns';
import { AdvogadoViewDialog } from '../components/credenciais/advogado-view-dialog';
import { CredenciaisDialog } from '../components/credenciais/credenciais-dialog';
import {
  buildCredenciaisFilterOptions,
  buildCredenciaisFilterGroups,
  parseCredenciaisFilters,
} from '../components/credenciais/credenciais-toolbar-filters';
import { toast } from 'sonner';
import type { Credencial } from '@/core/app/_lib/types/credenciais';

export default function CredenciaisPage() {
  const { credenciais, isLoading, error, refetch, toggleStatus } = useCredenciais();

  // Estados de busca e filtros
  const [busca, setBusca] = useState('');
  const [selectedFilterIds, setSelectedFilterIds] = useState<string[]>([]);
  
  // Debounce da busca
  const buscaDebounced = useDebounce(busca, 500);
  const isSearching = busca !== buscaDebounced;
  
  // Converter IDs selecionados para filtros
  const filtros = useMemo(() => parseCredenciaisFilters(selectedFilterIds), [selectedFilterIds]);

  // Estados de dialogs
  const [advogadoDialog, setAdvogadoDialog] = useState<{
    open: boolean;
    credencial: Credencial | null;
  }>({
    open: false,
    credencial: null,
  });

  const [credencialDialog, setCredencialDialog] = useState<{
    open: boolean;
    credencial: Credencial | null;
  }>({
    open: false,
    credencial: null,
  });

  const [toggleDialog, setToggleDialog] = useState<{
    open: boolean;
    credencial: Credencial | null;
  }>({
    open: false,
    credencial: null,
  });

  // Handlers
  const handleViewAdvogado = (credencial: Credencial) => {
    setAdvogadoDialog({ open: true, credencial });
  };

  const handleEdit = (credencial: Credencial) => {
    setCredencialDialog({ open: true, credencial });
  };

  const handleToggleStatus = (credencial: Credencial) => {
    setToggleDialog({ open: true, credencial });
  };

  const confirmarToggleStatus = async () => {
    if (!toggleDialog.credencial) return;

    try {
      await toggleStatus(
        toggleDialog.credencial.advogado_id,
        toggleDialog.credencial.id,
        !toggleDialog.credencial.active
      );

      toast.success(
        `Credencial ${toggleDialog.credencial.active ? 'desativada' : 'ativada'} com sucesso!`
      );

      setToggleDialog({ open: false, credencial: null });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao atualizar status');
    }
  };

  // Filtrar credenciais
  const credenciaisFiltradas = useMemo(() => {
    return credenciais.filter((credencial) => {
      // Filtro de busca
      if (buscaDebounced) {
        const buscaLower = buscaDebounced.toLowerCase();
        const match =
          credencial.advogado_nome.toLowerCase().includes(buscaLower) ||
          credencial.advogado_cpf.includes(buscaDebounced) ||
          credencial.advogado_oab.toLowerCase().includes(buscaLower);

        if (!match) return false;
      }

      // Filtro de tribunal
      if (filtros.tribunal && credencial.tribunal !== filtros.tribunal) {
        return false;
      }

      // Filtro de grau
      if (filtros.grau && credencial.grau !== filtros.grau) {
        return false;
      }

      // Filtro de status
      if (filtros.active !== undefined && credencial.active !== filtros.active) {
        return false;
      }

      return true;
    });
  }, [credenciais, buscaDebounced, filtros]);
  
  // Gerar opções de filtro
  const filterOptions = useMemo(() => buildCredenciaisFilterOptions(), []);
  const filterGroups = useMemo(() => buildCredenciaisFilterGroups(), []);
  
  // Handler para mudança de filtros
  const handleFilterIdsChange = useCallback((newSelectedIds: string[]) => {
    setSelectedFilterIds(newSelectedIds);
  }, []);

  const colunas = criarColunasCredenciais({
    onViewAdvogado: handleViewAdvogado,
    onEdit: handleEdit,
    onToggleStatus: handleToggleStatus,
  });

  return (
    <div className="space-y-4">
      <TableToolbar
        searchValue={busca}
        onSearchChange={setBusca}
        isSearching={isSearching}
        searchPlaceholder="Buscar credenciais..."
        filterOptions={filterOptions}
        filterGroups={filterGroups}
        selectedFilters={selectedFilterIds}
        onFiltersChange={handleFilterIdsChange}
        onNewClick={() => setCredencialDialog({ open: true, credencial: null })}
        newButtonTooltip="Nova Credencial"
        filterButtonsMode="buttons"
      />

      <DataTable
        data={credenciaisFiltradas}
        columns={colunas}
        isLoading={isLoading}
        error={error}
        emptyMessage="Nenhuma credencial encontrada."
      />

      {/* Dialogs */}
      <AdvogadoViewDialog
        credencial={advogadoDialog.credencial}
        open={advogadoDialog.open}
        onOpenChange={(open) => setAdvogadoDialog({ ...advogadoDialog, open })}
      />

      <CredenciaisDialog
        credencial={credencialDialog.credencial}
        open={credencialDialog.open}
        onOpenChange={(open) => setCredencialDialog({ ...credencialDialog, open })}
        onSuccess={() => {
          refetch();
          setCredencialDialog({ open: false, credencial: null });
        }}
      />

      <AlertDialog
        open={toggleDialog.open}
        onOpenChange={(open) => setToggleDialog({ ...toggleDialog, open })}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {toggleDialog.credencial?.active ? 'Desativar' : 'Ativar'} credencial?
            </AlertDialogTitle>
            <AlertDialogDescription>
              {toggleDialog.credencial?.active
                ? 'A credencial será desativada e não poderá ser usada para capturas.'
                : 'A credencial será ativada e poderá ser usada para capturas.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmarToggleStatus}>
              {toggleDialog.credencial?.active ? 'Desativar' : 'Ativar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

