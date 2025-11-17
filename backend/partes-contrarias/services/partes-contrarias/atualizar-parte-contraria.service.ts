// Serviço de atualização de parte contrária
// Gerencia a lógica de negócio para atualizar partes contrárias existentes

import {
  atualizarParteContraria as atualizarParteContrariaDb,
  type ParteContrariaDados,
  type OperacaoParteContrariaResult,
} from '../persistence/parte-contraria-persistence.service';

/**
 * Atualiza uma parte contrária existente
 * 
 * Fluxo:
 * 1. Verifica se a parte contrária existe
 * 2. Valida os dados fornecidos
 * 3. Verifica duplicidades se campos únicos foram alterados
 * 4. Atualiza o registro no banco de dados
 * 5. Retorna a parte contrária atualizada ou erro
 */
export async function atualizarParteContraria(
  id: number,
  params: Partial<ParteContrariaDados>
): Promise<OperacaoParteContrariaResult> {
  console.log('📝 Atualizando parte contrária...', { id, campos: Object.keys(params) });

  try {
    const resultado = await atualizarParteContrariaDb(id, params);

    if (resultado.sucesso && resultado.parteContraria) {
      console.log('✅ Parte contrária atualizada com sucesso:', {
        id: resultado.parteContraria.id,
        nome: resultado.parteContraria.nome,
      });
    } else {
      console.error('❌ Erro ao atualizar parte contrária:', resultado.erro);
    }

    return resultado;
  } catch (error) {
    const erroMsg = error instanceof Error ? error.message : String(error);
    console.error('❌ Erro inesperado ao atualizar parte contrária:', error);
    return {
      sucesso: false,
      erro: `Erro inesperado: ${erroMsg}`,
    };
  }
}

