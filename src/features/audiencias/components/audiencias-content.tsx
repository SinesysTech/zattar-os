'use client';

import { useCallback, useState } from 'react';
import {
  format,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear,
  addWeeks,
  subWeeks,
  addMonths,
  subMonths,
  addYears,
  subYears,
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TableToolbar } from '@/components/ui/table-toolbar';
import { DateRange } from 'react-day-picker';
import {
  ModalidadeAudiencia,
  StatusAudiencia,
  CODIGO_TRIBUNAL,
  GrauTribunal,
  type CodigoTribunal,
} from '@/core/audiencias/domain';
import { useAudiencias } from '../hooks/use-audiencias';
import { useTiposAudiencias } from '../hooks/use-tipos-audiencias';
import type { BuscarAudienciasParams, AudienciasVisualizacao } from '../types';
import { AudienciasListView } from './audiencias-list-view';
import { AudienciasCalendarWeekView } from './audiencias-calendar-week-view';
import { AudienciasCalendarMonthView } from './audiencias-calendar-month-view';
import { AudienciasCalendarYearView } from './audiencias-calendar-year-view';
import { useUsuarios } from '@/app/_lib/hooks/use-usuarios';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { DataSurface } from '@/components/shared/data-surface';
import { NovaAudienciaDialog } from './nova-audiencia-dialog';

interface AudienciasContentProps {
  visualizacao: AudienciasVisualizacao;
}

export function AudienciasContent({ visualizacao: initialView }: AudienciasContentProps) {
  const [visualizacao, setVisualizacao] = useState<AudienciasVisualizacao>(initialView);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isNovaAudienciaOpen, setIsNovaAudienciaOpen] = useState(false);

  const [busca, setBusca] = useState<string>('');
  const [statusFiltro, setStatusFiltro] = useState<StatusAudiencia | 'todas'>('todas');
  const [modalidadeFiltro, setModalidadeFiltro] = useState<ModalidadeAudiencia | 'todas'>('todas');
  const [trtFiltro, setTrtFiltro] = useState<CodigoTribunal | 'todas'>('todas');
  const [grauFiltro, setGrauFiltro] = useState<GrauTribunal | 'todas'>('todas');
  const [responsavelFiltro, setResponsavelFiltro] = useState<number | 'null' | 'todos'>('todos');
  const [tipoAudienciaFiltro, setTipoAudienciaFiltro] = useState<number | 'todos'>('todos');
  const [dataRange, setDataRange] = useState<DateRange | undefined>(undefined);

  const calculateDateRange = useCallback(() => {
    let start: Date;
    let end: Date;

    if (dataRange?.from && dataRange?.to) {
      start = dataRange.from;
      end = dataRange.to;
    } else {
      switch (visualizacao) {
        case 'semana':
          start = startOfWeek(currentDate, { locale: ptBR, weekStartsOn: 1 });
          end = endOfWeek(currentDate, { locale: ptBR, weekStartsOn: 1 });
          break;
        case 'mes':
          start = startOfMonth(currentDate);
          end = endOfMonth(currentDate);
          break;
        case 'ano':
          start = startOfYear(currentDate);
          end = endOfYear(currentDate);
          break;
        case 'lista':
        default:
          return {};
      }
    }

    return {
      data_inicio_inicio: start.toISOString(),
      data_inicio_fim: end.toISOString(),
    };
  }, [visualizacao, currentDate, dataRange]);

  const { tiposAudiencia } = useTiposAudiencias();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { usuarios } = useUsuarios();

  const tipoDescricaoFiltro =
    tipoAudienciaFiltro === 'todos'
      ? undefined
      : tiposAudiencia.find((t) => t.id === tipoAudienciaFiltro)?.descricao;

  const buscarAudienciasParams: BuscarAudienciasParams = {
    pagina: 1,
    limite: 1000,
    busca: busca || undefined,
    modalidade: modalidadeFiltro === 'todas' ? undefined : modalidadeFiltro,
    trt: trtFiltro === 'todas' ? undefined : trtFiltro,
    grau: grauFiltro === 'todas' ? undefined : grauFiltro,
    responsavel_id:
      responsavelFiltro === 'todos'
        ? undefined
        : responsavelFiltro === 'null'
          ? 'null'
          : Number(responsavelFiltro),
    tipo_descricao: tipoDescricaoFiltro,
    ...calculateDateRange(),
  };

  const { audiencias, isLoading, error, refetch } = useAudiencias(buscarAudienciasParams);

  const handlePrevious = () => {
    switch (visualizacao) {
      case 'semana':
        setCurrentDate((prev) => subWeeks(prev, 1));
        break;
      case 'mes':
        setCurrentDate((prev) => subMonths(prev, 1));
        break;
      case 'ano':
        setCurrentDate((prev) => subYears(prev, 1));
        break;
    }
  };

  const handleNext = () => {
    switch (visualizacao) {
      case 'semana':
        setCurrentDate((prev) => addWeeks(prev, 1));
        break;
      case 'mes':
        setCurrentDate((prev) => addMonths(prev, 1));
        break;
      case 'ano':
        setCurrentDate((prev) => addYears(prev, 1));
        break;
    }
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  const displayDateRange = useCallback(() => {
    switch (visualizacao) {
      case 'semana':
        const start = startOfWeek(currentDate, { locale: ptBR, weekStartsOn: 1 });
        const end = endOfWeek(currentDate, { locale: ptBR, weekStartsOn: 1 });
        return `${format(start, 'dd/MM')} - ${format(end, 'dd/MM/yyyy')}`;
      case 'mes':
        return format(currentDate, 'MMMM yyyy', { locale: ptBR });
      case 'ano':
        return format(currentDate, 'yyyy', { locale: ptBR });
      case 'lista':
      default:
        return 'Todas as Audiências';
    }
  }, [visualizacao, currentDate]);

  const handleSuccessNovaAudiencia = useCallback(() => {
    refetch();
  }, [refetch]);

  return (
    <>
      <DataSurface
        className="h-[calc(100vh-4rem)] border-0 rounded-none shadow-none bg-transparent"
        header={
          <TableToolbar
            onNewClick={() => setIsNovaAudienciaOpen(true)}
            newButtonTooltip="Nova Audiência"
            searchValue={busca}
            onSearchChange={setBusca}
            searchPlaceholder="Buscar audiências..."
            selectedFilters={[]}
            onFiltersChange={() => {}}
            className="rounded-t-lg border-b border-border bg-card px-4 py-3"
            variant="integrated"
            extraButtons={
              <div className="flex items-center gap-2">
                <div className="flex items-center space-x-2">
                  {visualizacao !== 'lista' && (
                    <>
                      <Button variant="outline" size="sm" onClick={handlePrevious}>
                        Anterior
                      </Button>
                      <Button variant="outline" size="sm" onClick={handleToday}>
                        Hoje
                      </Button>
                      <Button variant="outline" size="sm" onClick={handleNext}>
                        Próximo
                      </Button>
                      <span className="font-semibold text-sm w-32 text-center">{displayDateRange()}</span>
                    </>
                  )}

                  <Select
                    value={statusFiltro}
                    onValueChange={(value: StatusAudiencia | 'todas') => setStatusFiltro(value)}
                  >
                    <SelectTrigger className="h-8 w-[140px]">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todas">Todos os Status</SelectItem>
                      <SelectItem value={StatusAudiencia.Marcada}>Marcada</SelectItem>
                      <SelectItem value={StatusAudiencia.Finalizada}>Finalizada</SelectItem>
                      <SelectItem value={StatusAudiencia.Cancelada}>Cancelada</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select
                    value={modalidadeFiltro}
                    onValueChange={(value: ModalidadeAudiencia | 'todas') => setModalidadeFiltro(value)}
                  >
                    <SelectTrigger className="h-8 w-[140px]">
                      <SelectValue placeholder="Modalidade" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todas">Todas as Modalidades</SelectItem>
                      <SelectItem value={ModalidadeAudiencia.Virtual}>Virtual</SelectItem>
                      <SelectItem value={ModalidadeAudiencia.Presencial}>Presencial</SelectItem>
                      <SelectItem value={ModalidadeAudiencia.Hibrida}>Híbrida</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select
                    value={trtFiltro}
                    onValueChange={(value: CodigoTribunal | 'todas') => setTrtFiltro(value)}
                  >
                    <SelectTrigger className="h-8 w-[100px]">
                      <SelectValue placeholder="TRT" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todas">TRTs</SelectItem>
                      {CODIGO_TRIBUNAL.map((trt) => (
                        <SelectItem key={trt} value={trt}>
                          {trt}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select
                    value={tipoAudienciaFiltro.toString()}
                    onValueChange={(value: string) => {
                      if (value === 'todos') setTipoAudienciaFiltro('todos');
                      else setTipoAudienciaFiltro(Number(value));
                    }}
                  >
                    <SelectTrigger className="h-8 w-[160px]">
                      <SelectValue placeholder="Tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todos os Tipos</SelectItem>
                      {tiposAudiencia.map((tipo) => (
                        <SelectItem key={tipo.id} value={tipo.id.toString()}>
                          {tipo.descricao}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Tabs value={visualizacao} onValueChange={(value) => setVisualizacao(value as AudienciasVisualizacao)} className="ml-2">
                  <TabsList className="h-8">
                    <TabsTrigger value="semana" className="text-xs h-7">Semana</TabsTrigger>
                    <TabsTrigger value="mes" className="text-xs h-7">Mês</TabsTrigger>
                    <TabsTrigger value="ano" className="text-xs h-7">Ano</TabsTrigger>
                    <TabsTrigger value="lista" className="text-xs h-7">Lista</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
            }
          />
        }
      >
        {isLoading ? (
          <div className="flex flex-1 items-center justify-center p-8">
            <div className="flex flex-col items-center gap-2 text-muted-foreground">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
              <p>Carregando audiências...</p>
            </div>
          </div>
        ) : error ? (
          <div className="flex flex-1 items-center justify-center text-red-500 p-8">
            Erro ao carregar audiências: {error}
          </div>
        ) : (
          <div className="h-full bg-card p-0"> 
            {visualizacao === 'lista' && (
              <AudienciasListView audiencias={audiencias} refetch={refetch} />
            )}
            {visualizacao === 'semana' && (
              <AudienciasCalendarWeekView
                audiencias={audiencias}
                currentDate={currentDate}
                onDateChange={setCurrentDate}
                refetch={refetch}
              />
            )}
            {visualizacao === 'mes' && (
              <AudienciasCalendarMonthView
                audiencias={audiencias}
                currentDate={currentDate}
                onDateChange={setCurrentDate}
                refetch={refetch}
              />
            )}
            {visualizacao === 'ano' && (
              <AudienciasCalendarYearView
                audiencias={audiencias}
                currentDate={currentDate}
                onDateChange={setCurrentDate}
                refetch={refetch}
              />
            )}
          </div>
        )}
      </DataSurface>
      
      <NovaAudienciaDialog
        open={isNovaAudienciaOpen}
        onOpenChange={setIsNovaAudienciaOpen}
        onSuccess={handleSuccessNovaAudiencia}
      />
    </>
  );
}
