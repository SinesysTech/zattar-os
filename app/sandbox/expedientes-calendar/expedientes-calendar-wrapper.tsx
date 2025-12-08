/**
 * Wrapper para gerenciar filtros e atualização de expedientes no calendário
 * Converte o componente Server Component em Client Component com estado
 */

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { CalendarBody } from '@/components/calendar-body';
import { CalendarProvider } from '@/components/calendar-context';
import { DndProvider } from '@/components/dnd-context';
import { ExpedientesCalendarHeader } from './expedientes-calendar-header';
import { ExpedientesCalendarProvider } from './contexts/expedientes-calendar-context';
import type { IEvent, IUser } from '@/components/interfaces';
import type { Usuario } from '@/backend/usuarios/services/persistence/usuario-persistence.service';
import type { TipoExpediente } from '@/backend/types/tipos-expedientes/types';

interface ExpedientesFilters {
	trt?: string;
	grau?: 'primeiro_grau' | 'segundo_grau' | 'tribunal_superior';
	responsavelId?: number | null;
	tipoExpedienteId?: number | null;
	baixado?: boolean;
	prazoVencido?: boolean;
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
		baixado: false, // Padrão: apenas pendentes
	});
	const [isRefreshing, setIsRefreshing] = useState(false);

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
			let allExpedientes: any[] = [];
			let pagina = 1;
			const limite = 100; // API aceita máximo 100
			let hasMore = true;

			while (hasMore) {
				// Construir parâmetros de busca
				const searchParams = new URLSearchParams();
				searchParams.set('pagina', pagina.toString());
				searchParams.set('limite', limite.toString());
				searchParams.set('data_prazo_legal_inicio', dataInicio.toISOString());
				searchParams.set('data_prazo_legal_fim', dataFim.toISOString());

				if (filters.baixado !== undefined) {
					searchParams.set('baixado', filters.baixado.toString());
				}
				if (filters.trt) {
					searchParams.set('trt', filters.trt);
				}
				if (filters.grau) {
					searchParams.set('grau', filters.grau);
				}
				if (filters.responsavelId !== undefined) {
					searchParams.set(
						'responsavel_id',
						filters.responsavelId === null ? 'null' : filters.responsavelId.toString()
					);
				}
				if (filters.tipoExpedienteId !== undefined) {
					searchParams.set(
						'tipo_expediente_id',
						filters.tipoExpedienteId === null ? 'null' : filters.tipoExpedienteId.toString()
					);
				}
				if (filters.prazoVencido !== undefined) {
					searchParams.set('prazo_vencido', filters.prazoVencido.toString());
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

				allExpedientes = [...allExpedientes, ...expedientes];

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
			const { COLORS } = await import('@/components/constants');

			const newEvents = expedientesToEvents(
				allExpedientes,
				COLORS as any,
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
		setFilters({ baixado: false });
	}, []);

	return (
		<ExpedientesCalendarProvider
			usuarios={usuarios}
			tiposExpedientes={tiposExpedientes}
			onRefresh={refreshEvents}
		>
			<CalendarProvider events={events} users={initialUsers} view="month">
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

