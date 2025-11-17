// Rota de API para buscar usuário por e-mail corporativo
// GET: Busca um usuário pelo e-mail corporativo

import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/backend/utils/auth/api-auth';
import { obterUsuarioPorEmail } from '@/backend/usuarios/services/usuarios/buscar-usuario.service';

/**
 * @swagger
 * /api/usuarios/buscar/por-email/{email}:
 *   get:
 *     summary: Busca um usuário por e-mail corporativo
 *     description: Retorna os dados completos de um usuário específico pelo e-mail corporativo
 *     tags:
 *       - Usuários
 *     security:
 *       - bearerAuth: []
 *       - sessionAuth: []
 *       - serviceApiKey: []
 *     parameters:
 *       - in: path
 *         name: email
 *         required: true
 *         schema:
 *           type: string
 *         description: E-mail corporativo do usuário
 *     responses:
 *       200:
 *         description: Usuário encontrado
 *       404:
 *         description: Usuário não encontrado
 *       401:
 *         description: Não autenticado
 *       500:
 *         description: Erro interno do servidor
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ email: string }> }
) {
  try {
    // 1. Autenticação
    const authResult = await authenticateRequest(request);
    if (!authResult.authenticated) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // 2. Obter e-mail do parâmetro (decodificar URL)
    const { email } = await params;
    const emailDecodificado = decodeURIComponent(email);

    if (!emailDecodificado || !emailDecodificado.trim()) {
      return NextResponse.json(
        { error: 'E-mail é obrigatório' },
        { status: 400 }
      );
    }

    // 3. Buscar usuário
    const usuario = await obterUsuarioPorEmail(emailDecodificado);

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
    console.error('Erro ao buscar usuário por e-mail:', error);
    const erroMsg = error instanceof Error ? error.message : 'Erro interno do servidor';
    return NextResponse.json(
      { error: erroMsg },
      { status: 500 }
    );
  }
}

