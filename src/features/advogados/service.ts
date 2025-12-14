/**
 * Service Layer for Advogados Feature
 * Business logic orchestration
 */

import {
  listarAdvogados as listarAdvogadosDb,
  buscarAdvogado as buscarAdvogadoDb,
  buscarAdvogadoPorCpf as buscarAdvogadoPorCpfDb,
  criarAdvogado as criarAdvogadoDb,
  atualizarAdvogado as atualizarAdvogadoDb,
  listarCredenciais as listarCredenciaisDb,
  criarCredencial as criarCredencialDb,
  buscarCredencial as buscarCredencialDb,
  atualizarCredencial as atualizarCredencialDb,
} from './repository';

import type {
  ListarAdvogadosParams,
  CriarAdvogadoParams,
  AtualizarAdvogadoParams,
  ListarCredenciaisParams,
  CriarCredencialParams,
  AtualizarCredencialParams,
} from './domain';

// ============================================================================
// Advogados
// ============================================================================

export async function listarAdvogados(params: ListarAdvogadosParams = {}) {
  // Business logic: enforce max limit or specific filters if necessary
  return listarAdvogadosDb(params);
}

export async function buscarAdvogado(id: number) {
  if (!id) throw new Error('ID obrigatório');
  return buscarAdvogadoDb(id);
}

export async function buscarAdvogadoPorCpf(cpf: string) {
  if (!cpf) throw new Error('CPF obrigatório');
  // Simple validation
  const cpfClean = cpf.replace(/\D/g, '');
  if (cpfClean.length !== 11) throw new Error('CPF inválido');
  return buscarAdvogadoPorCpfDb(cpfClean);
}

export async function criarAdvogado(params: CriarAdvogadoParams) {
  // Pre-validation logic
  const cpfClean = params.cpf.replace(/\D/g, '');
  if (cpfClean.length !== 11) throw new Error('CPF inválido');
  if (params.nome_completo.length < 3) throw new Error('Nome curto demais');
  if (params.uf_oab.length !== 2) throw new Error('UF OAB inválido');
  
  return criarAdvogadoDb({
    ...params,
    cpf: cpfClean,
    nome_completo: params.nome_completo.trim(),
    oab: params.oab.trim(),
    uf_oab: params.uf_oab.toUpperCase(),
  });
}

export async function atualizarAdvogado(id: number, params: AtualizarAdvogadoParams) {
  if (!id) throw new Error('ID obrigatório');
  
  if (params.cpf) {
      const cpfClean = params.cpf.replace(/\D/g, '');
      if (cpfClean.length !== 11) throw new Error('CPF inválido');
      params.cpf = cpfClean;
  }
  
  return atualizarAdvogadoDb(id, params);
}

// ============================================================================
// Credenciais
// ============================================================================

export async function listarCredenciais(params: ListarCredenciaisParams) {
  // Se advogado_id vier, validamos minimamente.
  if (params.advogado_id !== undefined && params.advogado_id <= 0) {
    throw new Error('Advogado ID inválido');
  }
  return listarCredenciaisDb(params);
}

export async function criarCredencial(params: CriarCredencialParams) {
  if (!params.advogado_id) throw new Error('Advogado ID obrigatório');
  if (!params.tribunal) throw new Error('Tribunal obrigatório');
  if (!params.senha) throw new Error('Senha obrigatória');
  // Could add specific tribunal validation here
  
  return criarCredencialDb(params);
}

export async function buscarCredencial(id: number) {
  return buscarCredencialDb(id);
}

export async function atualizarCredencial(id: number, params: AtualizarCredencialParams) {
    return atualizarCredencialDb(id, params);
}
