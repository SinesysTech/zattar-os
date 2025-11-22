// Rota de API para buscar perfil do usuário logado
// GET: Retorna os dados completos do usuário autenticado

import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/backend/utils/auth/api-auth';
import { obterUsuarioPorId } from '@/backend/usuarios/services/usuarios/buscar-usuario.service';

/**
 * @swagger
 * /api/perfil:
 *   get:
 *     summary: Busca o perfil do usuário logado
 *     description: Retorna os dados completos do usuário autenticado
 *     tags:
 *       - Usuários
 *     security:
 *       - bearerAuth: []
 *       - sessionAuth: []
 *     responses:
 *       200:
 *         description: Perfil do usuário encontrado
 *       401:
 *         description: Não autenticado
 *       404:
 *         description: Usuário não encontrado
 *       500:
 *         description: Erro interno do servidor
 */
export async function GET(request: NextRequest) {
  try {
    // 1. Autenticação
    const authResult = await authenticateRequest(request);
    if (!authResult.authenticated) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // 2. Verificar se o usuário tem usuarioId
    if (!authResult.usuarioId) {
      return NextResponse.json(
        { error: 'Usuário não encontrado na base de dados' },
        { status: 404 }
      );
    }

    // 3. Buscar dados completos do usuário
    const usuario = await obterUsuarioPorId(authResult.usuarioId);

    if (!usuario) {
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: usuario,
    });
  } catch (error) {
    console.error('Erro ao buscar perfil:', error);
    const erroMsg = error instanceof Error ? error.message : 'Erro interno do servidor';
    return NextResponse.json(
      { error: erroMsg },
      { status: 500 }
    );
  }
}



