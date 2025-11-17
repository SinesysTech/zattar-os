// Rota de API para buscar usuário por CPF
// GET: Busca um usuário pelo CPF

import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/backend/utils/auth/api-auth';
import { obterUsuarioPorCpf } from '@/backend/usuarios/services/usuarios/buscar-usuario.service';

/**
 * @swagger
 * /api/usuarios/buscar/por-cpf/{cpf}:
 *   get:
 *     summary: Busca um usuário por CPF
 *     description: Retorna os dados completos de um usuário específico pelo CPF
 *     tags:
 *       - Usuários
 *     security:
 *       - bearerAuth: []
 *       - sessionAuth: []
 *       - serviceApiKey: []
 *     parameters:
 *       - in: path
 *         name: cpf
 *         required: true
 *         schema:
 *           type: string
 *         description: CPF do usuário (com ou sem formatação)
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
  { params }: { params: Promise<{ cpf: string }> }
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

    // 2. Obter CPF do parâmetro
    const { cpf } = await params;

    if (!cpf || !cpf.trim()) {
      return NextResponse.json(
        { error: 'CPF é obrigatório' },
        { status: 400 }
      );
    }

    // 3. Buscar usuário
    const usuario = await obterUsuarioPorCpf(cpf);

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
    console.error('Erro ao buscar usuário por CPF:', error);
    const erroMsg = error instanceof Error ? error.message : 'Erro interno do servidor';
    return NextResponse.json(
      { error: erroMsg },
      { status: 500 }
    );
  }
}

