'use client';

import * as React from 'react';
import { ObrigacaoDetalhesDialog } from '../dialogs/obrigacao-detalhes-dialog';
import type { AcordoComParcelas, ObrigacaoComDetalhes, StatusObrigacao, DisplayItem } from '../../domain';
import { actionListarObrigacoesPorPeriodo } from '../../actions';
import { format, isToday, parseISO } from 'date-fns';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';

interface ObrigacoesCalendarYearProps {
  currentDate: Date;
  onLoadingChange?: (loading: boolean) => void;
}

export function ObrigacoesCalendarYear({
  currentDate,
  onLoadingChange,
}: ObrigacoesCalendarYearProps) {
  const [obrigacoes, setObrigacoes] = React.useState<AcordoComParcelas[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  
  // State for Day List Dialog
  const [dayListOpen, setDayListOpen] = React.useState(false);
  const [selectedDayItens, setSelectedDayItens] = React.useState<DisplayItem[]>([]);
  const [selectedDayDate, setSelectedDayDate] = React.useState<Date | null>(null);

  // State for Details Dialog
  const [itemSelecionado, setItemSelecionado] = React.useState<ObrigacaoComDetalhes | null>(null);
  const [detailsOpen, setDetailsOpen] = React.useState(false);

  React.useEffect(() => {
    onLoadingChange?.(isLoading);
  }, [isLoading, onLoadingChange]);

  const fetchData = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const start = new Date(currentDate.getFullYear(), 0, 1);
      const end = new Date(currentDate.getFullYear(), 11, 31);

      const result = await actionListarObrigacoesPorPeriodo({
        dataInicio: format(start, 'yyyy-MM-dd'),
        dataFim: format(end, 'yyyy-MM-dd'),
        incluirSemData: false,
      });

      if (result.success && result.data) setObrigacoes(result.data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [currentDate]);

  React.useEffect(() => { fetchData(); }, [fetchData]);

  // Flatten items
  const itensPorDia = React.useMemo(() => {
    const mapa = new Map<string, DisplayItem[]>();
    const ano = currentDate.getFullYear();

    obrigacoes.forEach((acordo) => {
      acordo.parcelas?.forEach((parcela) => {
          if (!parcela.dataVencimento) return;
          const dataVenc = parseISO(parcela.dataVencimento);
          
          if (dataVenc.getFullYear() === ano) {
             const chave = `${dataVenc.getMonth()}-${dataVenc.getDate()}`;
             if (!mapa.has(chave)) mapa.set(chave, []);
             
             mapa.get(chave)!.push({
                 id: parcela.id,
                 acordoId: acordo.id,
                 descricao: `Parcela ${parcela.numeroParcela} - Processo ${acordo.processo?.numero_processo || 'N/A'}`,
                 valor: parcela.valorBrutoCreditoPrincipal,
                 status: parcela.status === 'atrasada' ? 'vencida' : (parcela.status === 'recebida' || parcela.status === 'paga' ? 'efetivada' : 'pendente'),
                 originalParcela: parcela,
                 originalAcordo: acordo
             });
          }
      });
    });

    return mapa;
  }, [obrigacoes, currentDate]);

  const handleDiaClick = (mes: number, dia: number) => {
    const chave = `${mes}-${dia}`;
    const itens = itensPorDia.get(chave);
    if (itens && itens.length > 0) {
      setSelectedDayItens(itens);
      setSelectedDayDate(new Date(currentDate.getFullYear(), mes, dia));
      setDayListOpen(true);
    }
  };

  const handleItemClick = (item: DisplayItem) => {
      const detalhes: ObrigacaoComDetalhes = {
          id: item.id,
          tipo: item.originalAcordo.tipo,
          descricao: item.descricao,
          valor: item.valor,
          dataVencimento: item.originalParcela.dataVencimento,
          status: item.status as StatusObrigacao,
          statusSincronizacao: 'nao_aplicavel',
          diasAteVencimento: null,
          tipoEntidade: 'parcela',
          acordoId: item.acordoId,
          processoId: item.originalAcordo.processoId,
      };
      
    setItemSelecionado(detalhes);
    setDetailsOpen(true);
  };

  const meses = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  const getDiasMes = (mes: number) => {
    const ano = currentDate.getFullYear();
    const ultimoDia = new Date(ano, mes + 1, 0).getDate();
    const primeiroDiaSemana = new Date(ano, mes, 1).getDay(); 
    const offset = primeiroDiaSemana === 0 ? 6 : primeiroDiaSemana - 1;

    const dias = [];
    for (let i = 0; i < offset; i++) dias.push(null);
    for (let i = 1; i <= ultimoDia; i++) dias.push(i);
    return dias;
  };

  return (
    <div className="flex flex-col h-full">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {meses.map((nome, mesIdx) => (
          <div key={nome} className="border rounded-lg p-4 bg-white dark:bg-card shadow-sm hover:shadow-md transition-shadow">
            <div className="font-semibold text-center mb-3 text-sm uppercase tracking-wide text-muted-foreground">{nome}</div>
            <div className="grid grid-cols-7 gap-1 text-center mb-1">
              {['S', 'T', 'Q', 'Q', 'S', 'S', 'D'].map((d, i) => <span key={`${d}-${i}`} className="text-[10px] text-muted-foreground">{d}</span>)}
            </div>
            <div className="grid grid-cols-7 gap-1 text-center">
              {getDiasMes(mesIdx).map((dia, i) => {
                if (!dia) return <span key={i} />;
                
                const chave = `${mesIdx}-${dia}`;
                const itens = itensPorDia.get(chave);
                const hasItens = itens && itens.length > 0;
                const isTodayDate = isToday(new Date(currentDate.getFullYear(), mesIdx, dia));

                return (
                  <div
                    key={i}
                    onClick={() => hasItens && handleDiaClick(mesIdx, dia)}
                    className={`
                        text-xs h-7 w-7 flex items-center justify-center rounded-full transition-all
                        ${isTodayDate ? 'bg-blue-600 text-white font-bold' : ''}
                        ${!isTodayDate && hasItens ? 'bg-primary/20 text-primary font-medium cursor-pointer hover:bg-primary/40' : 'text-muted-foreground'}
                    `}
                  >
                    {dia}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Dialog lista do dia */}
      <Dialog open={dayListOpen} onOpenChange={setDayListOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
                {selectedDayDate ? format(selectedDayDate, 'dd/MM/yyyy') : ''}
            </DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh]">
            <div className="space-y-2 p-1">
                {selectedDayItens.map((item, idx) => (
                    <div 
                        key={idx}
                        className="flex items-center justify-between p-3 border rounded hover:bg-muted/50 cursor-pointer"
                        onClick={() => handleItemClick(item)}
                    >
                        <div className="flex flex-col">
                            <span className="font-medium text-sm">{item.descricao}</span>
                            <span className="text-xs text-muted-foreground capitalize">{item.status}</span>
                        </div>
                        <Badge variant={item.status === 'vencida' ? 'destructive' : 'outline'}>
                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.valor)}
                        </Badge>
                    </div>
                ))}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      <ObrigacaoDetalhesDialog
        obrigacao={itemSelecionado}
        open={detailsOpen}
        onOpenChange={setDetailsOpen}
      />
    </div>
  );
}
