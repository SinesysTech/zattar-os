// Rota de API para sincronizar usuários de auth.users para public.usuarios
// POST: Executa a sincronização

import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/backend/utils/auth/api-auth';
import { sincronizarUsuariosAuth } from '@/backend/usuarios/services/persistence/sincronizar-usuarios-auth.service';

/**
 * @swagger
 * /api/usuarios/sincronizar:
 *   post:
 *     summary: Sincroniza usuários de auth.users para public.usuarios
 *     description: Popula a tabela usuarios com dados dos usuários autenticados que ainda não foram sincronizados
 *     tags:
 *       - Usuários
 *     security:
 *       - bearerAuth: []
 *       - sessionAuth: []
 *       - serviceApiKey: []
 *     responses:
 *       200:
 *         description: Sincronização executada com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 totalEncontrados:
 *                   type: number
 *                 sincronizados:
 *                   type: number
 *                 erros:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       email:
 *                         type: string
 *                       erro:
 *                         type: string
 *       401:
 *         description: Não autenticado
 *       500:
 *         description: Erro interno do servidor
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Autenticação
    const authResult = await authenticateRequest(request);
    if (!authResult.authenticated) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // 2. Executar sincronização
    const resultado = await sincronizarUsuariosAuth();

    return NextResponse.json({
      success: resultado.sucesso,
      totalEncontrados: resultado.totalEncontrados,
      sincronizados: resultado.sincronizados,
      erros: resultado.erros,
    });
  } catch (error) {
    console.error('Erro ao sincronizar usuários:', error);
    const erroMsg = error instanceof Error ? error.message : 'Erro interno do servidor';
    return NextResponse.json(
      { error: erroMsg },
      { status: 500 }
    );
  }
}

