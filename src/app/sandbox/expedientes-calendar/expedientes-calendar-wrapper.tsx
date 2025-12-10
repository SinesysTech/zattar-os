/**
 * Wrapper para gerenciar filtros e atualização de expedientes no calendário
 * Converte o componente Server Component em Client Component com estado
 */

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { CalendarBody } from '@/components/calendar/calendar-body';
import { CalendarProvider } from '@/components/calendar/calendar-context';
import { DndProvider } from '@/components/calendar/dnd-context';
import { ExpedientesCalendarHeader } from './expedientes-calendar-header';
import { ExpedientesCalendarProvider } from './contexts/expedientes-calendar-context';
import type { IEvent, IUser } from '@/components/calendar/interfaces';
import type { Usuario } from '@/backend/usuarios/services/persistence/usuario-persistence.service';
import type { TipoExpediente } from '@/backend/types/tipos-expedientes/types';

interface ExpedientesFilters {
	trt?: string;
	grau?: 'primeiro_grau' | 'segundo_grau' | 'tribunal_superior';
	tipoExpedienteId?: number | null;
	status?: 'pendente' | 'vencido' | 'sem_data' | 'baixados';
}

interface ExpedientesCalendarWrapperProps {
	initialEvents: IEvent[];
	initialUsers: IUser[];
	usuarios: Usuario[];
	tiposExpedientes: TipoExpediente[];
}

export function ExpedientesCalendarWrapper({
	initialEvents,
	initialUsers,
	usuarios,
	tiposExpedientes,
}: ExpedientesCalendarWrapperProps) {
	const [events, setEvents] = useState<IEvent[]>(initialEvents);
	const [filters, setFilters] = useState<ExpedientesFilters>({
		status: 'pendente', // Padrão: apenas pendentes
	});
	const [isRefreshing, setIsRefreshing] = useState(false);
	const [specialView, setSpecialView] = useState<'vencidos' | 'sem_data' | null>(null);

	// Função para atualizar eventos quando filtros mudarem
	const refreshEvents = useCallback(async () => {
		setIsRefreshing(true);
		try {
			const now = new Date();
			const dataInicio = new Date(now);
			dataInicio.setMonth(now.getMonth() - 3);
			const dataFim = new Date(now);
			dataFim.setMonth(now.getMonth() + 3);

			// Buscar todos os expedientes usando paginação
			let allExpedientes: Record<string, unknown>[] = [];
			let pagina = 1;
			const limite = 100; // API aceita máximo 100
			let hasMore = true;

			while (hasMore) {
				// Construir parâmetros de busca
				const searchParams = new URLSearchParams();
				searchParams.set('pagina', pagina.toString());
				searchParams.set('limite', limite.toString());

				// Mapear status para parâmetros da API
				if (filters.status === 'baixados') {
					searchParams.set('baixado', 'true');
				} else if (filters.status === 'pendente') {
					searchParams.set('baixado', 'false');
					searchParams.set('prazo_vencido', 'false');
					searchParams.set('data_prazo_legal_inicio', dataInicio.toISOString());
					searchParams.set('data_prazo_legal_fim', dataFim.toISOString());
				} else if (filters.status === 'vencido') {
					searchParams.set('baixado', 'false');
					searchParams.set('prazo_vencido', 'true');
					// Para vencidos, não limitar por data (buscar todos)
				} else if (filters.status === 'sem_data') {
					searchParams.set('baixado', 'false');
					// Para sem data, buscar todos não baixados e filtrar localmente
					// Não passamos filtros de data
				} else {
					// Padrão: apenas pendentes
					searchParams.set('baixado', 'false');
					searchParams.set('data_prazo_legal_inicio', dataInicio.toISOString());
					searchParams.set('data_prazo_legal_fim', dataFim.toISOString());
				}

				if (filters.trt) {
					searchParams.set('trt', filters.trt);
				}
				if (filters.grau) {
					searchParams.set('grau', filters.grau);
				}
				if (filters.tipoExpedienteId !== undefined) {
					searchParams.set(
						'tipo_expediente_id',
						filters.tipoExpedienteId === null ? 'null' : filters.tipoExpedienteId.toString()
					);
				}

				const response = await fetch(
					`/api/pendentes-manifestacao?${searchParams.toString()}`
				);

				if (!response.ok) {
					const errorText = await response.text();
					console.error('Erro na resposta da API:', response.status, errorText);
					throw new Error(`Erro ao buscar expedientes: ${response.status} ${response.statusText}`);
				}

				const data = await response.json();

				if (!data.success) {
					console.error('Resposta da API sem success:', data);
					throw new Error(data.error || 'Resposta da API indicou falha');
				}

				// A API retorna { success: true, data: { pendentes: [...], paginacao: {...} } }
				const expedientes = data.data?.pendentes || [];
				
				if (!Array.isArray(expedientes)) {
					console.error('Expedientes não é um array:', expedientes);
					throw new Error('Formato de resposta inválido: expedientes não é um array');
				}

				// Filtrar localmente para "sem_data" e "pendente" se necessário
				let filteredExpedientes = expedientes;
				if (filters.status === 'sem_data') {
					// Expedientes sem data_prazo_legal_parte e não baixados
					filteredExpedientes = expedientes.filter(
						(e: Record<string, unknown>) => !e.data_prazo_legal_parte && !e.baixado_em
					);
				} else if (filters.status === 'pendente') {
					// Pendentes: não baixados, com data, e não vencidos
					filteredExpedientes = expedientes.filter(
						(e: Record<string, unknown>) =>
							!e.baixado_em &&
							e.data_prazo_legal_parte &&
							!e.prazo_vencido
					);
				}

				allExpedientes = [...allExpedientes, ...filteredExpedientes];

				// Verificar se há mais páginas
				const paginacao = data.data?.paginacao;
				if (paginacao && pagina < paginacao.totalPaginas) {
					pagina++;
				} else {
					hasMore = false;
				}
			}

			// Usar os dados já disponíveis (usuarios e tiposExpedientes passados como props)
			const usuariosList = usuarios;
			const tiposList = tiposExpedientes;

			// Converter expedientes para eventos usando os dados já disponíveis
			const { expedientesToEvents } = await import(
				'./adapters/expediente-to-event.adapter'
			);
			const { COLORS } = await import('@/components/calendar/constants');

			const newEvents = expedientesToEvents(
				allExpedientes,
				COLORS as ReadonlyArray<string>,
				usuariosList,
				tiposList
			);

			setEvents(newEvents);
		} catch (error) {
			console.error('Erro ao atualizar eventos:', error);
		} finally {
			setIsRefreshing(false);
		}
	}, [filters, usuarios, tiposExpedientes]);

	// Atualizar eventos quando filtros mudarem
	useEffect(() => {
		refreshEvents();
	}, [refreshEvents]);

	const handleFilterChange = useCallback((newFilters: ExpedientesFilters) => {
		setFilters((prev) => ({ ...prev, ...newFilters }));
	}, []);

	const handleClearFilters = useCallback(() => {
		setFilters({ status: 'pendente' });
		setSpecialView(null);
	}, []);

	// Detectar quando status muda para vencidos ou sem_data
	useEffect(() => {
		if (filters.status === 'vencido') {
			setSpecialView('vencidos');
		} else if (filters.status === 'sem_data') {
			setSpecialView('sem_data');
		} else {
			setSpecialView(null);
		}
	}, [filters.status]);

	return (
		<ExpedientesCalendarProvider
			usuarios={usuarios}
			tiposExpedientes={tiposExpedientes}
			onRefresh={refreshEvents}
		>
			<CalendarProvider
				events={events}
				users={initialUsers}
				view={specialView ? 'agenda' : 'month'}
			>
				<DndProvider showConfirmation={false}>
					<div className="w-full border rounded-xl">
						<ExpedientesCalendarHeader
							filters={filters}
							onFilterChange={handleFilterChange}
							onClearFilters={handleClearFilters}
							usuarios={usuarios}
							tiposExpedientes={tiposExpedientes}
							onRefresh={refreshEvents}
							isRefreshing={isRefreshing}
						/>
						<CalendarBody />
					</div>
				</DndProvider>
			</CalendarProvider>
		</ExpedientesCalendarProvider>
	);
}

