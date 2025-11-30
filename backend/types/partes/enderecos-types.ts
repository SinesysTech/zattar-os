// Re-exporta tipos de domínio e contratos de endereços
// Esta camada existe apenas para compatibilidade; novos módulos devem importar diretamente de @/types

// Re-exporta tipos de domínio
export type {
  EntidadeTipoEndereco,
  SituacaoEndereco,
  ClassificacaoEndereco,
  Endereco,
} from '@/types/domain/enderecos';

// Re-exporta tipos de contratos
export type {
  OrdenarPorEndereco,
  OrdemEndereco,
  CriarEnderecoParams,
  AtualizarEnderecoParams,
  ListarEnderecosParams,
  ListarEnderecosResult,
  BuscarEnderecosPorEntidadeParams,
  DefinirEnderecoPrincipalParams,
} from '@/types/contracts/enderecos';

// Re-exporta GrauProcesso como GrauEndereco para compatibilidade
import type { GrauProcesso } from '@/types/domain/common';
export type GrauEndereco = GrauProcesso;

// Constantes específicas do backend

/** Situações de endereço válidas */
export const SITUACOES_ENDERECO = ['A', 'I', 'P', 'H'] as const;

/** Campos mínimos para endereço válido (pelo menos um deve estar presente) */
export const CAMPOS_MINIMOS_ENDERECO = ['logradouro', 'municipio', 'cep'] as const;

// Tipos adicionais específicos do backend

/**
 * Resultado de validação de endereço
 */
export interface ValidacaoEnderecoResult {
  valido: boolean;
  avisos: string[];
}
