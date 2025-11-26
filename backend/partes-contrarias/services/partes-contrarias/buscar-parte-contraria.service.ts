// Serviço de busca de parte contrária
// Gerencia a lógica de negócio para buscar partes contrárias por diferentes critérios

import {
  buscarParteContrariaPorId,
  buscarParteContrariaPorCPF,
  buscarParteContrariaPorCNPJ,
} from '../persistence/parte-contraria-persistence.service';
import type { ParteContraria } from '@/backend/types/partes/partes-contrarias-types';

/**
 * Busca uma parte contrária por ID
 */
export async function obterParteContrariaPorId(id: number): Promise<ParteContraria | null> {
  return buscarParteContrariaPorId(id);
}

/**
 * Busca uma parte contrária por CPF
 */
export async function obterParteContrariaPorCpf(cpf: string): Promise<ParteContraria | null> {
  return buscarParteContrariaPorCPF(cpf);
}

/**
 * Busca uma parte contrária por CNPJ
 */
export async function obterParteContrariaPorCnpj(cnpj: string): Promise<ParteContraria | null> {
  return buscarParteContrariaPorCNPJ(cnpj);
}

