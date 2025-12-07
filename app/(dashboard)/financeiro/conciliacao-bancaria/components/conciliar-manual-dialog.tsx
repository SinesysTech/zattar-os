'use client';

import { useEffect, useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { useSugestoesConciliacao, conciliarManual, buscarLancamentosManuais } from '@/app/_lib/hooks/use-conciliacao-bancaria';
import type { TransacaoComConciliacao, SugestaoConciliacao, LancamentoFinanceiroResumo } from '@/backend/types/financeiro/conciliacao-bancaria.types';
import { toast } from 'sonner';
import { useDebounce } from '@/app/_lib/hooks/use-debounce';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transacao: TransacaoComConciliacao | null;
  onSuccess?: () => void;
}

const formatarValor = (valor: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor);

export function ConciliarManualDialog({ open, onOpenChange, transacao, onSuccess }: Props) {
  const transacaoId = transacao?.id || null;
  const { sugestoes, isLoading } = useSugestoesConciliacao(transacaoId);
  const [buscaManual, setBuscaManual] = useState('');
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');
  const [resultadosBusca, setResultadosBusca] = useState<LancamentoFinanceiroResumo[]>([]);
  const [buscando, setBuscando] = useState(false);
  const buscaDebounced = useDebounce(buscaManual, 400);

  const topSugestoes = useMemo(() => sugestoes || [], [sugestoes]);

  const handleConciliar = async (sugestao: SugestaoConciliacao) => {
    if (!transacao) return;
    try {
      await conciliarManual({
        transacaoImportadaId: transacao.id,
        lancamentoFinanceiroId: sugestao.lancamentoId,
      });
      toast.success('Transa\u00e7\u00e3o conciliada');
      onSuccess?.();
      onOpenChange(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao conciliar');
    }
  };

  const handleConciliarBusca = async (lancamentoId: number) => {
    if (!transacao) return;
    try {
      await conciliarManual({
        transacaoImportadaId: transacao.id,
        lancamentoFinanceiroId: lancamentoId,
      });
      toast.success('Transa\u00e7\u00e3o conciliada');
      onSuccess?.();
      onOpenChange(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao conciliar');
    }
  };

  const handleIgnorar = async () => {
    if (!transacao) return;
    try {
      await conciliarManual({
        transacaoImportadaId: transacao.id,
        lancamentoFinanceiroId: null,
      });
      toast.success('Transa\u00e7\u00e3o marcada como ignorada');
      onSuccess?.();
      onOpenChange(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao ignorar');
    }
  };

  useEffect(() => {
    if (!transacao) return;
    const tipo = transacao.tipoTransacao === 'credito' ? 'receita' : 'despesa';

    const fetchData = async () => {
      setBuscando(true);
      try {
        const results = await buscarLancamentosManuais({
          busca: buscaDebounced || undefined,
          dataInicio: dataInicio || undefined,
          dataFim: dataFim || undefined,
          contaBancariaId: transacao.contaBancariaId,
          tipo,
          limite: 20,
        });
        setResultadosBusca(results);
      } catch (error: unknown) {
        toast.error(error instanceof Error ? error.message : 'Erro ao buscar lançamentos');
      } finally {
        setBuscando(false);
      }
    };

    void fetchData();
  }, [buscaDebounced, dataInicio, dataFim, transacao]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Concilia\u00e7\u00e3o Manual</DialogTitle>
        </DialogHeader>

        {transacao && (
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-md border p-3 space-y-1">
              <p className="text-xs uppercase text-muted-foreground">Transa\u00e7\u00e3o importada</p>
              <p className="text-sm font-medium">{transacao.descricao}</p>
              <p className="text-lg font-semibold">{formatarValor(transacao.valor)} ({transacao.tipoTransacao === 'credito' ? 'Cr\u00e9dito' : 'D\u00e9bito'})</p>
              <p className="text-sm text-muted-foreground">Data: {transacao.dataTransacao}</p>
              {transacao.documento && (
                <p className="text-sm text-muted-foreground">Documento: {transacao.documento}</p>
              )}
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">Sugest\u00f5es autom\u00e1ticas</p>
                <Button variant="outline" size="sm" onClick={handleIgnorar}>
                  Marcar como ignorado
                </Button>
              </div>

              {isLoading && <p className="text-sm text-muted-foreground">Carregando sugest\u00f5es...</p>}

              {!isLoading && topSugestoes.length === 0 && (
                <p className="text-sm text-muted-foreground">Nenhuma sugest\u00e3o encontrada.</p>
              )}

              <div className="space-y-3">
                {topSugestoes.map((sugestao) => (
                  <div
                    key={sugestao.lancamentoId}
                    className="rounded-md border p-3 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">{sugestao.lancamento.descricao}</p>
                        <p className="text-xs text-muted-foreground">
                          Data {sugestao.lancamento.dataLancamento} - {formatarValor(sugestao.lancamento.valor)}
                        </p>
                      </div>
                      <div className="text-right space-y-1">
                        <Badge>{Math.round(sugestao.score)}%</Badge>
                        <Progress value={Math.min(100, sugestao.score)} className="w-28" />
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                      {sugestao.diferencas?.map((d) => (
                        <Badge key={d} variant="outline">
                          {d}
                        </Badge>
                      ))}
                    </div>
                    <div className="flex justify-end">
                      <Button size="sm" onClick={() => handleConciliar(sugestao)}>
                        Conciliar com este
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {transacao && (
          <div className="space-y-3">
            <div className="flex flex-wrap items-end gap-3">
              <div className="space-y-1">
                <p className="text-sm font-medium">Busca manual</p>
                <Input
                  placeholder="Buscar por descri\u00e7\u00e3o ou documento"
                  value={buscaManual}
                  onChange={(e) => setBuscaManual(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium">Data inicial</p>
                <Input type="date" value={dataInicio} onChange={(e) => setDataInicio(e.target.value)} />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium">Data final</p>
                <Input type="date" value={dataFim} onChange={(e) => setDataFim(e.target.value)} />
              </div>
            </div>

            <div className="rounded-md border p-3 space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">Resultados da busca</p>
                {buscando && <p className="text-xs text-muted-foreground">Buscando...</p>}
              </div>
              {resultadosBusca.length === 0 && !buscando && (
                <p className="text-sm text-muted-foreground">Nenhum lan\u00e7amento encontrado.</p>
              )}
              <div className="space-y-2">
                {resultadosBusca.map((lancamento) => (
                  <div key={lancamento.id} className="flex items-center justify-between rounded-md border p-2">
                    <div>
                      <p className="text-sm font-medium">{lancamento.descricao}</p>
                      <p className="text-xs text-muted-foreground">
                        {lancamento.dataLancamento} - {formatarValor(lancamento.valor)}
                      </p>
                    </div>
                    <Button size="sm" onClick={() => handleConciliarBusca(lancamento.id)}>
                      Conciliar
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
