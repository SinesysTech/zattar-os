/**
 * Contexto para fornecer dados e funcionalidades específicas de expedientes
 * ao calendário
 */

'use client';

import React, { createContext, useContext, type ReactNode } from 'react';
import type { Usuario } from '@/backend/usuarios/services/persistence/usuario-persistence.service';
import type { TipoExpediente } from '@/features/tipos-expedientes';

interface ExpedientesCalendarContextValue {
	usuarios: Usuario[];
	tiposExpedientes: TipoExpediente[];
	onRefresh?: () => void;
}

const ExpedientesCalendarContext =
	createContext<ExpedientesCalendarContextValue | null>(null);

export function ExpedientesCalendarProvider({
	children,
	usuarios,
	tiposExpedientes,
	onRefresh,
}: {
	children: ReactNode;
	usuarios: Usuario[];
	tiposExpedientes: TipoExpediente[];
	onRefresh?: () => void;
}) {
	return (
		<ExpedientesCalendarContext.Provider
			value={{ usuarios, tiposExpedientes, onRefresh }}
		>
			{children}
		</ExpedientesCalendarContext.Provider>
	);
}

export function useExpedientesCalendar() {
	const context = useContext(ExpedientesCalendarContext);
	if (!context) {
		throw new Error(
			'useExpedientesCalendar must be used within ExpedientesCalendarProvider'
		);
	}
	return context;
}

/**
 * Safe version of useExpedientesCalendar that returns null when outside the provider
 * instead of throwing an error. Useful for optional context usage.
 */
export function useExpedientesCalendarSafe() {
	return useContext(ExpedientesCalendarContext);
}

