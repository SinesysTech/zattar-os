/**
 * Arquivo: partes/index.ts
 *
 * PROPÓSITO:
 * Centraliza as exportações do módulo de API de partes do PJE-TRT.
 *
 * EXPORTAÇÕES:
 * - obterPartesProcesso: Busca todas as partes de um processo
 * - obterRepresentantesPartePorID: Busca representantes de uma parte específica
 * - Tipos: PartePJE, RepresentantePJE, TelefoneContato
 */

export { obterPartesProcesso } from './obter-partes';
export { obterRepresentantesPartePorID } from './obter-representantes';
export type { PartePJE, RepresentantePJE, TelefoneContato } from './types';
