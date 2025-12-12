'use client';

import * as React from 'react';
import { Badge } from '@/components/ui/badge';
import { ExpedienteDetalhesDialog } from './expediente-detalhes-dialog';
import type { PaginatedResponse } from '@/lib/types';
import type { Expediente, ListarExpedientesParams, ExpedientesFilters } from '../domain';
import { actionListarExpedientes } from '../actions';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react';
import { format, addYears, subYears, isSameDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export function ExpedientesCalendarYear() {
  const [currentYear, setCurrentYear] = React.useState(new Date());
  const [data, setData] = React.useState<PaginatedResponse<Expediente> | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [expedientesDia, setExpedientesDia] = React.useState<Expediente[]>([]);
  const [dialogOpen, setDialogOpen] = React.useState(false);

  // Filters
  const [statusFilter, setStatusFilter] = React.useState<'todos' | 'pendentes' | 'baixados'>('pendentes');

  const expedientes = data?.data || [];

  const semPrazoPendentes = React.useMemo(
    () => expedientes.filter((e) => !e.baixadoEm && !e.dataPrazoLegalParte),
    [expedientes]
  );
  const vencidosPendentes = React.useMemo(
    () => expedientes.filter((e) => !e.baixadoEm && e.prazoVencido === true),
    [expedientes]
  );
  const pinnedIds = React.useMemo(
    () => new Set<number>([...semPrazoPendentes.map((e) => e.id), ...vencidosPendentes.map((e) => e.id)]),
    [semPrazoPendentes, vencidosPendentes]
  );

  const fetchData = React.useCallback(async () => {
    setIsLoading(true);
    try {
        const start = new Date(currentYear.getFullYear(), 0, 1);
        const end = new Date(currentYear.getFullYear(), 11, 31);
        
        const params: ListarExpedientesParams = {
            pagina: 1,
            limite: 1000,
        };
        const filters: ExpedientesFilters = {
            dataPrazoLegalInicio: format(start, 'yyyy-MM-dd'),
            dataPrazoLegalFim: format(end, 'yyyy-MM-dd'),
            // Preserva comportamento legado: itens "sem prazo" devem aparecer no calendário
            // mesmo quando aplicamos filtro de range por data de prazo.
            incluirSemPrazo: true,
        };
        
        if (statusFilter === 'pendentes') filters.baixado = false;
        if (statusFilter === 'baixados') filters.baixado = true;

        const result = await actionListarExpedientes({ ...params, ...filters });
        if (result.success) setData(result.data as PaginatedResponse<Expediente>);
    } catch (err) {
        console.error(err);
    } finally {
        setIsLoading(false);
    }
  }, [currentYear, statusFilter]);

  React.useEffect(() => { fetchData(); }, [fetchData]);

  const expedientesPorDia = React.useMemo(() => {
     const mapa = new Set<string>();
     expedientes.forEach(e => {
        if (!e.dataPrazoLegalParte) return;
        const d = new Date(e.dataPrazoLegalParte);
        if (d.getFullYear() === currentYear.getFullYear()) {
            mapa.add(`${d.getMonth()}-${d.getDate()}`);
        }
     });
     return mapa;
  }, [expedientes, currentYear]);

  const temExpediente = (mes: number, dia: number) => {
    // Legacy logic: if pinned items exist, every day is marked? 
    // This is confusing UX but reproducing legacy "logic" from viewing `expedientes-visualizacao-ano.tsx`.
    // Actually legacy logic says: `if (semPrazoPendentes.length > 0 || vencidosPendentes.length > 0) return true;`
    // So if you have ANY overdue/nodate task, the WHOLE YEAR lights up?
    // That seems aggressive. I'll maintain it for parity but ideally should change.
    if (semPrazoPendentes.length > 0 || vencidosPendentes.length > 0) return true;
    return expedientesPorDia.has(`${mes}-${dia}`);
  };

  const getExpedientesDia = (mes: number, dia: number) => {
    const ano = currentYear.getFullYear();
    const doDia = expedientes.filter(e => {
        if (!e.dataPrazoLegalParte) return false;
        const d = new Date(e.dataPrazoLegalParte);
        return d.getFullYear() === ano && d.getMonth() === mes && d.getDate() === dia;
    });
    // Add pinned
    const pinned = [...semPrazoPendentes, ...vencidosPendentes];
    // Filter duplicates if any
    const unique = new Map();
    [...pinned, ...doDia].forEach(e => unique.set(e.id, e));
    return Array.from(unique.values());
  };

  const handleDiaClick = (mes: number, dia: number) => {
    const exps = getExpedientesDia(mes, dia);
    if (exps.length > 0) {
        setExpedientesDia(exps);
        setDialogOpen(true);
    }
  };

  const meses = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  const getDiasMes = (mes: number) => {
    const ano = currentYear.getFullYear();
    const ultimoDia = new Date(ano, mes + 1, 0).getDate();
    const primeiroDiaSemana = new Date(ano, mes, 1).getDay(); // 0-6
    const offset = primeiroDiaSemana === 0 ? 6 : primeiroDiaSemana - 1; // Adjust mon-sun if needed?
    // Actually legacy used `primeiroDia.getDay() === 0 ? 6 : primeiroDia.getDay() - 1`
    
    const dias = [];
    for(let i=0; i<offset; i++) dias.push(null);
    for(let i=1; i<=ultimoDia; i++) dias.push(i);
    return dias;
  };

  return (
    <div className="flex flex-col h-full space-y-6">
        <div className="flex items-center justify-between p-4 bg-card rounded-lg border">
            <div className="flex items-center gap-4">
                 <div className="flex items-center gap-1 bg-muted/50 rounded-md p-1">
                    <Button variant="ghost" size="icon" onClick={() => setCurrentYear(subYears(currentYear, 1))}>
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="font-bold text-lg min-w-[80px] text-center">{format(currentYear, 'yyyy')}</span>
                    <Button variant="ghost" size="icon" onClick={() => setCurrentYear(addYears(currentYear, 1))}>
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                 </div>
                 <Button variant="outline" size="sm" onClick={() => setCurrentYear(new Date())}>Ano Atual</Button>
            </div>
             <div className="flex items-center gap-2">
                 <Select
                   value={statusFilter}
                   onValueChange={(v) => setStatusFilter(v as 'todos' | 'pendentes' | 'baixados')}
                 >
                    <SelectTrigger className="w-[130px] h-9">
                        <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="todos">Todos</SelectItem>
                        <SelectItem value="pendentes">Pendentes</SelectItem>
                        <SelectItem value="baixados">Baixados</SelectItem>
                    </SelectContent>
                </Select>
                 <Button variant="ghost" size="icon" onClick={() => fetchData()}>
                    <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                </Button>
            </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {meses.map((nome, mesIdx) => (
                <div key={nome} className="border rounded-lg p-4 bg-background shadow-sm hover:shadow-md transition-shadow">
                    <div className="font-semibold text-center mb-3 text-sm uppercase tracking-wide text-muted-foreground">{nome}</div>
                    <div className="grid grid-cols-7 gap-1 text-center mb-1">
                         {['S','T','Q','Q','S','S','D'].map(d => <span key={d} className="text-[10px] text-muted-foreground">{d}</span>)}
                    </div>
                    <div className="grid grid-cols-7 gap-1 text-center">
                        {getDiasMes(mesIdx).map((dia, i) => {
                            if (!dia) return <span key={i} />;
                            const hasExp = temExpediente(mesIdx, dia);
                            const isToday = new Date().toDateString() === new Date(currentYear.getFullYear(), mesIdx, dia).toDateString();
                            
                            return (
                                <div 
                                    key={i}
                                    onClick={() => hasExp && handleDiaClick(mesIdx, dia)}
                                    className={`
                                        text-xs h-7 w-7 flex items-center justify-center rounded-full transition-all
                                        ${isToday ? 'bg-blue-600 text-white font-bold' : ''}
                                        ${!isToday && hasExp ? 'bg-primary/20 text-primary font-medium cursor-pointer hover:bg-primary/40' : 'text-muted-foreground'}
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

        <ExpedienteDetalhesDialog
            expediente={null}
            expedientes={expedientesDia}
            open={dialogOpen}
            onOpenChange={setDialogOpen}
            onSuccess={fetchData}
        />
    </div>
  );
}
