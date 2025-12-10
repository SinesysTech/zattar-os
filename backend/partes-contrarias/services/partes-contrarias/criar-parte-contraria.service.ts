/**
 * @deprecated MIGRADO PARA src/core/partes
 * Este arquivo sera removido em versao futura.
 * Use: import { criarParteContraria } from '@/core/partes'
 */

// Serviço de criação de parte contrária
// Gerencia a lógica de negócio para cadastrar novas partes contrárias

import {
  criarParteContraria as criarParteContrariaDb,
  type OperacaoParteContrariaResult,
} from '../persistence/parte-contraria-persistence.service';
import type { CriarParteContrariaParams } from '@/backend/types/partes';

/**
 * Cadastra uma nova parte contrária no sistema
 *
 * Fluxo:
 * 1. Valida os dados de entrada
 * 2. Verifica duplicidades (CPF/CNPJ)
 * 3. Cria o registro no banco de dados
 * 4. Retorna a parte contrária criada ou erro
 */
export async function cadastrarParteContraria(
  params: CriarParteContrariaParams
): Promise<OperacaoParteContrariaResult> {
  console.log('📝 Iniciando cadastro de parte contrária...', {
    tipo_pessoa: params.tipo_pessoa,
    nome: params.nome,
    documento: params.tipo_pessoa === 'pf'
      ? params.cpf?.replace(/\D/g, '').replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '***.***.$3-$4')
      : params.cnpj?.replace(/\D/g, '').replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.***.$3/$4-$5'),
  });

  try {
    const resultado = await criarParteContrariaDb(params);

    if (resultado.sucesso && resultado.parteContraria) {
      console.log('✅ Parte contrária cadastrada com sucesso:', {
        id: resultado.parteContraria.id,
        tipo_pessoa: resultado.parteContraria.tipo_pessoa,
        nome: resultado.parteContraria.nome,
      });
    } else {
      console.error('❌ Erro ao cadastrar parte contrária:', resultado.erro);
    }

    return resultado;
  } catch (error) {
    const erroMsg = error instanceof Error ? error.message : String(error);
    console.error('❌ Erro inesperado ao cadastrar parte contrária:', error);
    return {
      sucesso: false,
      erro: `Erro inesperado: ${erroMsg}`,
    };
  }
}

