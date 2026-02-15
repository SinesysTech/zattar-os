'use client';

/**
 * AudienciasMonthWrapper - Wrapper auto-contido para a view de mês
 *
 * Segue o mesmo padrão de DataShell + DataTableToolbar
 * que AudienciasTableWrapper (semana) e AudienciasListWrapper (lista).
 *
 * Gerencia:
 * - Estado de filtros (via AudienciasListFilters)
 * - Busca de dados (via useAudiencias hook)
 * - Master-Detail layout (calendário compacto + lista do dia)
 * - Dialog de criação
 *
 * Nota: Sem MonthsCarousel — o AudienciasCalendarCompact já tem
 * navegação de mês embutida (setas prev/next + botão "Hoje").
 */

import * as React from 'react';
import { startOfMonth, endOfMonth } from 'date-fns';

import {
  DataShell,
  DataTableToolbar,
} from '@/components/shared/data-shell';
import {
  TemporalViewLoading,
  TemporalViewError,
} from '@/components/shared';

import type { TipoAudiencia } from '../domain';
import { useAudiencias } from '../hooks/use-audiencias';
import { useTiposAudiencias } from '../hooks/use-tipos-audiencias';
import { useUsuarios } from '@/features/usuarios';

import { AudienciasListFilters } from './audiencias-list-filters';
import { AudienciasCalendarCompact } from './audiencias-calendar-compact';
import { AudienciasDayList } from './audiencias-day-list';
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

interface AudienciasMonthWrapperProps {
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

export function AudienciasMonthWrapper({
  viewModeSlot,
  settingsSlot,
  usuariosData,
  tiposAudienciaData,
}: AudienciasMonthWrapperProps) {
  // ---------- Estado do Calendário ----------
  const [selectedDate, setSelectedDate] = React.useState<Date>(new Date());
  const [currentMonth, setCurrentMonth] = React.useState<Date>(new Date());

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
    data_inicio_inicio: startOfMonth(currentMonth).toISOString(),
    data_inicio_fim: endOfMonth(currentMonth).toISOString(),
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
          <DataTableToolbar
            title="Audiências"
            searchValue={globalFilter}
            onSearchValueChange={setGlobalFilter}
            searchPlaceholder="Buscar audiências..."
            actionButton={{
              label: 'Nova Audiência',
              onClick: () => setIsCreateDialogOpen(true),
            }}
            actionSlot={
              <>
                {viewModeSlot}
                {settingsSlot}
              </>
            }
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
        }
      >
        {isLoading ? (
          <TemporalViewLoading message="Carregando audiências..." />
        ) : error ? (
          <TemporalViewError message={`Erro ao carregar audiências: ${error}`} onRetry={refetch} />
        ) : (
          <div className="bg-card border rounded-md overflow-hidden flex-1 min-h-0">
            <div className="flex h-full">
              {/* Calendário compacto — largura fixa para não ficar achatado */}
              <div className="w-[480px] shrink-0 border-r p-6 overflow-auto">
                <AudienciasCalendarCompact
                  selectedDate={selectedDate}
                  onDateSelect={setSelectedDate}
                  audiencias={audiencias}
                  currentMonth={currentMonth}
                  onMonthChange={setCurrentMonth}
                />
              </div>

              {/* Lista do dia — ocupa todo o espaço restante */}
              <div className="flex-1 min-w-0">
                <AudienciasDayList
                  selectedDate={selectedDate}
                  audiencias={audiencias}
                  onAddAudiencia={() => setIsCreateDialogOpen(true)}
                />
              </div>
            </div>
          </div>
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
