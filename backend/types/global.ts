// Re-exporta tipos de domínio compartilhados
// Esta camada existe apenas para compatibilidade; novos módulos devem importar diretamente de @/types

export type {
  Paginacao,
  TipoPessoa,
  SituacaoPJE,
  GrauProcesso,
} from '@/types/domain/common';
