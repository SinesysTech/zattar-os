/**
 * Componente de calendário integrado com expedientes
 * Versão para sandbox com API real
 */

import React from 'react';
import { ExpedientesCalendarWrapper } from './expedientes-calendar-wrapper';
import {
	getExpedientesEvents,
	getExpedientesUsers,
} from './requests-expedientes';
import { obterUsuarios } from '@/backend/usuarios/services/usuarios/listar-usuarios.service';
import { listarTiposExpedientes } from '@/backend/tipos-expedientes/services/tipos-expedientes/listar-tipos-expedientes.service';
import type { ListarTiposExpedientesParams } from '@/backend/types/tipos-expedientes/types';

async function getExpedientesCalendarData() {
	// Buscar expedientes para um range amplo (últimos 3 meses e próximos 3 meses)
	const now = new Date();
	const dataInicio = new Date(now);
	dataInicio.setMonth(now.getMonth() - 3);
	const dataFim = new Date(now);
	dataFim.setMonth(now.getMonth() + 3);

	// Buscar dados em paralelo
	const [events, users, usuariosResult, tiposResult] = await Promise.all([
		getExpedientesEvents({
			dataInicio: dataInicio.toISOString(),
			dataFim: dataFim.toISOString(),
			baixado: false, // Apenas expedientes pendentes
			limite: 1000,
		}),
		getExpedientesUsers(),
		obterUsuarios({ ativo: true, limite: 100 }),
		listarTiposExpedientes({ limite: 100 } as ListarTiposExpedientesParams),
	]);

	return {
		events,
		users,
		usuarios: usuariosResult.usuarios || [],
		tiposExpedientes: tiposResult.tipos_expedientes || [],
	};
}

export async function ExpedientesCalendar() {
	const { events, users, usuarios, tiposExpedientes } =
		await getExpedientesCalendarData();

	return (
		<ExpedientesCalendarWrapper
			initialEvents={events}
			initialUsers={users}
			usuarios={usuarios}
			tiposExpedientes={tiposExpedientes}
		/>
	);
}

