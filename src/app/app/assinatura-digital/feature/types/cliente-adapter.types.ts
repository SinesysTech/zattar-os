/**
 * Adapters/Types para o fluxo de Assinatura Digital.
 *
 * NOTA: A implementação principal está em ../utils/cliente-adapters.ts.
 * Este arquivo re-exporta para manter compatibilidade com o barrel types/index.ts.
 */

export {
  type ClienteFormsignPayload,
  mapClienteFormToCliente,
  clienteSinesysToAssinaturaDigital,
} from '../utils/cliente-adapters';
