/**
 * Testes de Integração - Assinatura Digital
 *
 * Suite completa de testes para o módulo de assinatura digital.
 * Executa testes de CRUD para templates, formulários, segmentos e signature service.
 *
 * Para executar apenas estes testes:
 * npm test -- --testPathPattern=assinatura-digital
 */

// Re-exportar todos os testes
export * from './templates.integration.test';
export * from './segmentos.integration.test';
export * from './formularios.integration.test';
export * from './signature.integration.test';
