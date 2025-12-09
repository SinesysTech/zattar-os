/**
 * Traduções para o calendário de expedientes
 * Centraliza todos os textos em português
 */

export const translations = {
	// Header
	addEvent: 'Adicionar Evento',
	today: 'Hoje',
	all: 'Todos',
	clearFilter: 'Limpar Filtro',
	calendarSettings: 'Configurações do Calendário',

	// Views
	agenda: 'Agenda',
	day: 'Dia',
	week: 'Semana',
	month: 'Mês',
	year: 'Ano',

	// Date Navigator
	events: 'eventos',
	event: 'evento',

	// Day View
	happeningNow: 'Acontecendo agora',
	noAppointments: 'Nenhum expediente ou consulta no momento',

	// Month View
	addEventShort: 'Adicionar',

	// Settings
	use24HourFormat: 'Usar formato 24 horas',
	badgeVariant: 'Variante do Badge',
	agendaModeGroupBy: 'Agrupar por',
	groupByDay: 'Dia',
	groupByWeek: 'Semana',
	groupByMonth: 'Mês',

	// User Select
	allUsers: 'Todos os usuários',
	noResponsible: 'Sem responsável',

	// Filter
	filter: 'Filtrar',
	clear: 'Limpar',

	// Event Dialog
	editEvent: 'Editar Evento',
	createEvent: 'Criar Evento',
	title: 'Título',
	description: 'Descrição',
	startDate: 'Data de Início',
	endDate: 'Data de Fim',
	user: 'Usuário',
	color: 'Cor',
	save: 'Salvar',
	cancel: 'Cancelar',
	delete: 'Excluir',
	deleteEvent: 'Excluir Evento',
	confirmDelete: 'Tem certeza que deseja excluir este evento?',

	// Drag & Drop
	confirmMove: 'Confirmar Movimentação',
	moveEvent: 'Mover Evento',
	confirmMoveMessage: 'Deseja mover este evento para a nova data/hora?',
	cancelMove: 'Cancelar',

	// Time formats
	am: 'AM',
	pm: 'PM',
} as const;

export type TranslationKey = keyof typeof translations;

