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
} from '@/types/contracts/partes';

// Tipos adicionais específicos do backend (com relacionamentos)
import type { Endereco } from './enderecos-types';
import type { TerceiroPessoaFisica, TerceiroPessoaJuridica, TipoParteTerceiro, PoloTerceiro } from '@/types/domain/partes';

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
 * Upsert terceiro por id_pessoa_pje (tabela global)
 * Usado para captura de terceiros do PJE onde id_pessoa_pje é o identificador único
 */
export interface UpsertTerceiroPorIdPessoaParams {
  id_pessoa_pje: number;
  tipo_parte: TipoParteTerceiro;
  polo: PoloTerceiro;
  tipo_pessoa: 'pf' | 'pj';
  nome: string;
  cpf?: string;
  cnpj?: string;
  nome_fantasia?: string;
  emails?: string[];
  ddd_celular?: string;
  numero_celular?: string;
  ddd_residencial?: string;
  numero_residencial?: string;
  ddd_comercial?: string;
  numero_comercial?: string;
  observacoes?: string;
}

/**
 * Parâmetros para buscar terceiros de um processo
 */
export interface BuscarTerceirosPorProcessoParams {
  processo_id: number;
  tipo_parte?: TipoParteTerceiro;
}
