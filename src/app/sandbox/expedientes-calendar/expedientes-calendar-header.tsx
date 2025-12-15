/**
 * Header do calendário de expedientes
 * Versão traduzida e adaptada para expedientes com filtros específicos
 */

'use client';

import { motion } from 'framer-motion';

import {
	slideFromLeft,
	slideFromRight,
	transition,
} from '@/components/ui/animations';
import { useCalendar } from '@/components/calendar/calendar-context';
import { DateNavigator } from '@/components/calendar/date-navigator';
import { TodayButton } from '@/components/calendar/today-button';
import { UserSelect } from '@/components/shared/user-select';
import { Settings } from '@/components/calendar/settings';
import Views from '@/components/calendar/view-tabs';
import { ExpedientesFilters } from './components/expedientes-filters';
import type { TipoExpediente } from '@/features/tipos-expedientes';

interface ExpedientesFiltersState {
	trt?: string;
	grau?: 'primeiro_grau' | 'segundo_grau' | 'tribunal_superior';
	tipoExpedienteId?: number | null;
	status?: 'pendente' | 'vencido' | 'sem_data' | 'baixados';
}

interface ExpedientesCalendarHeaderProps {
	filters?: ExpedientesFiltersState;
	onFilterChange?: (filters: ExpedientesFiltersState) => void;
	onClearFilters?: () => void;
	tiposExpedientes?: TipoExpediente[];
}

export function ExpedientesCalendarHeader({
	filters = {},
	onFilterChange,
	onClearFilters,
	tiposExpedientes = [],
}: ExpedientesCalendarHeaderProps) {
	const { view, events } = useCalendar();

	return (
		<div className="flex flex-col gap-4 border-b p-4 lg:flex-row lg:items-center lg:justify-between">
			<motion.div
				className="flex items-center gap-3"
				variants={slideFromLeft}
				initial="initial"
				animate="animate"
				transition={transition}
			>
				<TodayButton />
				<DateNavigator view={view} events={events} />
			</motion.div>

			<motion.div
				className="flex flex-col gap-4 lg:flex-row lg:items-center lg:gap-1.5"
				variants={slideFromRight}
				initial="initial"
				animate="animate"
				transition={transition}
			>
				<div className="options flex-wrap flex items-center gap-4 md:gap-2">
					{onFilterChange && onClearFilters && (
						<ExpedientesFilters
							tiposExpedientes={tiposExpedientes}
							selectedFilters={filters}
							onFilterChange={onFilterChange}
							onClearFilters={onClearFilters}
						/>
					)}
					{/* Ocultar Views quando estiver em visualização especial (vencidos/sem_data) */}
					{filters?.status !== 'vencido' && filters?.status !== 'sem_data' && <Views />}
				</div>

				<div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:gap-1.5">
					<UserSelect />
				</div>
				<Settings />
			</motion.div>
		</div>
	);
}

