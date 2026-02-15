'use client';

/**
 * AudienciasYearWrapper - Wrapper auto-contido para a view de ano
 *
 * Segue o mesmo padrão de DataShell + DataTableToolbar
 * que AudienciasTableWrapper (semana) e AudienciasListWrapper (lista).
 *
 * Gerencia:
 * - Estado de filtros (via AudienciasListFilters)
 * - Navegação de ano (via useYearNavigation + YearsCarousel)
 * - Busca de dados (via useAudiencias hook)
 * - Dialog de criação
 */

import * as React from 'react';
import { startOfYear, endOfYear } from 'date-fns';

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

import type { TipoAudiencia } from '../domain';
import { useAudiencias } from '../hooks/use-audiencias';
import { useTiposAudiencias } from '../hooks/use-tipos-audiencias';
import { useUsuarios } from '@/features/usuarios';

import { AudienciasListFilters } from './audiencias-list-filters';
import { AudienciasCalendarYearView } from './audiencias-calendar-year-view';
import { NovaAudienciaDialog } from './nova-audiencia-dialog';

import type {
  StatusAudiencia,
  ModalidadeAudiencia,
  GrauTribunal,
  CodigoTribunal,
} from '../domain';

// =============================================================================
// TIPOS
// =============================================================================

interface AudienciasYearWrapperProps {
  /** Slot para o seletor de modo de visualização (ViewModePopover) */
  viewModeSlot?: React.ReactNode;
  /** Slot para botões de ação adicionais (ex: Settings) */
  settingsSlot?: React.ReactNode;
  /** Dados de usuários pré-carregados (evita fetch duplicado) */
  usuariosData?: { id: number; nomeExibicao?: string; nomeCompleto?: string }[];
  /** Dados de tipos de audiência pré-carregados (evita fetch duplicado) */
  tiposAudienciaData?: TipoAudiencia[];
}

// =============================================================================
// COMPONENTE PRINCIPAL
// =============================================================================

export function AudienciasYearWrapper({
  viewModeSlot,
  settingsSlot,
  usuariosData,
  tiposAudienciaData,
}: AudienciasYearWrapperProps) {
  // ---------- Navegação de Ano ----------
  const yearNav = useYearNavigation(new Date(), 20);

  // ---------- Estado de Filtros ----------
  const [globalFilter, setGlobalFilter] = React.useState('');
  const [statusFiltro, setStatusFiltro] = React.useState<StatusAudiencia | 'todas'>('todas');
  const [modalidadeFiltro, setModalidadeFiltro] = React.useState<ModalidadeAudiencia | 'todas'>('todas');
  const [trtFiltro, setTrtFiltro] = React.useState<CodigoTribunal | 'todas'>('todas');
  const [grauFiltro, setGrauFiltro] = React.useState<GrauTribunal | 'todas'>('todas');
  const [responsavelFiltro, setResponsavelFiltro] = React.useState<number | 'null' | 'todos'>('todos');
  const [tipoAudienciaFiltro, setTipoAudienciaFiltro] = React.useState<number | 'todos'>('todos');

  // ---------- Dialog State ----------
  const [isCreateDialogOpen, setIsCreateDialogOpen] = React.useState(false);

  // ---------- Dados Auxiliares ----------
  const { usuarios: usuariosFetched } = useUsuarios({ enabled: !usuariosData });
  const { tiposAudiencia: tiposFetched } = useTiposAudiencias({ enabled: !tiposAudienciaData });

  const usuarios = usuariosData ?? usuariosFetched;
  const tiposAudiencia = tiposAudienciaData ?? tiposFetched;

  // ---------- Data Fetching ----------
  const { audiencias, isLoading, error, refetch } = useAudiencias({
    pagina: 1,
    limite: 1000,
    busca: globalFilter || undefined,
    status: statusFiltro === 'todas' ? undefined : statusFiltro,
    modalidade: modalidadeFiltro === 'todas' ? undefined : modalidadeFiltro,
    trt: trtFiltro === 'todas' ? undefined : trtFiltro,
    grau: grauFiltro === 'todas' ? undefined : grauFiltro,
    responsavel_id: responsavelFiltro === 'todos' ? undefined : responsavelFiltro === 'null' ? 'null' : responsavelFiltro,
    tipo_audiencia_id: tipoAudienciaFiltro === 'todos' ? undefined : tipoAudienciaFiltro,
    data_inicio_inicio: startOfYear(yearNav.selectedDate).toISOString(),
    data_inicio_fim: endOfYear(yearNav.selectedDate).toISOString(),
  });

  // ---------- Handlers ----------
  const handleCreateSuccess = React.useCallback(() => {
    refetch();
    setIsCreateDialogOpen(false);
  }, [refetch]);

  // ---------- Render ----------
  return (
    <>
      <DataShell
        header={
          <>
            <DataTableToolbar
              title="Audiências"
              searchValue={globalFilter}
              onSearchValueChange={setGlobalFilter}
              searchPlaceholder="Buscar audiências..."
              actionButton={{
                label: 'Nova Audiência',
                onClick: () => setIsCreateDialogOpen(true),
              }}
              viewModeSlot={viewModeSlot}
              actionSlot={settingsSlot}
              filtersSlot={
                <AudienciasListFilters
                  statusFiltro={statusFiltro}
                  onStatusChange={setStatusFiltro}
                  modalidadeFiltro={modalidadeFiltro}
                  onModalidadeChange={setModalidadeFiltro}
                  trtFiltro={trtFiltro}
                  onTrtChange={setTrtFiltro}
                  grauFiltro={grauFiltro}
                  onGrauChange={setGrauFiltro}
                  responsavelFiltro={responsavelFiltro}
                  onResponsavelChange={setResponsavelFiltro}
                  tipoAudienciaFiltro={tipoAudienciaFiltro}
                  onTipoAudienciaChange={setTipoAudienciaFiltro}
                  usuarios={usuarios}
                  tiposAudiencia={tiposAudiencia}
                />
              }
            />

            {/* YearsCarousel - mesmo posicionamento do WeekNavigator na view semana */}
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
          <TemporalViewLoading message="Carregando audiências..." />
        ) : error ? (
          <TemporalViewError message={`Erro ao carregar audiências: ${error}`} onRetry={refetch} />
        ) : (
          <AudienciasCalendarYearView
            audiencias={audiencias}
            currentDate={yearNav.selectedDate}
            onDateChange={yearNav.setSelectedDate}
            refetch={refetch}
          />
        )}
      </DataShell>

      <NovaAudienciaDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        onSuccess={handleCreateSuccess}
      />
    </>
  );
}
