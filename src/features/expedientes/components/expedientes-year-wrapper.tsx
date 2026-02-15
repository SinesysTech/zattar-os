'use client';

/**
 * ExpedientesYearWrapper - Wrapper auto-contido para a view de ano
 *
 * Segue o padrão de AudienciasYearWrapper:
 * - DataShell + DataTableToolbar + YearsCarousel
 * - ExpedientesListFilters no filtersSlot
 * - Grid de 12 meses com indicadores de expedientes
 * - Fetch via useExpedientes com range anual
 */

import * as React from 'react';
import { startOfYear, endOfYear, format, isToday as dateFnsIsToday } from 'date-fns';

import {
  DataShell,
  DataTableToolbar,
} from '@/components/shared/data-shell';
import {
  YearsCarousel,
  useYearNavigation,
  TemporalViewLoading,
  TemporalViewError,
} from '@/components/shared';

import type { Expediente } from '../domain';
import { useExpedientes } from '../hooks/use-expedientes';
import { useUsuarios } from '@/features/usuarios';
import { useTiposExpedientes } from '@/features/tipos-expedientes';

import { ExpedientesListFilters, type StatusFilterType, type ResponsavelFilterType } from './expedientes-list-filters';
import { ExpedienteDialog } from './expediente-dialog';
import { ExpedienteDetalhesDialog } from './expediente-detalhes-dialog';

// =============================================================================
// TIPOS
// =============================================================================

interface UsuarioData {
  id: number;
  nomeExibicao?: string;
  nome_exibicao?: string;
  nomeCompleto?: string;
  nome?: string;
}

interface TipoExpedienteData {
  id: number;
  tipoExpediente?: string;
  tipo_expediente?: string;
}

interface ExpedientesYearWrapperProps {
  /** Slot para o seletor de modo de visualização (ViewModePopover) */
  viewModeSlot?: React.ReactNode;
  /** Slot para botões de ação adicionais (ex: Settings) */
  settingsSlot?: React.ReactNode;
  /** Dados de usuários pré-carregados (evita fetch duplicado) */
  usuariosData?: UsuarioData[];
  /** Dados de tipos de expediente pré-carregados (evita fetch duplicado) */
  tiposExpedientesData?: TipoExpedienteData[];
}

// =============================================================================
// CONSTANTES
// =============================================================================

const MESES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

const DIAS_SEMANA = ['S', 'T', 'Q', 'Q', 'S', 'S', 'D'];

// =============================================================================
// COMPONENTE PRINCIPAL
// =============================================================================

export function ExpedientesYearWrapper({
  viewModeSlot,
  settingsSlot,
  usuariosData,
  tiposExpedientesData,
}: ExpedientesYearWrapperProps) {
  // ---------- Navegação de Ano ----------
  const yearNav = useYearNavigation(new Date(), 20);

  // ---------- Estado de Filtros ----------
  const [globalFilter, setGlobalFilter] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState<StatusFilterType>('pendentes');
  const [responsavelFilter, setResponsavelFilter] = React.useState<ResponsavelFilterType>('todos');
  const [tribunalFilter, setTribunalFilter] = React.useState('');
  const [grauFilter, setGrauFilter] = React.useState('');
  const [tipoExpedienteFilter, setTipoExpedienteFilter] = React.useState('');
  const [origemFilter, setOrigemFilter] = React.useState('');

  // ---------- Dialog State ----------
  const [isCreateDialogOpen, setIsCreateDialogOpen] = React.useState(false);
  const [expedientesDiaDialog, setExpedientesDiaDialog] = React.useState<Expediente[]>([]);
  const [isDiaDialogOpen, setIsDiaDialogOpen] = React.useState(false);

  // ---------- Dados Auxiliares ----------
  const { usuarios: usuariosFetched } = useUsuarios({ enabled: !usuariosData });
  const { tiposExpedientes: tiposFetched } = useTiposExpedientes({ limite: 100 });

  const usuarios = usuariosData ?? usuariosFetched;
  const tiposExpedientes = tiposExpedientesData ?? tiposFetched;

  // ---------- Montar params para o hook ----------
  const hookParams = React.useMemo(() => {
    const params: Record<string, unknown> = {
      pagina: 1,
      limite: 1000,
      busca: globalFilter || undefined,
      dataPrazoLegalInicio: format(startOfYear(yearNav.selectedDate), 'yyyy-MM-dd'),
      dataPrazoLegalFim: format(endOfYear(yearNav.selectedDate), 'yyyy-MM-dd'),
      incluirSemPrazo: true,
    };

    if (statusFilter === 'pendentes') params.baixado = false;
    if (statusFilter === 'baixados') params.baixado = true;

    if (responsavelFilter === 'sem_responsavel') {
      params.semResponsavel = true;
    } else if (typeof responsavelFilter === 'number') {
      params.responsavelId = responsavelFilter;
    }

    if (tribunalFilter) params.trt = tribunalFilter;
    if (grauFilter) params.grau = grauFilter;
    if (tipoExpedienteFilter) params.tipoExpedienteId = parseInt(tipoExpedienteFilter, 10);
    if (origemFilter) params.origem = origemFilter;

    return params;
  }, [globalFilter, yearNav.selectedDate, statusFilter, responsavelFilter, tribunalFilter, grauFilter, tipoExpedienteFilter, origemFilter]);

  // ---------- Data Fetching ----------
  const { expedientes, isLoading, error, refetch } = useExpedientes(hookParams);

  // ---------- Expedientes por dia (mapa) ----------
  const expedientesPorDia = React.useMemo(() => {
    const mapa = new Map<string, Expediente[]>();
    expedientes.forEach((e) => {
      if (!e.dataPrazoLegalParte) return;
      const d = new Date(e.dataPrazoLegalParte);
      const key = `${d.getMonth()}-${d.getDate()}`;
      const existing = mapa.get(key) || [];
      existing.push(e);
      mapa.set(key, existing);
    });
    return mapa;
  }, [expedientes]);

  // Itens sem prazo e vencidos (fixados em todos os dias)
  const semPrazoPendentes = React.useMemo(
    () => expedientes.filter((e) => !e.baixadoEm && !e.dataPrazoLegalParte),
    [expedientes]
  );
  const vencidosPendentes = React.useMemo(
    () => expedientes.filter((e) => !e.baixadoEm && e.prazoVencido === true),
    [expedientes]
  );

  // ---------- Helpers ----------
  const getDiasMes = React.useCallback((mes: number) => {
    const ano = yearNav.selectedDate.getFullYear();
    const ultimoDia = new Date(ano, mes + 1, 0).getDate();
    const primeiroDiaSemana = new Date(ano, mes, 1).getDay();
    const offset = primeiroDiaSemana === 0 ? 6 : primeiroDiaSemana - 1;

    const dias: (number | null)[] = [];
    for (let i = 0; i < offset; i++) dias.push(null);
    for (let i = 1; i <= ultimoDia; i++) dias.push(i);
    return dias;
  }, [yearNav.selectedDate]);

  const handleDiaClick = React.useCallback((mes: number, dia: number) => {
    const key = `${mes}-${dia}`;
    const doDia = expedientesPorDia.get(key) || [];

    // Combinar pinned + do dia (sem duplicatas)
    const unique = new Map<number, Expediente>();
    [...semPrazoPendentes, ...vencidosPendentes, ...doDia].forEach((e) => unique.set(e.id, e));
    const exps = Array.from(unique.values());

    if (exps.length > 0) {
      setExpedientesDiaDialog(exps);
      setIsDiaDialogOpen(true);
    }
  }, [expedientesPorDia, semPrazoPendentes, vencidosPendentes]);

  // ---------- Handlers ----------
  const handleCreateSuccess = React.useCallback(() => {
    refetch();
    setIsCreateDialogOpen(false);
  }, [refetch]);

  const temExpediente = React.useCallback((mes: number, dia: number) => {
    if (semPrazoPendentes.length > 0 || vencidosPendentes.length > 0) return true;
    return expedientesPorDia.has(`${mes}-${dia}`);
  }, [expedientesPorDia, semPrazoPendentes, vencidosPendentes]);

  // ---------- Render ----------
  return (
    <>
      <DataShell
        header={
          <>
            <DataTableToolbar
              title="Expedientes"
              searchValue={globalFilter}
              onSearchValueChange={setGlobalFilter}
              searchPlaceholder="Buscar expedientes..."
              actionButton={{
                label: 'Novo Expediente',
                onClick: () => setIsCreateDialogOpen(true),
              }}
              actionSlot={
                <>
                  {viewModeSlot}
                  {settingsSlot}
                </>
              }
              filtersSlot={
                <ExpedientesListFilters
                  statusFilter={statusFilter}
                  onStatusChange={setStatusFilter}
                  responsavelFilter={responsavelFilter}
                  onResponsavelChange={setResponsavelFilter}
                  tribunalFilter={tribunalFilter}
                  onTribunalChange={setTribunalFilter}
                  grauFilter={grauFilter}
                  onGrauChange={setGrauFilter}
                  tipoExpedienteFilter={tipoExpedienteFilter}
                  onTipoExpedienteChange={setTipoExpedienteFilter}
                  origemFilter={origemFilter}
                  onOrigemChange={setOrigemFilter}
                  usuarios={usuarios}
                  tiposExpedientes={tiposExpedientes}
                  hidePrazoFilter
                />
              }
            />

            {/* YearsCarousel */}
            <div className="pb-3">
              <YearsCarousel
                selectedDate={yearNav.selectedDate}
                onDateSelect={yearNav.setSelectedDate}
                startYear={yearNav.startYear}
                onPrevious={yearNav.handlePrevious}
                onNext={yearNav.handleNext}
                visibleYears={20}
              />
            </div>
          </>
        }
      >
        {isLoading ? (
          <TemporalViewLoading message="Carregando expedientes..." />
        ) : error ? (
          <TemporalViewError message={`Erro ao carregar expedientes: ${error}`} onRetry={refetch} />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 p-6">
            {MESES.map((nome, mesIdx) => (
              <div key={nome} className="border rounded-lg p-4 bg-card shadow-sm hover:shadow-md transition-shadow">
                <div className="font-semibold text-center mb-3 text-sm uppercase tracking-wide text-muted-foreground">
                  {nome}
                </div>
                <div className="grid grid-cols-7 gap-1 text-center mb-1">
                  {DIAS_SEMANA.map((d, i) => (
                    <span key={`${d}-${i}`} className="text-[10px] text-muted-foreground">{d}</span>
                  ))}
                </div>
                <div className="grid grid-cols-7 gap-1 text-center">
                  {getDiasMes(mesIdx).map((dia, i) => {
                    if (!dia) return <span key={i} />;
                    const hasExp = temExpediente(mesIdx, dia);
                    const isTodayDate = dateFnsIsToday(new Date(yearNav.selectedDate.getFullYear(), mesIdx, dia));

                    return (
                      <div
                        key={i}
                        onClick={() => hasExp && handleDiaClick(mesIdx, dia)}
                        className={`
                          text-xs h-7 w-7 flex items-center justify-center rounded-full transition-all
                          ${isTodayDate ? 'bg-primary text-primary-foreground font-bold' : ''}
                          ${!isTodayDate && hasExp ? 'bg-primary/20 text-primary font-medium cursor-pointer hover:bg-primary/40' : ''}
                          ${!isTodayDate && !hasExp ? 'text-muted-foreground' : ''}
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
        )}
      </DataShell>

      <ExpedienteDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        onSuccess={handleCreateSuccess}
      />

      <ExpedienteDetalhesDialog
        expediente={null}
        expedientes={expedientesDiaDialog}
        open={isDiaDialogOpen}
        onOpenChange={setIsDiaDialogOpen}
        onSuccess={refetch}
      />
    </>
  );
}
