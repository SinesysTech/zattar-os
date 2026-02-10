'use client';

/**
 * PericiasContent - Componente principal da página de perícias
 * Espelha o padrão de `ExpedientesContent` (semana/mês/ano/lista).
 */

import * as React from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Search, Plus } from 'lucide-react';

import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  TemporalViewLoading,
  MonthsCarousel,
  YearsCarousel,
  ViewModePopover,
  useWeekNavigator,
  type ViewType,
} from '@/components/shared';

import { CodigoTribunal } from '../domain';
import { GRAU_TRIBUNAL_LABELS, GrauTribunal } from '@/features/expedientes/domain';
import {
  SituacaoPericiaCodigo,
  SITUACAO_PERICIA_LABELS,
} from '../domain';
import { actionListarUsuarios } from '@/features/usuarios';
import { actionListarTerceiros } from '@/features/partes/actions/terceiros-actions';
import { actionListarEspecialidadesPericia } from '../actions/pericias-actions';

import type { UsuarioOption, EspecialidadePericiaOption, PeritoOption } from '../types';
import { PericiasTableWrapper } from './pericias-table-wrapper';
import { PericiasCalendarMonth } from './pericias-calendar-month';
import { PericiasCalendarYear } from './pericias-calendar-year';
import { PericiaCriarDialog } from './pericia-criar-dialog';

const VIEW_ROUTES: Record<ViewType, string> = {
  semana: '/pericias/semana',
  mes: '/pericias/mes',
  ano: '/pericias/ano',
  lista: '/pericias/lista',
};

const ROUTE_TO_VIEW: Record<string, ViewType> = {
  '/pericias': 'lista',
  '/pericias/lista': 'lista',
  '/pericias/semana': 'semana',
  '/pericias/mes': 'mes',
  '/pericias/ano': 'ano',
};

interface PericiasContentProps {
  visualizacao?: ViewType;
}

export function PericiasContent({ visualizacao: initialView = 'lista' }: PericiasContentProps) {
  const router = useRouter();
  const pathname = usePathname();

  const viewFromUrl = ROUTE_TO_VIEW[pathname] ?? initialView;
  const [visualizacao, setVisualizacao] = React.useState<ViewType>(viewFromUrl);
  const [currentDate, setCurrentDate] = React.useState(new Date());

  React.useEffect(() => {
    const newView = ROUTE_TO_VIEW[pathname];
    if (newView && newView !== visualizacao) {
      setVisualizacao(newView);
    }
  }, [pathname, visualizacao]);

  // Filtros para mês/ano
  const [globalFilter, setGlobalFilter] = React.useState('');
  const [tribunalFilter, setTribunalFilter] = React.useState<string>('');
  const [grauFilter, setGrauFilter] = React.useState<string>('');
  const [situacaoFilter, setSituacaoFilter] = React.useState<string>('');
  const [responsavelFilter, setResponsavelFilter] = React.useState<'todos' | 'sem_responsavel' | number>('todos');
  const [laudoFilter, setLaudoFilter] = React.useState<'todos' | 'sim' | 'nao'>('todos');
  const [especialidadeFilter, setEspecialidadeFilter] = React.useState<string>('');
  const [peritoFilter, setPeritoFilter] = React.useState<string>('');

  const [isLoading, setIsLoading] = React.useState(false);
  const [criarDialogOpen, setCriarDialogOpen] = React.useState(false);
  const [refreshKey, setRefreshKey] = React.useState(0);

  const [usuarios, setUsuarios] = React.useState<UsuarioOption[]>([]);
  const [especialidades, setEspecialidades] = React.useState<EspecialidadePericiaOption[]>([]);
  const [peritos, setPeritos] = React.useState<PeritoOption[]>([]);

  React.useEffect(() => {
    const fetchAux = async () => {
      try {
        const [usersRes, espRes, peritosRes] = await Promise.all([
          actionListarUsuarios({ ativo: true, limite: 200 }),
          actionListarEspecialidadesPericia(),
          actionListarTerceiros({ limite: 200, tipo_parte: 'PERITO', situacao: 'A' }),
        ]);

        if (usersRes.success && usersRes.data?.usuarios) {
          setUsuarios(usersRes.data.usuarios as UsuarioOption[]);
        }

        if (espRes.success) {
          const payload = espRes.data as { especialidades?: EspecialidadePericiaOption[] };
          setEspecialidades(payload.especialidades || []);
        }

        if (peritosRes.success && peritosRes.data?.data) {
          const arr = (peritosRes.data.data as unknown as { id: number; nome: string }[]) || [];
          setPeritos(arr.map((p) => ({ id: p.id, nome: p.nome })));
        }
      } catch (e) {
        console.error('Erro ao carregar dados auxiliares (perícias):', e);
      }
    };
    fetchAux();
  }, []);

  const getUsuarioNome = (u: UsuarioOption): string => {
    return (
      u.nomeExibicao ||
      u.nome_exibicao ||
      u.nomeCompleto ||
      u.nome ||
      `Usuário ${u.id}`
    );
  };

  // Navegação por semana (visualização 'semana')
  const weekNav = useWeekNavigator();

  // Navegação por mês
  const visibleMonths = 12;
  const [startMonth, setStartMonth] = React.useState(() => {
    const offset = Math.floor(visibleMonths / 2);
    return new Date(new Date().getFullYear(), new Date().getMonth() - offset, 1);
  });
  const handlePreviousMonth = React.useCallback(
    () => setStartMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1)),
    []
  );
  const handleNextMonth = React.useCallback(
    () => setStartMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1)),
    []
  );

  // Navegação por ano
  const visibleYears = 20;
  const [startYear, setStartYear] = React.useState(() => {
    const offset = Math.floor(visibleYears / 2);
    return new Date().getFullYear() - offset;
  });
  const handlePreviousYear = React.useCallback(() => setStartYear((prev) => prev - 1), []);
  const handleNextYear = React.useCallback(() => setStartYear((prev) => prev + 1), []);

  const handleVisualizacaoChange = React.useCallback(
    (value: string) => {
      const viewValue = value as ViewType;
      const targetRoute = VIEW_ROUTES[viewValue];
      if (targetRoute && targetRoute !== pathname) {
        router.push(targetRoute);
      }
      setVisualizacao(viewValue);
    },
    [pathname, router]
  );

  const handleCriarSuccess = React.useCallback(() => {
    setRefreshKey((prev) => prev + 1);
  }, []);

  // ViewModePopover component para passar aos wrappers e renderFiltersBar
  const viewModePopover = (
    <ViewModePopover
      value={visualizacao}
      onValueChange={handleVisualizacaoChange}
    />
  );

  const renderCarousel = () => {
    switch (visualizacao) {
      case 'mes':
        return (
          <MonthsCarousel
            selectedDate={currentDate}
            onDateSelect={setCurrentDate}
            startMonth={startMonth}
            onPrevious={handlePreviousMonth}
            onNext={handleNextMonth}
            visibleMonths={visibleMonths}
          />
        );
      case 'ano':
        return (
          <YearsCarousel
            selectedDate={currentDate}
            onDateSelect={setCurrentDate}
            startYear={startYear}
            onPrevious={handlePreviousYear}
            onNext={handleNextYear}
            visibleYears={visibleYears}
          />
        );
      default:
        return null;
    }
  };

  const renderFiltersBar = () => (
    <div className="flex items-center justify-between gap-4 p-4 bg-card border rounded-md">
      <div className="flex items-center gap-2 flex-wrap">
        {/* Busca */}
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar..."
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            className="h-9 w-48 pl-8 bg-card"
          />
        </div>

        {/* Tribunal */}
        <Select value={tribunalFilter || '_all'} onValueChange={(v) => setTribunalFilter(v === '_all' ? '' : v)}>
          <SelectTrigger className="h-9 w-28 bg-card">
            <SelectValue placeholder="Tribunal" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="_all">Tribunal</SelectItem>
            {CodigoTribunal.map((trt) => (
              <SelectItem key={trt} value={trt}>
                {trt}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Grau */}
        <Select value={grauFilter || '_all'} onValueChange={(v) => setGrauFilter(v === '_all' ? '' : v)}>
          <SelectTrigger className="h-9 w-28 bg-card">
            <SelectValue placeholder="Grau" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="_all">Grau</SelectItem>
            {Object.entries(GRAU_TRIBUNAL_LABELS).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Situação */}
        <Select value={situacaoFilter || '_all'} onValueChange={(v) => setSituacaoFilter(v === '_all' ? '' : v)}>
          <SelectTrigger className="h-9 w-32 bg-card">
            <SelectValue placeholder="Situação" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="_all">Situação</SelectItem>
            {Object.values(SituacaoPericiaCodigo).map((codigo) => (
              <SelectItem key={codigo} value={codigo}>
                {SITUACAO_PERICIA_LABELS[codigo]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Responsável */}
        <Select
          value={
            responsavelFilter === 'todos'
              ? 'todos'
              : responsavelFilter === 'sem_responsavel'
                ? 'sem_responsavel'
                : String(responsavelFilter)
          }
          onValueChange={(v) => {
            if (v === 'todos') setResponsavelFilter('todos');
            else if (v === 'sem_responsavel') setResponsavelFilter('sem_responsavel');
            else setResponsavelFilter(parseInt(v, 10));
          }}
        >
          <SelectTrigger className="h-9 w-40 bg-card">
            <SelectValue placeholder="Responsável" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Responsável</SelectItem>
            <SelectItem value="sem_responsavel">Sem responsável</SelectItem>
            {usuarios.map((u) => (
              <SelectItem key={u.id} value={String(u.id)}>
                {getUsuarioNome(u)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Laudo */}
        <Select value={laudoFilter} onValueChange={(v: 'todos' | 'sim' | 'nao') => setLaudoFilter(v)}>
          <SelectTrigger className="h-9 w-32 bg-card">
            <SelectValue placeholder="Laudo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Laudo</SelectItem>
            <SelectItem value="sim">Juntado</SelectItem>
            <SelectItem value="nao">Não juntado</SelectItem>
          </SelectContent>
        </Select>

        {/* Especialidade */}
        <Select value={especialidadeFilter || '_all'} onValueChange={(v) => setEspecialidadeFilter(v === '_all' ? '' : v)}>
          <SelectTrigger className="h-9 w-40 bg-card">
            <SelectValue placeholder="Especialidade" />
          </SelectTrigger>
          <SelectContent className="max-h-60">
            <SelectItem value="_all">Especialidade</SelectItem>
            {especialidades.map((e) => (
              <SelectItem key={e.id} value={String(e.id)}>
                {e.descricao}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Perito */}
        <Select value={peritoFilter || '_all'} onValueChange={(v) => setPeritoFilter(v === '_all' ? '' : v)}>
          <SelectTrigger className="h-9 w-40 bg-card">
            <SelectValue placeholder="Perito" />
          </SelectTrigger>
          <SelectContent className="max-h-60">
            <SelectItem value="_all">Perito</SelectItem>
            {peritos.map((p) => (
              <SelectItem key={p.id} value={String(p.id)}>
                {p.nome}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Ações à direita */}
      <div className="flex items-center gap-2">
        {viewModePopover}
      </div>
    </div>
  );

  const calendarFilters = React.useMemo(() => {
    const situacaoCodigo = situacaoFilter ? (situacaoFilter as SituacaoPericiaCodigo) : undefined;
    const trt = tribunalFilter ? (tribunalFilter as typeof CodigoTribunal[number]) : undefined;
    const grau = grauFilter ? (grauFilter as GrauTribunal) : undefined;

    const semResponsavel = responsavelFilter === 'sem_responsavel' ? true : undefined;
    const responsavelId =
      typeof responsavelFilter === 'number' ? responsavelFilter : undefined;

    const laudoJuntado =
      laudoFilter === 'sim' ? true : laudoFilter === 'nao' ? false : undefined;

    const especialidadeId = especialidadeFilter ? Number(especialidadeFilter) : undefined;
    const peritoId = peritoFilter ? Number(peritoFilter) : undefined;

    return {
      situacaoCodigo,
      trt,
      grau,
      semResponsavel,
      responsavelId,
      laudoJuntado,
      especialidadeId: especialidadeId && !Number.isNaN(especialidadeId) ? especialidadeId : undefined,
      peritoId: peritoId && !Number.isNaN(peritoId) ? peritoId : undefined,
    };
  }, [
    situacaoFilter,
    tribunalFilter,
    grauFilter,
    responsavelFilter,
    laudoFilter,
    especialidadeFilter,
    peritoFilter,
  ]);

  const renderContent = () => {
    switch (visualizacao) {
      case 'lista':
        return (
          <PericiasTableWrapper
            viewModeSlot={viewModePopover}
            onNovaPericiaClick={() => setCriarDialogOpen(true)}
          />
        );
      case 'mes':
        return (
          <PericiasCalendarMonth
            currentDate={currentDate}
            globalFilter={globalFilter}
            onLoadingChange={setIsLoading}
            {...calendarFilters}
          />
        );
      case 'ano':
        return (
          <PericiasCalendarYear
            currentDate={currentDate}
            globalFilter={globalFilter}
            onLoadingChange={setIsLoading}
            {...calendarFilters}
          />
        );
      case 'semana':
        return (
          <PericiasTableWrapper
            fixedDate={weekNav.selectedDate}
            hideDateFilters={true}
            viewModeSlot={viewModePopover}
            onNovaPericiaClick={() => setCriarDialogOpen(true)}
            weekNavigatorProps={{
              weekDays: weekNav.weekDays,
              selectedDate: weekNav.selectedDate,
              onDateSelect: weekNav.setSelectedDate,
              onPreviousWeek: weekNav.goToPreviousWeek,
              onNextWeek: weekNav.goToNextWeek,
              onToday: weekNav.goToToday,
              isCurrentWeek: weekNav.isCurrentWeek,
            }}
          />
        );
      default:
        return isLoading ? (
          <TemporalViewLoading message="Carregando perícias..." />
        ) : null;
    }
  };

  return (
    <div className="flex flex-col h-full gap-4">
      {/* Header com botão Nova Perícia (apenas para visualizações mes/ano que não têm DataTableToolbar) */}
      {(visualizacao === 'mes' || visualizacao === 'ano') && (
        <div className="flex items-center justify-end">
          <Button onClick={() => setCriarDialogOpen(true)} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Nova Perícia
          </Button>
        </div>
      )}

      {(visualizacao === 'mes' || visualizacao === 'ano') && (
        <div className="bg-card border border-border rounded-lg p-4">
          {renderCarousel()}
        </div>
      )}

      {(visualizacao === 'mes' || visualizacao === 'ano') && renderFiltersBar()}

      <div className="flex-1 min-h-0" key={refreshKey}>{renderContent()}</div>

      <PericiaCriarDialog
        open={criarDialogOpen}
        onOpenChange={setCriarDialogOpen}
        usuarios={usuarios}
        especialidades={especialidades}
        peritos={peritos}
        onSuccess={handleCriarSuccess}
      />
    </div>
  );
}


