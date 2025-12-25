'use client';

import { useState, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { DataShell } from '@/components/shared/data-shell';
import {
  ImportarExtratoDialog,
  ConciliarManualDialog,
  TransacoesImportadasTable,
  AlertasConciliacao,
  ExportButton,
  ConciliacaoListFilters,
  calcularPeriodo,
  useContasBancarias,
  useTransacoesImportadas,
  conciliarAutomaticamente as conciliarAutomaticamenteMutation,
  conciliarManual,
  desconciliar,
  type StatusConciliacaoFilter,
  type PeriodoFilter,
} from '@/features/financeiro';
import { useDebounce } from '@/hooks/use-debounce';
import type { TransacaoComConciliacao } from '@/features/financeiro';

export default function ConciliacaoBancariaPage() {
  const [importarOpen, setImportarOpen] = useState(false);
  const [conciliarOpen, setConciliarOpen] = useState(false);
  const [busca, setBusca] = useState('');
  const [statusFiltro, setStatusFiltro] = useState<StatusConciliacaoFilter>('todos');
  const [periodoFiltro, setPeriodoFiltro] = useState<PeriodoFilter>('todos');
  const [contaFiltro, setContaFiltro] = useState<number | 'todos'>('todos');
  const [selectedTransacao, setSelectedTransacao] = useState<TransacaoComConciliacao | null>(null);
  const [autoDialogOpen, setAutoDialogOpen] = useState(false);
  const router = useRouter();

  const buscaDebounced = useDebounce(busca, 400);
  const { contasBancarias } = useContasBancarias();

  // Build API params from filters
  const filtersParsed = useMemo(() => {
    const periodoRange = calcularPeriodo(periodoFiltro);
    return {
      statusConciliacao: statusFiltro === 'todos' ? undefined : statusFiltro,
      contaBancariaId: contaFiltro === 'todos' ? undefined : contaFiltro,
      ...periodoRange,
      busca: buscaDebounced || undefined,
      pagina: 1,
      limite: 50,
    };
  }, [statusFiltro, periodoFiltro, contaFiltro, buscaDebounced]);

  const { transacoes, resumo, isLoading, error, refetch } = useTransacoesImportadas(filtersParsed);

  const handleConciliar = useCallback((transacao: TransacaoComConciliacao) => {
    setSelectedTransacao(transacao);
    setConciliarOpen(true);
  }, []);

  const handleIgnorar = useCallback(async (transacao: TransacaoComConciliacao) => {
    try {
      await conciliarManual({ transacaoImportadaId: transacao.id, lancamentoFinanceiroId: null });
      toast.success('Transação marcada como ignorada');
      refetch();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao ignorar transação');
    }
  }, [refetch]);

  const handleDesconciliar = useCallback(async (transacao: TransacaoComConciliacao) => {
    try {
      await desconciliar(transacao.id);
      toast.success('Transação desconciliada');
      refetch();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao desconciliar');
    }
  }, [refetch]);

  const handleConciliarAutomaticamente = async () => {
    try {
      if (contaFiltro === 'todos') {
        toast.error('Selecione uma conta bancária para conciliação automática');
        return;
      }
      await conciliarAutomaticamenteMutation();
      toast.success('Conciliação automática iniciada');
      refetch();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao conciliar automaticamente');
    } finally {
      setAutoDialogOpen(false);
    }
  };

  const handleVerDetalhes = useCallback((transacao: TransacaoComConciliacao) => {
    router.push(`/financeiro/conciliacao-bancaria/${transacao.id}`);
  }, [router]);

  return (
    <div className="space-y-4">
      {/* Header com título e botões de ação */}
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

      {/* Alertas de Conciliação */}
      <AlertasConciliacao
        resumo={resumo}
        isLoading={isLoading}
        onFiltrarPendentes={() => setStatusFiltro('pendente')}
        onFiltrarDivergentes={() => setStatusFiltro('divergente')}
      />

      {/* DataShell com tabela de transações */}
      <DataShell
        header={
          <div className="px-6 py-4">
            <div className="flex items-center gap-2">
              {/* Search */}
              <div className="relative w-full max-w-xs">
                <Search
                  className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                  aria-hidden="true"
                />
                <Input
                  type="search"
                  placeholder="Buscar por descrição ou documento..."
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  className="h-10 w-full pl-9"
                />
              </div>

              {/* Filters */}
              <ConciliacaoListFilters
                statusFiltro={statusFiltro}
                onStatusChange={setStatusFiltro}
                periodoFiltro={periodoFiltro}
                onPeriodoChange={setPeriodoFiltro}
                contaFiltro={contaFiltro}
                onContaChange={setContaFiltro}
                contasBancarias={contasBancarias || []}
              />

              {/* Spacer */}
              <div className="flex-1" />

              {/* Export Button */}
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
          </div>
        }
      >
        {error && (
          <div className="mx-6 mb-4 rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
            {error}
          </div>
        )}

        <div className="relative border-t">
          <TransacoesImportadasTable
            transacoes={transacoes}
            onConciliar={handleConciliar}
            onDesconciliar={handleDesconciliar}
            onIgnorar={handleIgnorar}
            onVerSugestoes={handleConciliar}
            onVerDetalhes={handleVerDetalhes}
          />
        </div>
      </DataShell>

      {/* Dialogs */}
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
