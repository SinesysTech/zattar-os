'use client';

import { useState, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { TableToolbar } from '@/components/ui/table-toolbar';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { ImportarExtratoDialog } from './components/importar-extrato-dialog';
import { ConciliarManualDialog } from './components/conciliar-manual-dialog';
import { TransacoesImportadasTable } from './components/transacoes-importadas-table';
import { AlertasConciliacao } from './components/alertas-conciliacao';
import { ExportButton } from '@/components/financeiro/export-button';
import { useDebounce } from '@/app/_lib/hooks/use-debounce';
import { useContasBancarias } from '@/app/_lib/hooks/use-contas-bancarias';
import {
  useTransacoesImportadas,
  conciliarAutomaticamente as conciliarAutomaticamenteMutation,
  conciliarManual,
  desconciliar,
} from '@/app/_lib/hooks/use-conciliacao-bancaria';
import {
  buildConciliacaoFilterOptions,
  buildConciliacaoFilterGroups,
  parseConciliacaoFilters,
} from './components/conciliacao-toolbar-filters';
import type { TransacaoComConciliacao } from '@/backend/types/financeiro/conciliacao-bancaria.types';

export default function ConciliacaoBancariaPage() {
  const [importarOpen, setImportarOpen] = useState(false);
  const [conciliarOpen, setConciliarOpen] = useState(false);
  const [busca, setBusca] = useState('');
  const [selectedFilterIds, setSelectedFilterIds] = useState<string[]>([]);
  const [selectedTransacao, setSelectedTransacao] = useState<TransacaoComConciliacao | null>(null);
  const [autoDialogOpen, setAutoDialogOpen] = useState(false);
  const router = useRouter();

  const buscaDebounced = useDebounce(busca, 400);
  const { contasBancarias } = useContasBancarias();

  const filtersParsed = useMemo(
    () => ({
      ...parseConciliacaoFilters(selectedFilterIds),
      busca: buscaDebounced || undefined,
      pagina: 1,
      limite: 50,
    }),
    [selectedFilterIds, buscaDebounced]
  );

  const { transacoes, resumo, isLoading, error, refetch } = useTransacoesImportadas(filtersParsed);

  const filterOptions = useMemo(
    () => buildConciliacaoFilterOptions(contasBancarias || []),
    [contasBancarias]
  );
  const filterGroups = useMemo(
    () => buildConciliacaoFilterGroups(contasBancarias || []),
    [contasBancarias]
  );

  const handleConciliar = useCallback((transacao: TransacaoComConciliacao) => {
    setSelectedTransacao(transacao);
    setConciliarOpen(true);
  }, []);

  const handleIgnorar = useCallback(async (transacao: TransacaoComConciliacao) => {
    try {
      await conciliarManual({ transacaoImportadaId: transacao.id, lancamentoFinanceiroId: null });
      toast.success('Transa\u00e7\u00e3o marcada como ignorada');
      refetch();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao ignorar transa\u00e7\u00e3o');
    }
  }, [refetch]);

  const handleDesconciliar = useCallback(async (transacao: TransacaoComConciliacao) => {
    try {
      await desconciliar(transacao.id);
      toast.success('Transa\u00e7\u00e3o desconciliada');
      refetch();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao desconciliar');
    }
  }, [refetch]);

  const handleConciliarAutomaticamente = async () => {
    try {
      const resultados = await conciliarAutomaticamenteMutation({});
      const totalConciliadas = resultados.filter((r) => r.conciliada).length;
      toast.success(`Concilia\u00e7\u00e3o autom\u00e1tica conclu\u00edda (${totalConciliadas} conciliadas)`);
      refetch();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao conciliar automaticamente');
    } finally {
      setAutoDialogOpen(false);
    }
  };

  const handleVerDetalhes = useCallback((transacao: TransacaoComConciliacao) => {
    router.push(`/financeiro/conciliacao-bancaria/${transacao.id}`);
  }, [router]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Concilia\u00e7\u00e3o Banc\u00e1ria</h1>
          <p className="text-sm text-muted-foreground">Importe extratos, revise e concilie lan\u00e7amentos.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setAutoDialogOpen(true)}>
            Conciliar Automaticamente
          </Button>
          <Button onClick={() => setImportarOpen(true)}>Importar Extrato</Button>
        </div>
      </div>

      <AlertasConciliacao
        resumo={resumo}
        isLoading={isLoading}
        onFiltrarPendentes={() => setSelectedFilterIds(['status_pendente'])}
        onFiltrarDivergentes={() => setSelectedFilterIds(['status_divergente'])}
      />

      <TableToolbar
        searchValue={busca}
        onSearchChange={setBusca}
        isSearching={busca !== buscaDebounced}
        searchPlaceholder="Buscar por descri\u00e7\u00e3o ou documento..."
        filterOptions={filterOptions}
        filterGroups={filterGroups}
        selectedFilters={selectedFilterIds}
        onFiltersChange={setSelectedFilterIds}
        filterButtonsMode="buttons"
      />
      <div className="flex justify-end">
        <ExportButton
          endpoint="/api/financeiro/conciliacao-bancaria/exportar"
          filtros={{
            status: filtersParsed.statusConciliacao || '',
            contaBancariaId: filtersParsed.contaBancariaId || '',
            dataInicio: filtersParsed.dataInicio || '',
            dataFim: filtersParsed.dataFim || '',
          }}
          opcoes={[
            { label: 'Exportar Transa\u00e7\u00f5es (CSV)', formato: 'csv' },
            { label: 'Relat\u00f3rio de Concilia\u00e7\u00f5es (PDF)', formato: 'pdf' },
          ]}
        />
      </div>

      {error && (
        <div className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <TransacoesImportadasTable
        transacoes={transacoes}
        onConciliar={handleConciliar}
        onDesconciliar={handleDesconciliar}
        onIgnorar={handleIgnorar}
        onVerSugestoes={handleConciliar}
        onVerDetalhes={handleVerDetalhes}
      />

      <ImportarExtratoDialog
        open={importarOpen}
        onOpenChange={setImportarOpen}
        onSuccess={refetch}
      />

      <ConciliarManualDialog
        open={conciliarOpen}
        onOpenChange={setConciliarOpen}
        transacao={selectedTransacao}
        onSuccess={refetch}
      />

      <AlertDialog open={autoDialogOpen} onOpenChange={setAutoDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Concilia\u00e7\u00e3o autom\u00e1tica</AlertDialogTitle>
            <AlertDialogDescription>
              O sistema vai analisar transa\u00e7\u00f5es pendentes e conciliar automaticamente quando o score for maior ou igual a 90.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleConciliarAutomaticamente}>Prosseguir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
