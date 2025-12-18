'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import {
    Calendar as CalendarIcon,
    RefreshCw,
    Settings,
    AlertTriangle,
} from 'lucide-react';
import {
    startOfWeek,
    endOfWeek,
    format,
    addWeeks,
    subWeeks,
} from 'date-fns';
import { ptBR } from 'date-fns/locale';

import { Button } from '@/components/ui/button';
import { DataShell, DataTable } from '@/components/shared/data-shell';
import { TableToolbar } from '@/components/ui/table-toolbar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DialogFormShell } from '@/components/shared/dialog-form-shell';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { WeekDaysCarousel } from '@/components/shared';

import type { PaginatedResponse } from '@/lib/types';
import { ListarExpedientesParams, type Expediente } from '../domain';
import { actionListarExpedientes } from '../actions';
import { columns } from './columns';
import { ExpedienteDialog } from './expediente-dialog';
import { buildExpedientesFilterGroups, parseExpedientesFilters } from './expedientes-toolbar-filters';
import { TiposExpedientesList } from '@/features/tipos-expedientes';

type UsuarioOption = { id: number; nome_exibicao?: string; nomeExibicao?: string; nome?: string };
type TipoExpedienteOption = { id: number; tipoExpediente?: string; tipo_expediente?: string; nome?: string };

export function ExpedientesCalendar() {
    const router = useRouter();

    // State
    const [currentDate, setCurrentDate] = React.useState(new Date());
    const [selectedDate, setSelectedDate] = React.useState(new Date());
    const [statusFilter, setStatusFilter] = React.useState<'todos' | 'pendentes' | 'baixados'>('pendentes');
    const [globalFilter, setGlobalFilter] = React.useState('');
    const [selectedFilters, setSelectedFilters] = React.useState<string[]>([]); // Usado via filterGroups no TableToolbar
    const [isNovoDialogOpen, setIsNovoDialogOpen] = React.useState(false);
    const [isSettingsOpen, setIsSettingsOpen] = React.useState(false);
    const [mostrarTodos, setMostrarTodos] = React.useState(false); // Por padrão, usuário vê apenas seus expedientes

    // Data State
    const [data, setData] = React.useState<PaginatedResponse<Expediente> | null>(null);
    const [isLoading, setIsLoading] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);

    // Aux Data State
    const [usuarios, setUsuarios] = React.useState<UsuarioOption[]>([]);
    const [tiposExpedientes, setTiposExpedientes] = React.useState<TipoExpedienteOption[]>([]);
    const [currentUserId, setCurrentUserId] = React.useState<number | null>(null);

    // Calendar Days - Semana começa na segunda-feira
    const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 });

    // Load auxiliary data and current user
    React.useEffect(() => {
        const fetchAuxData = async () => {
            try {
                const [usersResponse, tiposResponse, userResponse] = await Promise.all([
                    fetch('/api/usuarios?ativo=true&limite=100'),
                    fetch('/api/tipos-expedientes?limite=100'),
                    fetch('/api/me').catch(() => null)
                ]);

                // Processar resposta de usuários
                if (usersResponse.ok) {
                    const contentType = usersResponse.headers.get('content-type');
                    if (contentType?.includes('application/json')) {
                        const usersRes = await usersResponse.json();
                        if (usersRes.success && usersRes.data?.usuarios) {
                            setUsuarios(usersRes.data.usuarios);
                        }
                    }
                }

                // Processar resposta de tipos
                if (tiposResponse.ok) {
                    const contentType = tiposResponse.headers.get('content-type');
                    if (contentType?.includes('application/json')) {
                        const tiposRes = await tiposResponse.json();
                        if (tiposRes.success && tiposRes.data?.data) {
                            setTiposExpedientes(tiposRes.data.data);
                        }
                    }
                }

                // Processar resposta do usuário atual
                if (userResponse && userResponse.ok) {
                    const contentType = userResponse.headers.get('content-type');
                    if (contentType?.includes('application/json')) {
                        const userRes = await userResponse.json();
                        if (userRes.success && userRes.data?.id) {
                            setCurrentUserId(userRes.data.id);
                        }
                    }
                }
            } catch (err) {
                console.error('Erro ao carregar dados auxiliares:', err);
            }
        };
        fetchAuxData();
    }, []);

    // Parse filters from selected filter IDs
    const parsedFilters = React.useMemo(() => {
        return parseExpedientesFilters(selectedFilters);
    }, [selectedFilters]);

    // Fetch Data
    const fetchData = React.useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            // Filtrar por data selecionada (calendário semanal)
            const dateStr = format(selectedDate, 'yyyy-MM-dd');

            const params: ListarExpedientesParams = {
                pagina: 1,
                limite: 100, // Mostrar mais itens na visão de calendário
                busca: globalFilter || undefined,
                dataPrazoLegalInicio: dateStr,
                dataPrazoLegalFim: dateStr,
                // Preserva comportamento legado: itens "sem prazo" devem aparecer no calendário
                // mesmo quando filtramos por um dia específico.
                incluirSemPrazo: true,
                // Carregamento padrão: apenas expedientes em aberto (baixado = null)
                baixado: false,
            };

            // Aplicar filtros do toolbar
            Object.assign(params, parsedFilters);

            // Filtro padrão: usuário comum vê apenas seus expedientes
            // Mas pode marcar para ver todos
            if (!mostrarTodos && currentUserId) {
                params.responsavelId = currentUserId;
            }

            // Status filter (pendentes/baixados/todos)
            if (statusFilter === 'pendentes') {
                params.baixado = false;
            } else if (statusFilter === 'baixados') {
                params.baixado = true;
            } else {
                // 'todos' - não define baixado, mostra todos
                delete params.baixado;
            }

            const result = await actionListarExpedientes(params);

            if (!result.success) {
                throw new Error(result.message || 'Erro ao listar expedientes');
            }

            setData(result.data as PaginatedResponse<Expediente>);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Erro desconhecido');
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    }, [selectedDate, globalFilter, statusFilter, parsedFilters, mostrarTodos, currentUserId]);

    React.useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handlePreviousWeek = () => {
        const newDate = subWeeks(currentDate, 1);
        setCurrentDate(newDate);
        setSelectedDate(startOfWeek(newDate, { weekStartsOn: 1 }));
    };

    const handleNextWeek = () => {
        const newDate = addWeeks(currentDate, 1);
        setCurrentDate(newDate);
        setSelectedDate(startOfWeek(newDate, { weekStartsOn: 1 }));
    };

    const handleToday = () => {
        const today = new Date();
        setCurrentDate(today);
        setSelectedDate(today);
    };

    const handleSucessoOperacao = () => {
        fetchData();
        router.refresh();
    };

    const total = data?.pagination.total ?? 0;
    const tableData = data?.data ?? [];

    // Build filter groups with dynamic data
    const filterGroups = React.useMemo(() => {
        return buildExpedientesFilterGroups(usuarios, tiposExpedientes);
    }, [usuarios, tiposExpedientes]);

    // Table instance não é mais necessário, mas mantido para compatibilidade futura

    // Count expedientes sem data e vencidos para destacar
    const semDataCount = tableData.filter(e => !e.dataPrazoLegalParte).length;
    const vencidosCount = tableData.filter(e => e.prazoVencido && !e.baixadoEm).length;

    return (
        <div className="flex flex-col h-full space-y-4">
            {/* Header / Week Navigation + Days Carousel (integrado) */}
            <div className="p-4 bg-card rounded-lg border shadow-sm">
                <WeekDaysCarousel
                    currentDate={currentDate}
                    selectedDate={selectedDate}
                    onDateSelect={setSelectedDate}
                    weekStartsOn={1}
                    onPrevious={handlePreviousWeek}
                    onNext={handleNextWeek}
                    onToday={handleToday}
                />
            </div>

            {/* List View for Selected Day */}
            <DataShell
                actionButton={{
                    label: 'Novo Expediente',
                    onClick: () => setIsNovoDialogOpen(true),
                }}
                header={
                    <TableToolbar
                        variant="integrated"
                        searchValue={globalFilter}
                        onSearchChange={setGlobalFilter}
                        selectedFilters={selectedFilters}
                        onFiltersChange={setSelectedFilters}
                        filterGroups={filterGroups}
                        filterButtonsMode="panel"
                        filterPanelTitle="Filtros de Expedientes"
                        filterPanelDescription="Filtre expedientes por tribunal, grau, responsável, tipo e outras características"
                        extraButtons={
                            <div className="flex items-center gap-2">
                                <Select
                                    value={statusFilter}
                                    onValueChange={(v) => setStatusFilter(v as typeof statusFilter)}
                                >
                                    <SelectTrigger className="h-10 w-[130px]">
                                        <SelectValue placeholder="Status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="todos">Todos</SelectItem>
                                        <SelectItem value="pendentes">Pendentes</SelectItem>
                                        <SelectItem value="baixados">Baixados</SelectItem>
                                    </SelectContent>
                                </Select>

                                <Separator orientation="vertical" className="h-6 mx-1" />

                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-10 w-10"
                                            onClick={() => fetchData()}
                                        >
                                            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>Atualizar</TooltipContent>
                                </Tooltip>

                                <Separator orientation="vertical" className="h-6 mx-1" />

                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-10 w-10"
                                            onClick={() => setIsSettingsOpen(true)}
                                        >
                                            <Settings className="h-4 w-4" />
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>Configurações - Tipos de Expedientes</TooltipContent>
                                </Tooltip>
                            </div>
                        }
                    />
                }
            >
                <div className="p-4 bg-muted/10 border-b">
                    <div className="flex items-center justify-between">
                        <h3 className="font-semibold flex items-center gap-2">
                            <CalendarIcon className="h-4 w-4" />
                            Expedientes de {format(selectedDate, "EEEE, d 'de' MMMM", { locale: ptBR })}
                            <Badge variant="secondary" className="ml-2">
                                {total}
                            </Badge>
                        </h3>
                        {(semDataCount > 0 || vencidosCount > 0) && (
                            <div className="flex items-center gap-2">
                                {semDataCount > 0 && (
                                    <Badge variant="warning">
                                        <AlertTriangle className="h-3 w-3 mr-1" />
                                        {semDataCount} sem data
                                    </Badge>
                                )}
                                {vencidosCount > 0 && (
                                    <Badge variant="destructive">
                                        <AlertTriangle className="h-3 w-3 mr-1" />
                                        {vencidosCount} vencidos
                                    </Badge>
                                )}
                            </div>
                        )}
                    </div>
                    {!mostrarTodos && currentUserId && (
                        <div className="mt-2 text-sm text-muted-foreground">
                            Mostrando apenas seus expedientes.{' '}
                            <Button
                                variant="link"
                                className="h-auto p-0 text-primary"
                                onClick={() => setMostrarTodos(true)}
                            >
                                Ver todos
                            </Button>
                        </div>
                    )}
                    {mostrarTodos && (
                        <div className="mt-2 text-sm text-muted-foreground">
                            Mostrando todos os expedientes.{' '}
                            <Button
                                variant="link"
                                className="h-auto p-0 text-primary"
                                onClick={() => setMostrarTodos(false)}
                            >
                                Ver apenas meus
                            </Button>
                        </div>
                    )}
                </div>

                <DataTable
                    data={tableData}
                    columns={columns}
                    isLoading={isLoading}
                    error={error}
                    hidePagination={true}
                    hideTableBorder={true}
                    options={{
                        meta: {
                            usuarios,
                            tiposExpedientes,
                            onSuccess: handleSucessoOperacao,
                        },
                    }}
                />
            </DataShell>

            <ExpedienteDialog
                open={isNovoDialogOpen}
                onOpenChange={setIsNovoDialogOpen}
                onSuccess={handleSucessoOperacao}
            />

            {/* Settings Dialog - Tipos de Expedientes */}
            <DialogFormShell
                open={isSettingsOpen}
                onOpenChange={setIsSettingsOpen}
                title="Tipos de Expedientes"
                description="Gerencie os tipos de expedientes utilizados no sistema."
                maxWidth="4xl"
                footer={
                    <Button variant="outline" onClick={() => setIsSettingsOpen(false)}>
                        Fechar
                    </Button>
                }
            >
                <div className="flex-1 overflow-auto h-[60vh]">
                    <TiposExpedientesList />
                </div>
            </DialogFormShell>
        </div>
    );
}
