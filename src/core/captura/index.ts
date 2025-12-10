/**
 * CAPTURA - Exports Públicos
 *
 * Módulo de captura genérico que funciona para qualquer tribunal/sistema judicial.
 * Usa drivers polimórficos para suportar PJE, ESAJ, EPROC, etc.
 */

// Service (orquestrador)
export { executarCaptura, type ExecutarCapturaParams } from './service';

// Domain (tipos e interfaces)
export type {
  Credencial,
  ConfigTribunal,
  ProcessoCapturado,
  AudienciaCapturada,
  MovimentacaoCapturada,
  ResultadoCaptura,
  TipoCaptura,
  PeriodoAudiencias,
  BuscarProcessosParams,
  SistemaJudicialSuportado,
} from './domain';

// Repository (acesso a dados)
export { buscarCredencial, buscarConfigTribunal, buscarConfigTribunalRepo } from './repository';

// Drivers (implementações específicas)
export { PjeTrtDriver } from './drivers/pje/trt-driver';
export type { JudicialDriver, SessaoAutenticada } from './drivers/judicial-driver.interface';

// Factory
export { getDriver } from './drivers/factory';
