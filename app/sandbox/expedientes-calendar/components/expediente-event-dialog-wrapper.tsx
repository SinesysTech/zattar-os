/**
 * Wrapper que substitui EventDetailsDialog por ExpedienteEventDialog
 * quando estiver no contexto de expedientes
 */

'use client';

import React from 'react';
import { EventDetailsDialog } from '@/components/event-details-dialog';
import { ExpedienteEventDialog } from './expediente-event-dialog';
import { useExpedientesCalendar } from '../contexts/expedientes-calendar-context';
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
	// Tentar usar o contexto de expedientes
	try {
		const { usuarios, tiposExpedientes, onRefresh } = useExpedientesCalendar();
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
	} catch {
		// Se não estiver no contexto de expedientes, usar o dialog padrão
		return <EventDetailsDialog event={event}>{children}</EventDetailsDialog>;
	}
}

