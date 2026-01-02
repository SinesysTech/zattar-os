'use client';

import * as React from 'react';
import { format } from 'date-fns';

import type { PaginatedResponse } from '@/types';
import type { Pericia, ListarPericiasParams, PericiasFilters } from '../domain';
import { actionListarPericias } from '../actions/pericias-actions';
import { PericiaDetalhesDialog } from './pericia-detalhes-dialog';

interface PericiasCalendarYearProps {
  currentDate: Date;
  globalFilter?: string;
  situacaoCodigo?: PericiasFilters['situacaoCodigo'];
  trt?: PericiasFilters['trt'];
  grau?: PericiasFilters['grau'];
  responsavelId?: PericiasFilters['responsavelId'];
  semResponsavel?: PericiasFilters['semResponsavel'];
  especialidadeId?: PericiasFilters['especialidadeId'];
  peritoId?: PericiasFilters['peritoId'];
  laudoJuntado?: PericiasFilters['laudoJuntado'];
  onLoadingChange?: (loading: boolean) => void;
}

export function PericiasCalendarYear({
  currentDate,
  globalFilter = '',
  situacaoCodigo,
  trt,
  grau,
  responsavelId,
  semResponsavel,
  especialidadeId,
  peritoId,
  laudoJuntado,
  onLoadingChange,
}: PericiasCalendarYearProps) {
  const [data, setData] = React.useState<PaginatedResponse<Pericia> | null>(
    null
  );
  const [isLoading, setIsLoading] = React.useState(false);
  const [periciasDia, setPericiasDia] = React.useState<Pericia[]>([]);
  const [dialogOpen, setDialogOpen] = React.useState(false);

  React.useEffect(() => {
    onLoadingChange?.(isLoading);
  }, [isLoading, onLoadingChange]);

  const pericias = React.useMemo(() => data?.data || [], [data]);

  const fetchData = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const start = new Date(currentDate.getFullYear(), 0, 1);
      const end = new Date(currentDate.getFullYear(), 11, 31);

      const params: ListarPericiasParams = {
        pagina: 1,
        limite: 1000,
        busca: globalFilter || undefined,
      };

      const filters: PericiasFilters = {
        prazoEntregaInicio: format(start, 'yyyy-MM-dd'),
        prazoEntregaFim: format(end, 'yyyy-MM-dd'),
        situacaoCodigo,
        trt,
        grau,
        responsavelId,
        semResponsavel,
        especialidadeId,
        peritoId,
        laudoJuntado,
      };

      const result = await actionListarPericias({ ...params, ...filters });
      if (!result.success) throw new Error(result.message || 'Erro ao listar perícias');
      setData(result.data as PaginatedResponse<Pericia>);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  }, [
    currentDate,
    globalFilter,
    situacaoCodigo,
    trt,
    grau,
    responsavelId,
    semResponsavel,
    especialidadeId,
    peritoId,
    laudoJuntado,
  ]);

  React.useEffect(() => {
    fetchData();
  }, [fetchData]);

  const periciasPorDia = React.useMemo(() => {
    const mapa = new Set<string>();
    pericias.forEach((p) => {
      if (!p.prazoEntrega) return;
      const d = new Date(p.prazoEntrega);
      if (d.getFullYear() === currentDate.getFullYear()) {
        mapa.add(`${d.getMonth()}-${d.getDate()}`);
      }
    });
    return mapa;
  }, [pericias, currentDate]);

  const temPericia = (mes: number, dia: number) => {
    return periciasPorDia.has(`${mes}-${dia}`);
  };

  const getPericiasDia = (mes: number, dia: number) => {
    const ano = currentDate.getFullYear();
    return pericias.filter((p) => {
      if (!p.prazoEntrega) return false;
      const d = new Date(p.prazoEntrega);
      return d.getFullYear() === ano && d.getMonth() === mes && d.getDate() === dia;
    });
  };

  const handleDiaClick = (mes: number, dia: number) => {
    const ps = getPericiasDia(mes, dia);
    if (ps.length > 0) {
      setPericiasDia(ps);
      setDialogOpen(true);
    }
  };

  const meses = [
    'Janeiro',
    'Fevereiro',
    'Março',
    'Abril',
    'Maio',
    'Junho',
    'Julho',
    'Agosto',
    'Setembro',
    'Outubro',
    'Novembro',
    'Dezembro',
  ];

  const getDiasMes = (mes: number) => {
    const ano = currentDate.getFullYear();
    const ultimoDia = new Date(ano, mes + 1, 0).getDate();
    const primeiroDiaSemana = new Date(ano, mes, 1).getDay();
    const offset = primeiroDiaSemana === 0 ? 6 : primeiroDiaSemana - 1;

    const dias: (number | null)[] = [];
    for (let i = 0; i < offset; i++) dias.push(null);
    for (let i = 1; i <= ultimoDia; i++) dias.push(i);
    return dias;
  };

  return (
    <div className="flex flex-col h-full">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {meses.map((nome, mesIdx) => (
          <div
            key={nome}
            className="border rounded-lg p-4 bg-white dark:bg-card shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="font-semibold text-center mb-3 text-sm uppercase tracking-wide text-muted-foreground">
              {nome}
            </div>
            <div className="grid grid-cols-7 gap-1 text-center mb-1">
              {['S', 'T', 'Q', 'Q', 'S', 'S', 'D'].map((d, i) => (
                <span key={`${d}-${i}`} className="text-[10px] text-muted-foreground">
                  {d}
                </span>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1 text-center">
              {getDiasMes(mesIdx).map((dia, i) => {
                if (!dia) return <span key={i} />;
                const has = temPericia(mesIdx, dia);
                const isToday =
                  new Date().toDateString() ===
                  new Date(currentDate.getFullYear(), mesIdx, dia).toDateString();

                return (
                  <div
                    key={i}
                    onClick={() => has && handleDiaClick(mesIdx, dia)}
                    className={`
                      text-xs h-7 w-7 flex items-center justify-center rounded-full transition-all
                      ${isToday ? 'bg-blue-600 text-white font-bold' : ''}
                      ${
                        !isToday && has
                          ? 'bg-primary/20 text-primary font-medium cursor-pointer hover:bg-primary/40'
                          : 'text-muted-foreground'
                      }
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

      <PericiaDetalhesDialog
        pericia={null}
        pericias={periciasDia}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />
    </div>
  );
}


