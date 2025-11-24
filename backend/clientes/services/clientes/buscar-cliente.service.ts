// Serviço de busca de cliente
// Gerencia a lógica de negócio para buscar clientes por diferentes critérios

import {
  buscarClientePorId,
  buscarClientePorCpf,
  buscarClientePorCnpj,
} from '../persistence/cliente-persistence.service';
import type { Cliente } from '@/backend/types/partes/clientes-types';

/**
 * Busca um cliente por ID
 */
export async function obterClientePorId(id: number): Promise<Cliente | null> {
  return buscarClientePorId(id);
}

/**
 * Busca um cliente por CPF
 */
export async function obterClientePorCpf(cpf: string): Promise<Cliente | null> {
  return buscarClientePorCpf(cpf);
}

/**
 * Busca um cliente por CNPJ
 */
export async function obterClientePorCnpj(cnpj: string): Promise<Cliente | null> {
  return buscarClientePorCnpj(cnpj);
}

