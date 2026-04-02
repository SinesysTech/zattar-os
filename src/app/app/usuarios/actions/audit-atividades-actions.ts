'use server';

import { buscarAtividadesUsuario, contarAtividadesUsuario } from '../repository-audit-atividades';
import type { AtividadeLog } from '../repository-audit-atividades';
import { requireAuth } from './utils';

export async function actionBuscarAtividadesUsuario(
  usuarioId: number,
  limite: number = 20,
  offset: number = 0
) {
  try {
    await requireAuth(['usuarios:visualizar']);

    const [atividades, total] = await Promise.all([
      buscarAtividadesUsuario(usuarioId, limite, offset),
      contarAtividadesUsuario(usuarioId),
    ]);

    const temMais = offset + limite < total;

    return {
      success: true as const,
      data: { atividades, temMais },
    };
  } catch (error) {
    console.error('Erro ao buscar atividades do usuário:', error);
    return {
      success: false as const,
      error: error instanceof Error ? error.message : 'Erro ao buscar atividades',
      data: { atividades: [] as AtividadeLog[], temMais: false },
    };
  }
}
