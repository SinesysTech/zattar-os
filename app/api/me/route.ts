// Rota de API para obter informações básicas do usuário logado
// GET: Retorna id e isSuperAdmin do usuário autenticado

import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/backend/auth/api-auth';
import { createServiceClient } from '@/backend/utils/supabase/service-client';

/**
 * @swagger
 * /api/me:
 *   get:
 *     summary: Busca informações básicas do usuário logado
 *     description: Retorna id e status de super admin do usuário autenticado
 *     tags:
 *       - Usuários
 *     security:
 *       - bearerAuth: []
 *       - sessionAuth: []
 *     responses:
 *       200:
 *         description: Informações do usuário
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: number
 *                   description: ID do usuário
 *                 isSuperAdmin:
 *                   type: boolean
 *                   description: Se o usuário é super admin
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

    // 3. Buscar campo is_super_admin do usuário
    const supabase = createServiceClient();
    const { data: usuario, error } = await supabase
      .from('usuarios')
      .select('id, is_super_admin')
      .eq('id', authResult.usuarioId)
      .single();

    if (error || !usuario) {
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      id: usuario.id,
      isSuperAdmin: usuario.is_super_admin || false,
    });
  } catch (error) {
    console.error('Erro ao buscar informações do usuário:', error);
    const erroMsg = error instanceof Error ? error.message : 'Erro interno do servidor';
    return NextResponse.json(
      { error: erroMsg },
      { status: 500 }
    );
  }
}
