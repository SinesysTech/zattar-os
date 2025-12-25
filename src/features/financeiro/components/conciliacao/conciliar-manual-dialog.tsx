'use client';

import { useEffect, useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { useDebounce } from '@/hooks/use-debounce';
import type { 
    TransacaoComConciliacao, 
    SugestaoConciliacao, 
    LancamentoFinanceiroResumo 
} from '../../types/conciliacao';
import { 
    actionConciliarManual, 
    actionBuscarLancamentosManuais,
    actionObterSugestoes 
} from '../../actions/conciliacao';

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
  const [sugestoes, setSugestoes] = useState<SugestaoConciliacao[]>([]);
  const [isLoadingSugestoes, setIsLoadingSugestoes] = useState(false);
  
  const [buscaManual, setBuscaManual] = useState('');
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');
  const [resultadosBusca, setResultadosBusca] = useState<LancamentoFinanceiroResumo[]>([]);
  const [buscando, setBuscando] = useState(false);
  const buscaDebounced = useDebounce(buscaManual, 400);

  const topSugestoes = useMemo(() => sugestoes || [], [sugestoes]);

  // Load Sugestoes
  useEffect(() => {
    if (!transacaoId || !open) return;
    
    const loadSugestoes = async () => {
        setIsLoadingSugestoes(true);
        const result = await actionObterSugestoes(transacaoId);
        if (result.success && result.data) {
            setSugestoes(result.data);
        }
        setIsLoadingSugestoes(false);
    };

    loadSugestoes();
  }, [transacaoId, open]);

  const handleConciliar = async (sugestao: SugestaoConciliacao) => {
    if (!transacao) return;
    try {
      const res = await actionConciliarManual({
        transacaoImportadaId: transacao.id,
        lancamentoFinanceiroId: sugestao.lancamentoId,
      });
      
      if (!res.success) throw new Error(res.error);

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
      const res = await actionConciliarManual({
        transacaoImportadaId: transacao.id,
        lancamentoFinanceiroId: lancamentoId,
      });

      if (!res.success) throw new Error(res.error);

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
      const res = await actionConciliarManual({
        transacaoImportadaId: transacao.id,
        lancamentoFinanceiroId: null, // Ignorar
      });

      if (!res.success) throw new Error(res.error);

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
        const result = await actionBuscarLancamentosManuais({
          dataInicio: dataInicio || undefined,
          dataFim: dataFim || undefined,
          contaBancariaId: transacao.contaBancariaId,
          tipo,
        });

        if (result.success && result.data) {
            setResultadosBusca(result.data);
        } else {
            console.error(result.error);
        }
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

              {isLoadingSugestoes && <p className="text-sm text-muted-foreground">Carregando sugest\u00f5es...</p>}

              {!isLoadingSugestoes && topSugestoes.length === 0 && (
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
                      {sugestao.diferencas?.map((d: string) => (
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
