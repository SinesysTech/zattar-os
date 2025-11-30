// Re-exporta tipos de domínio e contratos de acervo
// Esta camada existe apenas para compatibilidade; novos módulos devem importar diretamente de @/types

// Re-exporta tipos de domínio
export type {
  OrigemAcervo,
  Acervo,
  AgrupamentoAcervo,
  ProcessoInstancia,
  ProcessoUnificado,
} from '@/types/domain/acervo';

// Re-exporta tipos de contratos
export type {
  OrdenarPorAcervo,
  AgruparPorAcervo,
  OrdemAcervo,
  ListarAcervoParams,
  ListarAcervoResult,
  ListarAcervoAgrupadoResult,
  ListarAcervoUnificadoResult,
} from '@/types/contracts/acervo';

// Re-exporta GrauProcesso como GrauAcervo para compatibilidade
import type { GrauProcesso } from '@/types/domain/common';
export type GrauAcervo = GrauProcesso;
