/**
 * Tipos para Acervo
 * Re-exporta tipos do domain.ts para compatibilidade de imports
 */

export type {
  OrigemAcervo,
  GrauAcervo,
  Acervo,
  ProcessoInstancia,
  ProcessoUnificado,
  AgrupamentoAcervo,
  OrdenarPorAcervo,
  AgruparPorAcervo,
  OrdemAcervo,
  ListarAcervoParams,
  ListarAcervoResult,
  ListarAcervoAgrupadoResult,
  ListarAcervoUnificadoResult,
  ProcessoClienteCpfRow,
  ClienteRespostaIA,
  ResumoProcessosIA,
  InstanciaProcessoIA,
  TimelineItemIA,
  UltimaMovimentacaoIA,
  TimelineStatus,
  ProcessoRespostaIA,
  ProcessosClienteCpfSuccessResponse,
  ProcessosClienteCpfErrorResponse,
  ProcessosClienteCpfResponse,
  InstanciaInfo,
  ProcessoClienteCPF,
  BuscarProcessosClienteCPFParams,
  TimelineItemEnriquecido,
} from './domain';

export {
  listarAcervoParamsSchema,
  atribuirResponsavelSchema,
  mapearStatusProcesso,
  converterParaAcervo,
  TRT_NOMES,
  TIPO_PARTE_NOMES,
  CLASSE_JUDICIAL_NOMES,
} from './domain';
