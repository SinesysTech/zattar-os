'use server';

import { findClienteByCPF } from '@/features/partes/repository';
import {
  findParteContrariaByCPF,
  findParteContrariaByCNPJ,
  findAllPartesContrarias,
} from '@/features/partes/repository';
import { normalizarDocumento } from '@/features/partes/domain';
import type { Cliente, ParteContraria } from '@/features/partes';

/**
 * Busca um cliente por CPF
 */
export async function searchClienteByCPF(cpf: string): Promise<{
  success: boolean;
  data?: Cliente | null;
  error?: string;
}> {
  try {
    if (!cpf || cpf.trim().length === 0) {
      return { success: false, error: 'CPF é obrigatório' };
    }

    const result = await findClienteByCPF(cpf);

    if (!result.success) {
      return { success: false, error: result.error.message };
    }

    return { success: true, data: result.data };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido',
    };
  }
}

/**
 * Busca uma parte contrária por CPF, CNPJ ou nome
 */
export async function searchParteContraria(params: {
  cpf?: string;
  cnpj?: string;
  nome?: string;
}): Promise<{
  success: boolean;
  data?: ParteContraria | null;
  error?: string;
}> {
  try {
    const { cpf, cnpj, nome } = params;

    // Se não houver nenhum parâmetro, retorna erro
    if (!cpf && !cnpj && !nome) {
      return { success: false, error: 'Informe CPF, CNPJ ou nome para buscar' };
    }

    // Prioridade: CPF > CNPJ > Nome
    if (cpf && cpf.trim().length > 0) {
      const cpfNormalizado = normalizarDocumento(cpf);
      const result = await findParteContrariaByCPF(cpfNormalizado);

      if (!result.success) {
        return { success: false, error: result.error.message };
      }

      if (result.data) {
        return { success: true, data: result.data };
      }
    }

    if (cnpj && cnpj.trim().length > 0) {
      const cnpjNormalizado = normalizarDocumento(cnpj);
      const result = await findParteContrariaByCNPJ(cnpjNormalizado);

      if (!result.success) {
        return { success: false, error: result.error.message };
      }

      if (result.data) {
        return { success: true, data: result.data };
      }
    }

    if (nome && nome.trim().length > 0) {
      const result = await findAllPartesContrarias({
        busca: nome.trim(),
        limite: 1,
      });

      if (!result.success) {
        return { success: false, error: result.error.message };
      }

      if (result.data.data.length > 0) {
        return { success: true, data: result.data.data[0] };
      }
    }

    // Não encontrado
    return { success: true, data: null };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido',
    };
  }
}
