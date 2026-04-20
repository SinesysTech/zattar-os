/**
 * Barrel dos componentes do módulo Comunica CNJ.
 *
 * Desde a reorganização em 2 páginas (Pesquisa + Capturadas), os componentes
 * são agrupados em subpastas: `pesquisa/`, `capturadas/`, `shared/` e dialogs
 * compartilhados (`detalhes-dialog`, `pdf-viewer-dialog`).
 */

// Dialogs compartilhados
export { ComunicacaoDetalhesDialog } from './detalhes-dialog';
export { PdfViewerDialog } from './pdf-viewer-dialog';

// Componentes da página de Pesquisa
export * from './pesquisa';

// Componentes da página de Capturadas
export * from './capturadas';

// Navegação entre sub-páginas
export { ComunicaCnjSubnav } from './shared/comunica-cnj-subnav';

// Dialogs/banners auxiliares reaproveitados em Capturadas
export { GazetteSyncDialog } from './gazette-sync-dialog';
export { GazetteAlertBanner } from './gazette-alert-banner';
export { GazetteOrphanResolver } from './gazette-orphan-resolver';
export { GazetteTimeline } from './gazette-timeline';

// Hooks
export { useGazetteStore } from './hooks/use-gazette-store';
export { usePesquisaStore, montarParams } from './hooks/use-pesquisa-store';
