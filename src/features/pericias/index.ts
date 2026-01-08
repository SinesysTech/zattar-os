export * from './domain';
export * from './service';
// Repository não é re-exportado para evitar conflito com service (ambos exportam criarPericia)
// Use o service para operações públicas
export * from './actions/pericias-actions';

// Components
export { PericiasContent } from './components/pericias-content';
export { PericiasTableWrapper } from './components/pericias-table-wrapper';
export { PericiasCalendarMonth } from './components/pericias-calendar-month';
export { PericiasCalendarYear } from './components/pericias-calendar-year';
export { PericiaDetalhesDialog } from './components/pericia-detalhes-dialog';


