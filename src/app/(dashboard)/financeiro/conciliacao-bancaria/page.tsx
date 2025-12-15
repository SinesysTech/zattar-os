'use client';

import { useState, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { TableToolbar } from '@/components/ui/table-toolbar';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import {
  ImportarExtratoDialog,
  ConciliarManualDialog,
  TransacoesImportadasTable,
  AlertasConciliacao,
  ExportButton,
  buildConciliacaoFilterOptions,
  buildConciliacaoFilterGroups,
  parseConciliacaoFilters,
  useContasBancarias,
  useTransacoesImportadas,
  conciliarAutomaticamente as conciliarAutomaticamenteMutation,
  conciliarManual,
  desconciliar,
} from '@/features/financeiro';
import { useDebounce } from '@/hooks/use-debounce';
import type { TransacaoComConciliacao } from '@/features/financeiro';

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

  // Parse filters
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
      toast.success('Transação marcada como ignorada');
      refetch();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao ignorar transação');
    }
  }, [refetch]);

  const handleDesconciliar = useCallback(async (transacao: TransacaoComConciliacao) => {
    try {
      await desconciliar(transacao.id);
      toast.success('Transação desconciliada');
      refetch();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao desconciliar');
    }
  }, [refetch]);

  const handleConciliarAutomaticamente = async () => {
    try {
      // Logic for automatic conciliation from mutation
      // The return type might differ from legacy, assuming void or result
      await conciliarAutomaticamenteMutation({});
      toast.success('Conciliação automática iniciada');
      refetch();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao conciliar automaticamente');
    } finally {
      setAutoDialogOpen(false);
    }
  };

  const handleVerDetalhes = useCallback((transacao: TransacaoComConciliacao) => {
    // If we have a details page for transaction or just using dialog?
    // Legacy used router.push.
    // Assuming we keep the separate page OR migrate to dialog only.
    // For now keep legacy behavior.
    router.push(`/financeiro/conciliacao-bancaria/${transacao.id}`);
  }, [router]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Conciliação Bancária</h1>
          <p className="text-sm text-muted-foreground">Importe extratos, revise e concilie lançamentos.</p>
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
        searchPlaceholder="Buscar por descrição ou documento..."
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
            statusConciliacao: filtersParsed.statusConciliacao || '',
            contaBancariaId: filtersParsed.contaBancariaId ? String(filtersParsed.contaBancariaId) : '',
            dataInicio: filtersParsed.dataInicio || '',
            dataFim: filtersParsed.dataFim || '',
          }}
          opcoes={[
            { label: 'Exportar Transações (CSV)', formato: 'csv' },
            { label: 'Relatório de Conciliações (PDF)', formato: 'pdf' },
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
            <AlertDialogTitle>Conciliação automática</AlertDialogTitle>
            <AlertDialogDescription>
              O sistema vai analisar transações pendentes e conciliar automaticamente quando o score for maior ou igual a 90.
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
