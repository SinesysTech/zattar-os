'use server';

import { buscarAuthLogsPorUsuario } from '../repository-auth-logs';
import { usuarioRepository } from '../repository';
import { requireAuth } from './utils';

export async function actionBuscarAuthLogs(usuarioId: number) {
  try {
    // Validar permissão para visualizar logs (pode ser ajustado conforme necessário)
    await requireAuth(['usuarios:visualizar']);

    // Buscar usuário para obter auth_user_id
    const usuario = await usuarioRepository.findById(usuarioId);

    if (!usuario) {
      return {
        success: false,
        error: 'Usuário não encontrado',
        data: []
      };
    }

    // Se o usuário não tem auth_user_id, retornar array vazio
    if (!usuario.authUserId) {
      return {
        success: true,
        data: [],
      };
    }

    // Buscar logs de autenticação
    const logs = await buscarAuthLogsPorUsuario(usuario.authUserId);

    return {
      success: true,
      data: logs,
    };
  } catch (error) {
    console.error('Erro ao buscar logs de autenticação:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro ao buscar logs',
      data: [],
    };
  }
}
