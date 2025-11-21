'use client';

import { useState } from 'react';
import { DataTable } from '@/components/ui/data-table';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { useCredenciais } from '@/app/_lib/hooks/use-credenciais';
import { criarColunasCredenciais } from './credenciais-columns';
import { AdvogadoViewDialog } from './advogado-view-dialog';
import { CredenciaisDialog } from './credenciais-dialog';
import { toast } from 'sonner';
import type { Credencial, CodigoTRT, GrauTRT } from '@/app/_lib/types/credenciais';

interface CredenciaisListProps {
  actionButton?: React.ReactNode;
}

/**
 * Componente de listagem de credenciais
 */
export function CredencialsList({ actionButton }: CredenciaisListProps) {
  const { credenciais, tribunais, graus, isLoading, error, refetch, toggleStatus } =
    useCredenciais();

  // Estados de filtros
  const [busca, setBusca] = useState('');
  const [filtroTribunal, setFiltroTribunal] = useState<string>('todos');
  const [filtroGrau, setFiltroGrau] = useState<string>('todos');
  const [filtroStatus, setFiltroStatus] = useState<string>('todos');

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
  const credenciaisFiltradas = credenciais.filter((credencial) => {
    // Filtro de busca
    if (busca) {
      const buscaLower = busca.toLowerCase();
      const match =
        credencial.advogado_nome.toLowerCase().includes(buscaLower) ||
        credencial.advogado_cpf.includes(busca) ||
        credencial.advogado_oab.toLowerCase().includes(buscaLower);

      if (!match) return false;
    }

    // Filtro de tribunal
    if (filtroTribunal !== 'todos' && credencial.tribunal !== filtroTribunal) {
      return false;
    }

    // Filtro de grau
    if (filtroGrau !== 'todos' && credencial.grau !== filtroGrau) {
      return false;
    }

    // Filtro de status
    if (filtroStatus !== 'todos') {
      const isActive = filtroStatus === 'ativo';
      if (credencial.active !== isActive) {
        return false;
      }
    }

    return true;
  });

  const colunas = criarColunasCredenciais({
    onViewAdvogado: handleViewAdvogado,
    onEdit: handleEdit,
    onToggleStatus: handleToggleStatus,
  });

  return (
    <>
      <div className="space-y-4">
        {/* Cabeçalho e estatísticas */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Total de Credenciais</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{credenciais.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Ativas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {credenciais.filter((c) => c.active).length}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Inativas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-400">
                {credenciais.filter((c) => !c.active).length}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Tribunais</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {new Set(credenciais.map((c) => c.tribunal)).size}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filtros */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-1 gap-2">
            <Input
              placeholder="Buscar por advogado, CPF ou OAB..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="max-w-sm"
            />

            <Select value={filtroTribunal} onValueChange={setFiltroTribunal}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Tribunal" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos TRTs</SelectItem>
                {tribunais.map((tribunal) => (
                  <SelectItem key={tribunal} value={tribunal}>
                    {tribunal}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filtroGrau} onValueChange={setFiltroGrau}>
              <SelectTrigger className="w-[130px]">
                <SelectValue placeholder="Grau" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos Graus</SelectItem>
                <SelectItem value="primeiro_grau">1º Grau</SelectItem>
                <SelectItem value="segundo_grau">2º Grau</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filtroStatus} onValueChange={setFiltroStatus}>
              <SelectTrigger className="w-[130px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                <SelectItem value="ativo">Ativo</SelectItem>
                <SelectItem value="inativo">Inativo</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {actionButton}
        </div>

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
