/**
 * COMUNICA-CNJ MODULE — Barrel Export (API Pública)
 *
 * Módulo proxy — rota `/comunica-cnj` que renderiza o componente
 * `ComunicaCNJTabsContent` exportado pelo módulo `captura`.
 *
 * Toda a lógica de negócio (domínio, serviço, repositório, actions)
 * vive no módulo `captura`. Este módulo intencionalmente não possui
 * domain.ts/service.ts/repository.ts (ver RULES.md).
 */

// =============================================================================
// Re-exports from captura (convenience)
// =============================================================================

export { ComunicaCNJTabsContent } from '@/app/(authenticated)/captura';
