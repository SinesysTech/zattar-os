/**
 * Feature: Calendar
 *
 * Barrel export para a Agenda global (agregação de eventos).
 */

// ============================================================================
// Actions
// ============================================================================
export { actionListarEventosCalendar, actionListarBriefingData } from "./actions";

// ============================================================================
// Types / Domain
// ============================================================================
export type {
	UnifiedCalendarEvent,
	CalendarSource,
	ListarEventosCalendarInput,
	CalendarEvent,
	LegacyCalendarView,
} from "./domain";

export {
	CALENDAR_SOURCES,
	calendarSourceSchema,
	unifiedCalendarEventSchema,
	listarEventosCalendarSchema,
	buildUnifiedEventId,
} from "./domain";

// ============================================================================
// Briefing Domain
// ============================================================================
export type {
	PrepStatus,
	CalendarView,
	BriefingEventMeta,
	DaySummary,
	WeekPulseDay,
	EventColor,
	ColorConfig,
	SourceConfig,
} from "./briefing-domain";

export {
	COLOR_MAP,
	SOURCE_CONFIG,
} from "./briefing-domain";

// ============================================================================
// Briefing Helpers
// ============================================================================
export {
	extractMeta,
	getEventsForDay,
	getTimedEvents,
	getAllDayEvents,
	generateWeekPulse,
	getDaySummary,
	buildBriefingText,
	isSameDay,
	isToday,
	addDays,
	startOfWeek,
	fmtTime,
	fmtDate,
	fmtDateFull,
	weekdayShort,
	weekdayFull,
	monthName,
} from "./briefing-helpers";

// ============================================================================
// Utils
// ============================================================================
export type { TravelEstimate } from "./travel-helpers";
export { estimateTravelTime } from "./travel-helpers";

// ============================================================================
// Components
// ============================================================================
export { EventDialog } from "./components/event-dialog";
export { EventCalendar } from "./components/event-calendar";

// ============================================================================
// Constants
// ============================================================================
export { AgendaDaysToShow } from "./constants";
