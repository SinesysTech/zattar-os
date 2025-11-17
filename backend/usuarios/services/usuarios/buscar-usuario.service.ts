// Serviço de busca de usuário
// Gerencia a lógica de negócio para buscar usuários por diferentes critérios

import {
  buscarUsuarioPorId,
  buscarUsuarioPorCpf,
  buscarUsuarioPorEmail,
  type Usuario,
} from '../persistence/usuario-persistence.service';

/**
 * Busca um usuário por ID
 */
export async function obterUsuarioPorId(id: number): Promise<Usuario | null> {
  return buscarUsuarioPorId(id);
}

/**
 * Busca um usuário por CPF
 */
export async function obterUsuarioPorCpf(cpf: string): Promise<Usuario | null> {
  return buscarUsuarioPorCpf(cpf);
}

/**
 * Busca um usuário por e-mail corporativo
 */
export async function obterUsuarioPorEmail(email: string): Promise<Usuario | null> {
  return buscarUsuarioPorEmail(email);
}

