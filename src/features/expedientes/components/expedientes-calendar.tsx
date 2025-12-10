'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import {
    ChevronLeft,
    ChevronRight,
    Calendar as CalendarIcon,
    RefreshCw,
    Filter
} from 'lucide-react';
import {
    addDays,
    startOfWeek,
    endOfWeek,
    format,
    isSameDay,
    addWeeks,
    subWeeks,
    eachDayOfInterval,
    isToday
} from 'date-fns';
import { ptBR } from 'date-fns/locale';

import { Button } from '@/components/ui/button';
import { DataSurface } from '@/components/shared/data-surface';
import { TableToolbar } from '@/components/ui/table-toolbar';
import { DataTable } from '@/components/ui/data-table';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

import { ListarExpedientesParams, ExpedientesApiResponse, ExpedientesFilters } from '../types';
import { actionListarExpedientes } from '../actions';
import { columns } from './columns';
import { ExpedienteDialog } from './expediente-dialog';

export function ExpedientesCalendar() {
    const router = useRouter();

    // State
    const [currentDate, setCurrentDate] = React.useState(new Date());
    const [selectedDate, setSelectedDate] = React.useState(new Date());
    const [statusFilter, setStatusFilter] = React.useState<'todos' | 'pendentes' | 'baixados'>('pendentes');
    const [globalFilter, setGlobalFilter] = React.useState('');
    const [isNovoDialogOpen, setIsNovoDialogOpen] = React.useState(false);

    // Data State
    const [data, setData] = React.useState<ExpedientesApiResponse | null>(null);
    const [isLoading, setIsLoading] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);

    // Aux Data State
    const [usuarios, setUsuarios] = React.useState<any[]>([]);
    const [tiposExpedientes, setTiposExpedientes] = React.useState<any[]>([]);

    // Calendar Days
    const weekStart = startOfWeek(currentDate, { weekStartsOn: 0 }); // Domingo
    const weekEnd = endOfWeek(currentDate, { weekStartsOn: 0 });
    const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });

    // Load auxiliary data
    React.useEffect(() => {
        const fetchAuxData = async () => {
            try {
                const [usersRes, tiposRes] = await Promise.all([
                    fetch('/api/usuarios?ativo=true&limite=100').then(r => r.json()),
                    fetch('/api/tipos-expedientes?limite=100').then(r => r.json())
                ]);
                if (usersRes.success) setUsuarios(usersRes.data.usuarios);
                if (tiposRes.success) setTiposExpedientes(tiposRes.data.tipos_expedientes);
            } catch (err) {
                console.error('Erro ao carregar dados auxiliares:', err);
            }
        };
        fetchAuxData();
    }, []);

    // Fetch Data
    const fetchData = React.useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            // Filter by selected date
            const dateStr = format(selectedDate, 'yyyy-MM-dd');

            const params: ListarExpedientesParams = {
                page: 1,
                limit: 100, // Show more items in calendar view
                search: globalFilter || undefined,
            };

            const filters: ExpedientesFilters = {
                dataInicio: dateStr,
                dataFim: dateStr
            };

            if (statusFilter === 'pendentes') filters.pendentes = true;
            if (statusFilter === 'baixados') filters.baixados = true;

            const result = await actionListarExpedientes(params, filters);

            if (!result.success) {
                throw new Error(result.message || 'Erro ao listar expedientes');
            }

            setData(result.data);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Erro desconhecido');
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    }, [selectedDate, globalFilter, statusFilter]);

    React.useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handlePreviousWeek = () => {
        const newDate = subWeeks(currentDate, 1);
        setCurrentDate(newDate);
        setSelectedDate(startOfWeek(newDate, { weekStartsOn: 0 }));
    };

    const handleNextWeek = () => {
        const newDate = addWeeks(currentDate, 1);
        setCurrentDate(newDate);
        setSelectedDate(startOfWeek(newDate, { weekStartsOn: 0 }));
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

    const tableData = data || { expedientes: [], meta: { total: 0 } };

    return (
        <div className="flex flex-col h-full space-y-4">
            {/* Header / Week Navigation */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 p-4 bg-card rounded-lg border shadow-sm">
                <div className="flex items-center gap-4 w-full md:w-auto">
                    <div className="flex items-center gap-1 bg-muted/50 rounded-md p-1">
                        <Button variant="ghost" size="icon" onClick={handlePreviousWeek} className="h-8 w-8">
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <span className="text-sm font-medium min-w-[140px] text-center">
                            {format(weekStart, 'd MMM', { locale: ptBR })} - {format(weekEnd, 'd MMM, yyyy', { locale: ptBR })}
                        </span>
                        <Button variant="ghost" size="icon" onClick={handleNextWeek} className="h-8 w-8">
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                    <Button variant="outline" size="sm" onClick={handleToday}>
                         Hoje
                    </Button>
                </div>

                {/* Days Tabs */}
                <div className="flex flex-1 items-center justify-center gap-1 overflow-x-auto w-full">
                    {weekDays.map((day) => {
                        const isSelected = isSameDay(day, selectedDate);
                        const isTodayDate = isToday(day);
                        return (
                            <button
                                key={day.toString()}
                                onClick={() => setSelectedDate(day)}
                                className={`
                                    flex flex-col items-center justify-center min-w-[4rem] py-2 rounded-md transition-all
                                    ${isSelected ? 'bg-primary text-primary-foreground shadow-sm' : 'hover:bg-muted text-muted-foreground'}
                                    ${isTodayDate && !isSelected ? 'bg-accent text-accent-foreground font-semibold' : ''}
                                `}
                            >
                                <span className="text-[10px] uppercase">{format(day, 'EEE', { locale: ptBR })}</span>
                                <span className="text-lg font-bold">{format(day, 'd')}</span>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* List View for Selected Day */}
            <DataSurface
                header={
                    <TableToolbar
                        variant="integrated"
                        searchValue={globalFilter}
                        onSearchChange={setGlobalFilter}
                        onNewClick={() => setIsNovoDialogOpen(true)}
                        newButtonTooltip="Novo Expediente"
                        extraButtons={
                            <div className="flex items-center gap-2">
                                <Select value={statusFilter} onValueChange={(v: any) => setStatusFilter(v)}>
                                    <SelectTrigger className="w-[130px] h-9">
                                        <SelectValue placeholder="Status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="todos">Todos</SelectItem>
                                        <SelectItem value="pendentes">Pendentes</SelectItem>
                                        <SelectItem value="baixados">Baixados</SelectItem>
                                    </SelectContent>
                                </Select>

                                <Separator orientation="vertical" className="h-6 mx-1" />

                                <Button variant="ghost" size="icon" onClick={() => fetchData()} title="Atualizar">
                                    <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                                </Button>
                            </div>
                        }
                    />
                }
            >
                <div className="p-4 bg-muted/10 border-b">
                   <h3 className="font-semibold flex items-center gap-2">
                       <CalendarIcon className="h-4 w-4" />
                       Expedientes de {format(selectedDate, "EEEE, d 'de' MMMM", { locale: ptBR })}
                       <Badge variant="secondary" className="ml-2">
                           {tableData.meta.total}
                       </Badge>
                   </h3>
                </div>

                <DataTable
                    data={tableData.expedientes}
                    columns={columns}
                    isLoading={isLoading}
                    error={error}
                    hidePagination={true}
                    hideTableBorder={true}
                    className="border-none"
                    // @ts-ignore
                    options={{
                        meta: {
                            usuarios,
                            tiposExpedientes,
                            onSuccess: handleSucessoOperacao
                        }
                    }}
                />
            </DataSurface>

            <ExpedienteDialog
                open={isNovoDialogOpen}
                onOpenChange={setIsNovoDialogOpen}
                onSuccess={handleSucessoOperacao}
            />
        </div>
    );
}
