/**
 * @deprecated MIGRADO PARA src/core/partes/domain
 * Este arquivo sera removido em versao futura.
 * Use: import { Cliente, CreateClienteInput, ... } from '@/core/partes'
 */

// Re-exporta tipos de domínio e contratos de clientes
// Esta camada existe apenas para compatibilidade; novos módulos devem importar diretamente de @/types

// Re-exporta tipos de domínio
export type {
  ClienteBase,
  ClientePessoaFisica,
  ClientePessoaJuridica,
  Cliente,
} from '@/types/domain/partes';

// Re-exporta tipos comuns de domínio
export type {
  TipoPessoa,
  SituacaoPJE,
} from '@/types/domain/common';

// Re-exporta tipos de contratos
export type {
  CriarClientePFParams,
  CriarClientePJParams,
  CriarClienteParams,
  AtualizarClientePFParams,
  AtualizarClientePJParams,
  AtualizarClienteParams,
  OrdenarPorCliente,
  OrdemCliente,
  ListarClientesParams,
  ListarClientesResult,
  UpsertClientePorCPFParams,
  UpsertClientePorCNPJParams,
  UpsertClientePorDocumentoParams,
} from '@/types/contracts/partes';

// Re-exporta GrauProcesso como GrauCliente para compatibilidade
import type { GrauProcesso } from '@/types/domain/common';
export type GrauCliente = GrauProcesso;

// Tipos adicionais específicos do backend (com relacionamentos)
import type { Endereco } from '@/types/domain/enderecos';
import type { ClientePessoaFisica, ClientePessoaJuridica } from '@/types/domain/partes';

/**
 * Cliente PF com endereço populado (JOIN)
 */
export interface ClientePessoaFisicaComEndereco extends ClientePessoaFisica {
  endereco?: Endereco | null;
}

/**
 * Cliente PJ com endereço populado (JOIN)
 */
export interface ClientePessoaJuridicaComEndereco extends ClientePessoaJuridica {
  endereco?: Endereco | null;
}

/**
 * Cliente com endereço populado (Discriminated Union)
 */
export type ClienteComEndereco = ClientePessoaFisicaComEndereco | ClientePessoaJuridicaComEndereco;
