/**
 * ENDERECOS SERVICE
 *
 * Logica de negocio para Enderecos.
 */

import { Result } from '@/lib/types';
import * as repository from './repository';
import * as domain from './domain';
import type {
  Endereco,
  CriarEnderecoParams,
  AtualizarEnderecoParams,
  ListarEnderecosParams,
  ListarEnderecosResult,
  BuscarEnderecosPorEntidadeParams,
} from './types';

// ============================================================================
// PUBLIC API
// ============================================================================

export async function criarEndereco(
  params: CriarEnderecoParams
): Promise<Result<Endereco>> {
  // Validacao com Zod pode ser adicionada aqui se necessario
  // const validation = domain.enderecoSchema.safeParse(params);
  // if (!validation.success) ...

  return repository.criarEndereco(params);
}

export async function atualizarEndereco(
  params: AtualizarEnderecoParams
): Promise<Result<Endereco>> {
  return repository.atualizarEndereco(params);
}

export async function buscarEnderecoPorId(id: number): Promise<Result<Endereco>> {
  return repository.buscarEnderecoPorId(id);
}

export async function buscarEnderecosPorEntidade(
  params: BuscarEnderecosPorEntidadeParams
): Promise<Result<Endereco[]>> {
  return repository.buscarEnderecosPorEntidade(params);
}

export async function listarEnderecos(
  params: ListarEnderecosParams
): Promise<Result<ListarEnderecosResult>> {
  return repository.listarEnderecos(params);
}

export async function deletarEndereco(id: number): Promise<Result<void>> {
  return repository.deletarEndereco(id);
}
