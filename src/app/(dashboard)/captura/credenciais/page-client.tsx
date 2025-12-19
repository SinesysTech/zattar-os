'use client';

import * as React from 'react';
import { useState, useMemo, useCallback, useEffect } from 'react';
import type { Table as TanstackTable } from '@tanstack/react-table';
import { DataShell, DataTable, DataTableToolbar } from '@/components/shared/data-shell';
import { PageShell } from '@/components/shared/page-shell';
import { useDebounce } from '@/hooks/use-debounce';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
import { actionAtualizarCredencial } from '@/features/advogados';
import { criarColunasCredenciais } from '../components/credenciais/credenciais-columns';
import { AdvogadoViewDialog } from '../components/credenciais/advogado-view-dialog';
import { CredenciaisDialog } from '../components/credenciais/credenciais-dialog';
import { toast } from 'sonner';
import type { Credencial } from '@/features/captura/types';

export default function CredenciaisPage() {
  const [credenciais, setCredenciais] = useState<Credencial[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Table state for DataTableToolbar
  const [table, setTable] = useState<TanstackTable<Credencial> | null>(null);
  const [density, setDensity] = useState<'compact' | 'standard' | 'relaxed'>('standard');

  const buscarCredenciais = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/captura/credenciais');
      if (!response.ok) {
        throw new Error('Erro ao buscar credenciais');
      }
      const data = await response.json();
      if (!data.success) {
        throw new Error('Erro ao buscar credenciais');
      }
      setCredenciais(data.data.credenciais);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao buscar credenciais';
      setError(errorMessage);
      setCredenciais([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    buscarCredenciais();
  }, [buscarCredenciais]);

  const toggleStatus = useCallback(
    async (advogadoId: number, credencialId: number, active: boolean) => {
      const result = await actionAtualizarCredencial(credencialId, { active });
      if (!result.success) {
        throw new Error(result.error || 'Erro ao atualizar credencial');
      }
      await buscarCredenciais();
    },
    [buscarCredenciais]
  );

  const refetch = buscarCredenciais;

  // Estados de busca e filtros
  const [busca, setBusca] = useState('');
  const [tribunalFilter, setTribunalFilter] = useState<string>('all');
  const [grauFilter, setGrauFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Debounce da busca
  const buscaDebounced = useDebounce(busca, 500);

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
  const handleViewAdvogado = useCallback((credencial: Credencial) => {
    setAdvogadoDialog({ open: true, credencial });
  }, []);

  const handleEdit = useCallback((credencial: Credencial) => {
    setCredencialDialog({ open: true, credencial });
  }, []);

  const handleToggleStatus = useCallback((credencial: Credencial) => {
    setToggleDialog({ open: true, credencial });
  }, []);

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

  // Extrair opções únicas dos dados para filtros
  const tribunaisUnicos = useMemo(() => {
    const tribunais = [...new Set(credenciais.map((c) => c.tribunal))];
    return tribunais.sort();
  }, [credenciais]);

  const grausUnicos = useMemo(() => {
    const graus = [...new Set(credenciais.map((c) => c.grau))];
    return graus.sort();
  }, [credenciais]);

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
      if (tribunalFilter !== 'all' && credencial.tribunal !== tribunalFilter) {
        return false;
      }

      // Filtro de grau
      if (grauFilter !== 'all' && credencial.grau !== grauFilter) {
        return false;
      }

      // Filtro de status
      if (statusFilter !== 'all') {
        const isActive = statusFilter === 'ativo';
        if (credencial.active !== isActive) {
          return false;
        }
      }

      return true;
    });
  }, [credenciais, buscaDebounced, tribunalFilter, grauFilter, statusFilter]);

  const colunas = useMemo(
    () =>
      criarColunasCredenciais({
        onViewAdvogado: handleViewAdvogado,
        onEdit: handleEdit,
        onToggleStatus: handleToggleStatus,
      }),
    [handleViewAdvogado, handleEdit, handleToggleStatus]
  );

  return (
    <PageShell>
      <DataShell
        header={
          table ? (
            <DataTableToolbar
              table={table}
              density={density}
              onDensityChange={setDensity}
              searchValue={busca}
              onSearchValueChange={setBusca}
              searchPlaceholder="Buscar credenciais..."
              actionButton={{
                label: 'Nova Credencial',
                onClick: () => setCredencialDialog({ open: true, credencial: null }),
              }}
              filtersSlot={
                <>
                  <Select value={tribunalFilter} onValueChange={setTribunalFilter}>
                    <SelectTrigger className="h-10 w-[140px]">
                      <SelectValue placeholder="Tribunal" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      {tribunaisUnicos.map((tribunal) => (
                        <SelectItem key={tribunal} value={tribunal}>
                          {tribunal}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select value={grauFilter} onValueChange={setGrauFilter}>
                    <SelectTrigger className="h-10 w-[150px]">
                      <SelectValue placeholder="Grau" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      {grausUnicos.map((grau) => (
                        <SelectItem key={grau} value={grau}>
                          {grau}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="h-10 w-[120px]">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="ativo">Ativas</SelectItem>
                      <SelectItem value="inativo">Inativas</SelectItem>
                    </SelectContent>
                  </Select>
                </>
              }
            />
          ) : (
            <div className="p-6" />
          )
        }
      >
        <div className="relative border-t">
          <DataTable
            data={credenciaisFiltradas}
            columns={colunas}
            isLoading={isLoading}
            error={error}
            density={density}
            emptyMessage="Nenhuma credencial encontrada."
            hideTableBorder={true}
            hidePagination={true}
            onTableReady={(t) => setTable(t as TanstackTable<Credencial>)}
          />
        </div>
      </DataShell>

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
    </PageShell>
  );
}
