/**
 * Feature: Calendar
 *
 * Barrel export para a Agenda global (agregação de eventos).
 * Nota: componentes do template em `src/app/app/calendar/*` permanecem como UI.
 */

export type {
	UnifiedCalendarEvent,
	CalendarSource,
	ListarEventosCalendarInput,
} from "./domain";

export {
	CALENDAR_SOURCES,
	calendarSourceSchema,
	unifiedCalendarEventSchema,
	listarEventosCalendarSchema,
	buildUnifiedEventId,
} from "./domain";

export { actionListarEventosCalendar } from "./actions/calendar-actions";
