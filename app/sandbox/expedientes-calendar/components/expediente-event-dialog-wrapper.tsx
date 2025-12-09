/**
 * Wrapper que substitui EventDetailsDialog por ExpedienteEventDialog
 * quando estiver no contexto de expedientes
 */

'use client';

import React from 'react';
import { EventDetailsDialog } from '@/components/event-details-dialog';
import { ExpedienteEventDialog } from './expediente-event-dialog';
import { useExpedientesCalendarSafe } from '../contexts/expedientes-calendar-context';
import type { IEvent } from '@/components/interfaces';
import type { ReactNode } from 'react';

interface ExpedienteEventDialogWrapperProps {
	event: IEvent;
	children: ReactNode;
}

export function ExpedienteEventDialogWrapper({
	event,
	children,
}: ExpedienteEventDialogWrapperProps) {
	// Usar a versão safe do hook que retorna null quando fora do contexto
	const contextData = useExpedientesCalendarSafe();

	if (contextData) {
		const { usuarios, tiposExpedientes, onRefresh } = contextData;
		return (
			<ExpedienteEventDialog
				event={event}
				usuarios={usuarios}
				tiposExpedientes={tiposExpedientes}
				onUpdate={onRefresh}
			>
				{children}
			</ExpedienteEventDialog>
		);
	}

	// Se não estiver no contexto de expedientes, usar o dialog padrão
	return <EventDetailsDialog event={event}>{children}</EventDetailsDialog>;
}

