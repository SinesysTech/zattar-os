/**
 * CONTRATOS MODULE - Exports públicos
 *
 * Este arquivo expõe a API pública do módulo de contratos.
 * Evita importações diretas dos arquivos internos.
 */

// Domain - Tipos, interfaces e schemas Zod
export * from './domain';

// Service - Funções de negócio (use estes nas actions)
export {
  criarContrato,
  buscarContrato,
  listarContratos,
  atualizarContrato,
} from './service';

// Repository - Funções de persistência (não usar diretamente nas actions)
// Exportado apenas para uso interno ou testes
export {
  findContratoById,
  findAllContratos,
  saveContrato,
  updateContrato,
  clienteExists,
  parteContrariaExists,
} from './repository';
