/**
 * Feature: Agenda Eventos
 *
 * Eventos criados diretamente pelo usuário na agenda.
 */

export type {
	AgendaEvento,
	CriarAgendaEventoInput,
	AtualizarAgendaEventoInput,
	DeletarAgendaEventoInput,
	ListarAgendaEventosInput,
} from "./domain";

export {
	criarAgendaEventoSchema,
	atualizarAgendaEventoSchema,
	deletarAgendaEventoSchema,
	listarAgendaEventosSchema,
} from "./domain";

export {
	actionCriarAgendaEvento,
	actionAtualizarAgendaEvento,
	actionDeletarAgendaEvento,
} from "./actions/agenda-eventos-actions";

// Repository (server-side)
// Removed to avoid "server-only" leak to client components


// Components (placeholder - add as needed)
export {} from "./components";
