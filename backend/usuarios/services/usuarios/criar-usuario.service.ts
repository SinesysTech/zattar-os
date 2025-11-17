// Serviço de criação de usuário
// Gerencia a lógica de negócio para cadastrar novos usuários

import {
  criarUsuario as criarUsuarioDb,
  type UsuarioDados,
  type OperacaoUsuarioResult,
} from '../persistence/usuario-persistence.service';

/**
 * Cadastra um novo usuário no sistema
 * 
 * Fluxo:
 * 1. Valida os dados de entrada
 * 2. Verifica duplicidades (CPF, e-mail)
 * 3. Cria o registro no banco de dados
 * 4. Retorna o usuário criado ou erro
 */
export async function cadastrarUsuario(
  params: UsuarioDados
): Promise<OperacaoUsuarioResult> {
  console.log('📝 Iniciando cadastro de usuário...', {
    nomeCompleto: params.nomeCompleto,
    emailCorporativo: params.emailCorporativo,
    cpf: params.cpf.replace(/\D/g, '').replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '***.***.$3-$4'), // Mascarar CPF no log
  });

  try {
    const resultado = await criarUsuarioDb(params);

    if (resultado.sucesso && resultado.usuario) {
      console.log('✅ Usuário cadastrado com sucesso:', {
        id: resultado.usuario.id,
        nomeExibicao: resultado.usuario.nomeExibicao,
        emailCorporativo: resultado.usuario.emailCorporativo,
      });
    } else {
      console.error('❌ Erro ao cadastrar usuário:', resultado.erro);
    }

    return resultado;
  } catch (error) {
    const erroMsg = error instanceof Error ? error.message : String(error);
    console.error('❌ Erro inesperado ao cadastrar usuário:', error);
    return {
      sucesso: false,
      erro: `Erro inesperado: ${erroMsg}`,
    };
  }
}

