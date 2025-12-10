/**
 * @deprecated MIGRADO PARA src/core/partes/domain
 * Este arquivo sera removido em versao futura.
 * Use: import { ParteContraria, CreateParteContrariaInput, ... } from '@/core/partes'
 */

// Re-exporta tipos de domínio e contratos de partes contrárias
// Esta camada existe apenas para compatibilidade; novos módulos devem importar diretamente de @/types

// Re-exporta tipos de domínio
export type {
  ParteContrariaPessoaFisica,
  ParteContrariaPessoaJuridica,
  ParteContraria,
} from '@/types/domain/partes';

// Re-exporta tipos comuns de domínio
export type {
  TipoPessoa,
  SituacaoPJE,
} from '@/types/domain/common';

// Re-exporta tipos de contratos
export type {
  CriarParteContrariaPFParams,
  CriarParteContrariaPJParams,
  CriarParteContrariaParams,
  AtualizarParteContrariaPFParams,
  AtualizarParteContrariaPJParams,
  AtualizarParteContrariaParams,
  OrdenarPorParteContraria,
  OrdemParteContraria,
  ListarPartesContrariasParams,
  ListarPartesContrariasResult,
  UpsertParteContrariaPorCPFParams,
  UpsertParteContrariaPorCNPJParams,
  UpsertParteContrariaPorDocumentoParams,
} from '@/types/contracts/partes';

// Re-exporta GrauProcesso como GrauParteContraria para compatibilidade
import type { GrauProcesso } from '@/types/domain/common';
export type GrauParteContraria = GrauProcesso;

// Tipos adicionais específicos do backend (com relacionamentos)
import type { Endereco } from '@/types/domain/enderecos';
import type { ParteContrariaPessoaFisica, ParteContrariaPessoaJuridica } from '@/types/domain/partes';

/**
 * Parte contrária PF com endereço populado (JOIN)
 */
export interface ParteContrariaPessoaFisicaComEndereco extends ParteContrariaPessoaFisica {
  endereco?: Endereco | null;
}

/**
 * Parte contrária PJ com endereço populado (JOIN)
 */
export interface ParteContrariaPessoaJuridicaComEndereco extends ParteContrariaPessoaJuridica {
  endereco?: Endereco | null;
}

/**
 * Parte contrária com endereço populado (Discriminated Union)
 */
export type ParteContrariaComEndereco = ParteContrariaPessoaFisicaComEndereco | ParteContrariaPessoaJuridicaComEndereco;
