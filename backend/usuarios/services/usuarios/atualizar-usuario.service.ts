// Serviço de atualização de usuário
// Gerencia a lógica de negócio para atualizar usuários existentes

import {
  atualizarUsuario as atualizarUsuarioDb,
  type UsuarioDados,
  type OperacaoUsuarioResult,
} from '../persistence/usuario-persistence.service';

/**
 * Atualiza um usuário existente
 * 
 * Fluxo:
 * 1. Verifica se o usuário existe
 * 2. Valida os dados fornecidos
 * 3. Verifica duplicidades se campos únicos foram alterados
 * 4. Atualiza o registro no banco de dados
 * 5. Retorna o usuário atualizado ou erro
 */
export async function atualizarUsuario(
  id: number,
  params: Partial<UsuarioDados>
): Promise<OperacaoUsuarioResult> {
  console.log('📝 Atualizando usuário...', { id, campos: Object.keys(params) });

  try {
    const resultado = await atualizarUsuarioDb(id, params);

    if (resultado.sucesso && resultado.usuario) {
      console.log('✅ Usuário atualizado com sucesso:', {
        id: resultado.usuario.id,
        nomeExibicao: resultado.usuario.nomeExibicao,
      });
    } else {
      console.error('❌ Erro ao atualizar usuário:', resultado.erro);
    }

    return resultado;
  } catch (error) {
    const erroMsg = error instanceof Error ? error.message : String(error);
    console.error('❌ Erro inesperado ao atualizar usuário:', error);
    return {
      sucesso: false,
      erro: `Erro inesperado: ${erroMsg}`,
    };
  }
}

