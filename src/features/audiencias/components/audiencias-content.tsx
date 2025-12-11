'use client';

import { useCallback, useState } from 'react';
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear, addWeeks, subWeeks, addMonths, subMonths, addYears, subYears } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TableToolbar } from '@/components/ui/table-toolbar';
import { DateRange } from 'react-day-picker';
import { ModalidadeAudiencia, StatusAudiencia, CODIGO_TRIBUNAL, GrauTribunal, type CodigoTribunal } from '@/features/audiencias';
import { useAudiencias } from '@/features/audiencias';
import type { BuscarAudienciasParams } from '@/types/audiencias';
import { AudienciasListView } from './audiencias-list-view';
import { AudienciasCalendarWeekView } from './audiencias-calendar-week-view';
import { AudienciasCalendarMonthView } from './audiencias-calendar-month-view';
import { AudienciasCalendarYearView } from './audiencias-calendar-year-view';
import { useTiposAudiencias } from '@/app/_lib/hooks/use-tipos-audiencias';
import { useUsuarios } from '@/features/usuarios';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";


interface AudienciasContentProps {
  visualizacao: 'semana' | 'mes' | 'ano' | 'lista';
}

export function AudienciasContent({ visualizacao: initialView }: AudienciasContentProps) {
  const [visualizacao, setVisualizacao] = useState(initialView);
  const [currentDate, setCurrentDate] = useState(new Date());

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
          return {}; // No specific date range for list view by default
      }
    }


    return {
      data_inicio_inicio: start.toISOString(),
      data_inicio_fim: end.toISOString(),
    };
  }, [visualizacao, currentDate, dataRange]);

  const { tiposAudiencia } = useTiposAudiencias();
  const { usuarios } = useUsuarios();

  // Mapear tipo de audiência ID para descrição
  const tipoDescricaoFiltro = tipoAudienciaFiltro === 'todos' 
    ? undefined 
    : tiposAudiencia.find(t => t.id === tipoAudienciaFiltro)?.descricao;

  const buscarAudienciasParams: BuscarAudienciasParams = {
    pagina: 1, // Will be managed by list view for pagination
    limite: 1000, // Large limit for calendar views
    busca: busca || undefined,
    modalidade: modalidadeFiltro === 'todas' ? undefined : modalidadeFiltro,
    trt: trtFiltro === 'todas' ? undefined : trtFiltro,
    grau: grauFiltro === 'todas' ? undefined : grauFiltro,
    responsavel_id: responsavelFiltro === 'todos' ? undefined : responsavelFiltro === 'null' ? 'null' : Number(responsavelFiltro),
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

  return (
    <div className="flex flex-col h-full">
      <TableToolbar 
        title="Audiências" 
        createButtonLabel="Nova Audiência"
        searchValue={busca}
        onSearchChange={setBusca}
        searchPlaceholder="Buscar audiências..."
        selectedFilters={[]}
        onFiltersChange={() => {}}
      >
        <div className="flex items-center space-x-2">
          {visualizacao !== 'lista' && (
            <>
              <Button variant="outline" onClick={handlePrevious}>
                Anterior
              </Button>
              <Button variant="outline" onClick={handleToday}>
                Hoje
              </Button>
              <Button variant="outline" onClick={handleNext}>
                Próximo
              </Button>
              <span className="font-semibold">{displayDateRange()}</span>
            </>
          )}

          <Input
            placeholder="Buscar..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="h-8 w-[150px] lg:w-[250px]"
          />

          <Select
            value={statusFiltro}
            onValueChange={(value: StatusAudiencia | 'todas') => setStatusFiltro(value)}
          >
            <SelectTrigger className="h-8 w-[180px]">
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
            <SelectTrigger className="h-8 w-[180px]">
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
            <SelectTrigger className="h-8 w-[180px]">
              <SelectValue placeholder="TRT" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todas">Todos os TRTs</SelectItem>
              {CODIGO_TRIBUNAL.map((trt) => (
                <SelectItem key={trt} value={trt}>{trt}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={grauFiltro}
            onValueChange={(value: GrauTribunal | 'todas') => setGrauFiltro(value)}
          >
            <SelectTrigger className="h-8 w-[180px]">
              <SelectValue placeholder="Grau" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todas">Todos os Graus</SelectItem>
              <SelectItem value={GrauTribunal.PrimeiroGrau}>1º Grau</SelectItem>
              <SelectItem value={GrauTribunal.SegundoGrau}>2º Grau</SelectItem>
              <SelectItem value={GrauTribunal.TribunalSuperior}>Tribunal Superior</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={responsavelFiltro.toString()}
            onValueChange={(value: string) => {
              if (value === 'todos') setResponsavelFiltro('todos');
              else if (value === 'null') setResponsavelFiltro('null');
              else setResponsavelFiltro(Number(value));
            }}
          >
            <SelectTrigger className="h-8 w-[180px]">
              <SelectValue placeholder="Responsável" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os Responsáveis</SelectItem>
              <SelectItem value="null">Sem Responsável</SelectItem>
              {usuarios.map(user => (
                <SelectItem key={user.id} value={user.id.toString()}>{user.nomeExibicao || user.nomeCompleto}</SelectItem>
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
            <SelectTrigger className="h-8 w-[180px]">
              <SelectValue placeholder="Tipo de Audiência" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os Tipos</SelectItem>
              {tiposAudiencia.map(tipo => (
                <SelectItem key={tipo.id} value={tipo.id.toString()}>{tipo.descricao}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Date Range Picker can go here */}

        </div>
        <Tabs value={visualizacao} onValueChange={(value) => setVisualizacao(value as any)}>
          <TabsList>
            <TabsTrigger value="semana">Semana</TabsTrigger>
            <TabsTrigger value="mes">Mês</TabsTrigger>
            <TabsTrigger value="ano">Ano</TabsTrigger>
            <TabsTrigger value="lista">Lista</TabsTrigger>
          </TabsList>
        </Tabs>
      </TableToolbar>

      {isLoading ? (
        <div className="flex flex-1 items-center justify-center">
          Carregando audiências...
        </div>
      ) : error ? (
        <div className="flex flex-1 items-center justify-center text-red-500">
          Erro ao carregar audiências: {error}
        </div>
      ) : (
        <div className="flex-1 overflow-auto p-4">
          {visualizacao === 'lista' && <AudienciasListView audiencias={audiencias} refetch={refetch} />}
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
    </div>
  );
}
