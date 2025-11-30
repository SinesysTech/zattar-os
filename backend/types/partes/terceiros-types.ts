// Re-exporta tipos de domínio e contratos de terceiros
// Esta camada existe apenas para compatibilidade; novos módulos devem importar diretamente de @/types

// Re-exporta tipos de domínio
export type {
  TipoParteTerceiro,
  PoloTerceiro,
  TerceiroPessoaFisica,
  TerceiroPessoaJuridica,
  Terceiro,
} from '@/types/domain/partes';

// Re-exporta tipos comuns de domínio
export type {
  TipoPessoa,
  SituacaoPJE,
} from '@/types/domain/common';

// Re-exporta tipos de contratos
export type {
  CriarTerceiroPFParams,
  CriarTerceiroPJParams,
  CriarTerceiroParams,
  AtualizarTerceiroPFParams,
  AtualizarTerceiroPJParams,
  AtualizarTerceiroParams,
  OrdenarPorTerceiro,
  OrdemTerceiro,
  ListarTerceirosParams,
  ListarTerceirosResult,
  UpsertTerceiroPorCPFParams,
  UpsertTerceiroPorCNPJParams,
  UpsertTerceiroPorDocumentoParams,
  UpsertTerceiroPorIdPessoaParams,
} from '@/types/contracts/partes';

// Tipos adicionais específicos do backend (com relacionamentos)
import type { Endereco } from '@/types/domain/enderecos';
import type { TerceiroPessoaFisica, TerceiroPessoaJuridica, TipoParteTerceiro } from '@/types/domain/partes';

/**
 * Terceiro PF com endereço populado (JOIN)
 */
export interface TerceiroPessoaFisicaComEndereco extends TerceiroPessoaFisica {
  endereco?: Endereco | null;
}

/**
 * Terceiro PJ com endereço populado (JOIN)
 */
export interface TerceiroPessoaJuridicaComEndereco extends TerceiroPessoaJuridica {
  endereco?: Endereco | null;
}

/**
 * Terceiro com endereço populado (Discriminated Union)
 */
export type TerceiroComEndereco = TerceiroPessoaFisicaComEndereco | TerceiroPessoaJuridicaComEndereco;

/**
 * Parâmetros para buscar terceiros de um processo
 */
export interface BuscarTerceirosPorProcessoParams {
  processo_id: number;
  tipo_parte?: TipoParteTerceiro;
}
