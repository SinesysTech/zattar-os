/**
 * Página de validação do calendário de expedientes
 * Sandbox para testar integração completa antes de implementar nas páginas reais
 */

import React, { Suspense } from 'react';
import { ExpedientesCalendar } from './expedientes-calendar';
import { CalendarSkeleton } from '@/components/calendar-skeleton';

export default function ExpedientesCalendarSandboxPage() {
	return (
		<div className="container mx-auto p-6">
			<div className="mb-6">
				<h1 className="text-3xl font-bold">Calendário de Expedientes - Validação</h1>
				<p className="text-muted-foreground mt-2">
					Página de teste para validar a integração do Full Calendar com expedientes.
					Esta página usa dados reais da API.
				</p>
			</div>

			<Suspense fallback={<CalendarSkeleton />}>
				<ExpedientesCalendar />
			</Suspense>
		</div>
	);
}

