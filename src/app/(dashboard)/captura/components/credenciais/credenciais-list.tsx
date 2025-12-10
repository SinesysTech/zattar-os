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
import { criarColunasCredenciais } from './credenciais-columns';
import { AdvogadoViewDialog } from './advogado-view-dialog';
import { CredenciaisDialog } from './credenciais-dialog';
import {
  buildCredenciaisFilterOptions,
  buildCredenciaisFilterGroups,
  parseCredenciaisFilters,
} from './credenciais-toolbar-filters';
import { toast } from 'sonner';
import type { Credencial } from '@/app/_lib/types/credenciais';

interface CredenciaisListProps {
  onNewClick?: () => void;
  newButtonTooltip?: string;
}

/**
 * Componente de listagem de credenciais
 */
export function CredencialsList({ onNewClick, newButtonTooltip = 'Nova Credencial' }: CredenciaisListProps) {
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
    <>
      <div className="space-y-4">
        {/* Barra de busca e filtros */}
        <TableToolbar
          searchValue={busca}
          onSearchChange={(value) => setBusca(value)}
          isSearching={isSearching}
          searchPlaceholder="Buscar por advogado, CPF ou OAB..."
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
            <p className="font-medium">Erro ao carregar credenciais</p>
            <p className="text-sm">{error}</p>
          </div>
        ) : (
          <DataTable
            columns={colunas}
            data={credenciaisFiltradas}
            isLoading={isLoading}
            emptyMessage="Nenhuma credencial encontrada"
          />
        )}
      </div>

      {/* Dialogs */}
      <AdvogadoViewDialog
        credencial={advogadoDialog.credencial}
        open={advogadoDialog.open}
        onOpenChange={(open) => setAdvogadoDialog({ open, credencial: null })}
      />

      <CredenciaisDialog
        credencial={credencialDialog.credencial}
        open={credencialDialog.open}
        onOpenChange={(open) => setCredencialDialog({ open, credencial: null })}
        onSuccess={() => {
          refetch();
          setCredencialDialog({ open: false, credencial: null });
        }}
      />

      <AlertDialog
        open={toggleDialog.open}
        onOpenChange={(open) => setToggleDialog({ open, credencial: null })}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {toggleDialog.credencial?.active ? 'Desativar' : 'Ativar'} Credencial
            </AlertDialogTitle>
            <AlertDialogDescription>
              {toggleDialog.credencial?.active
                ? 'Tem certeza que deseja desativar esta credencial? Ela não será mais utilizada nas capturas automáticas.'
                : 'Tem certeza que deseja ativar esta credencial? Ela voltará a ser utilizada nas capturas automáticas.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmarToggleStatus}>
              Confirmar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
