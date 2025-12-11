/**
 * Partes > Representantes > Service
 *
 * Camada de regras de negócio/validação para representantes.
 * Mantém assinaturas compatíveis com o contrato usado no app.
 */

import type {
  AtualizarRepresentanteParams,
  BuscarRepresentantesPorOABParams,
  CriarRepresentanteParams,
  ListarRepresentantesParams,
  ListarRepresentantesResult,
  OperacaoRepresentanteResult,
  Representante,
  RepresentanteComEndereco,
  UpsertRepresentantePorCPFParams,
} from '../types/representantes-types';
import * as repo from './repository';

function normalizarCpf(cpf: string): string {
  return cpf.replace(/[.\-\s]/g, '');
}

function validarCpfBasico(cpf: string): boolean {
  const d = normalizarCpf(cpf);
  return d.length === 11 && !/^(\d)\1{10}$/.test(d);
}

export async function listarRepresentantes(params: ListarRepresentantesParams): Promise<ListarRepresentantesResult> {
  return await repo.listarRepresentantes(params);
}

export async function listarRepresentantesComEndereco(
  params: ListarRepresentantesParams
): Promise<ListarRepresentantesResult> {
  return await repo.listarRepresentantesComEndereco(params);
}

export async function listarRepresentantesComEnderecoEProcessos(
  params: ListarRepresentantesParams
): Promise<ListarRepresentantesResult> {
  return await repo.listarRepresentantesComEnderecoEProcessos(params);
}

export async function buscarRepresentantePorId(id: number): Promise<Representante | null> {
  return await repo.buscarRepresentantePorId(id);
}

export async function buscarRepresentantePorIdComEndereco(
  id: number
): Promise<RepresentanteComEndereco | null> {
  return await repo.buscarRepresentantePorIdComEndereco(id);
}

export async function buscarRepresentantePorCPF(cpf: string): Promise<Representante | null> {
  return await repo.buscarRepresentantePorCPF(cpf);
}

export async function buscarRepresentantePorNome(nome: string): Promise<Representante[]> {
  const n = nome.trim();
  if (n.length < 3) throw new Error('Nome deve ter pelo menos 3 caracteres para busca.');
  return await repo.buscarRepresentantePorNome(n);
}

export async function buscarRepresentantesPorOAB(
  params: BuscarRepresentantesPorOABParams
): Promise<Representante[]> {
  if (!params.oab?.trim()) throw new Error('Número OAB não informado');
  return await repo.buscarRepresentantesPorOAB(params);
}

export async function criarRepresentante(params: CriarRepresentanteParams): Promise<OperacaoRepresentanteResult> {
  if (!params.cpf || !params.nome) {
    return { sucesso: false, erro: 'Campos obrigatórios não informados (cpf, nome)' };
  }
  if (!validarCpfBasico(params.cpf)) {
    return { sucesso: false, erro: 'CPF inválido' };
  }
  return await repo.criarRepresentante(params);
}

export async function atualizarRepresentante(
  params: AtualizarRepresentanteParams
): Promise<OperacaoRepresentanteResult> {
  if (!params.id || params.id <= 0) return { sucesso: false, erro: 'ID inválido' };
  if (params.cpf && !validarCpfBasico(params.cpf)) return { sucesso: false, erro: 'CPF inválido' };
  return await repo.atualizarRepresentante(params);
}

export async function deletarRepresentante(id: number): Promise<{ sucesso: boolean; erro?: string }> {
  if (!id || id <= 0) return { sucesso: false, erro: 'ID inválido' };
  return await repo.deletarRepresentante(id);
}

export async function upsertRepresentantePorCPF(
  params: UpsertRepresentantePorCPFParams
): Promise<{ sucesso: boolean; representante?: Representante; criado: boolean; erro?: string }> {
  if (!params.cpf || !params.nome) {
    return { sucesso: false, erro: 'Campos obrigatórios não informados (cpf, nome)', criado: false };
  }
  if (!validarCpfBasico(params.cpf)) {
    return { sucesso: false, erro: 'CPF inválido', criado: false };
  }
  return await repo.upsertRepresentantePorCPF(params);
}


