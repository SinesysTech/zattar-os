/**
 * Barrel export principal do módulo financeiro
 *
 * Este é o ponto de entrada principal para o módulo financeiro.
 * Importações devem ser feitas preferencialmente a partir deste arquivo:
 *
 * @example
 * import { LancamentosService, actionCriarLancamento } from '@/features/financeiro';
 * import { useDRE, useOrcamentos } from '@/features/financeiro/hooks';
 * import { ImportarExtratoDialog } from '@/features/financeiro/components';
 */

// Domain Layer - Regras de negócio puras
export * from './domain';

// Repository Layer - Acesso a dados
export * from './repository';

// Service Layer - Orquestração de casos de uso
export * from './services';

// Actions - Server Actions para Next.js
export * from './actions';

// Services - Re-exportar serviços de orçamentos (exported as namespace to avoid conflicts with hooks)
export * as orcamentosService from './services/orcamentos';
export * from './services/recorrencia';

// Utils - Re-exportar utilitários de exportação
export * from './utils/export';

// Hooks - Re-exportar hooks
export * from './hooks';

// Components - Re-exportar componentes para uso externo
export * from './components';
