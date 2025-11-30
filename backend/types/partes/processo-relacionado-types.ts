// Re-exporta tipos de processo relacionado
// Esta camada existe apenas para compatibilidade; novos módulos devem importar diretamente de @/types

export type {
  ProcessoRelacionado,
  EntidadeComProcessos,
} from '@/types/domain/processo-relacionado';
