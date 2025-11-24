// Rota de API para buscar cliente por CPF
// GET: Busca um cliente pelo CPF

import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/backend/auth/api-auth';
import { obterClientePorCpf } from '@/backend/clientes/services/clientes/buscar-cliente.service';

/**
 * @swagger
 * /api/clientes/buscar/por-cpf/{cpf}:
 *   get:
 *     summary: Busca um cliente por CPF
 *     description: Retorna os dados completos de um cliente específico pelo CPF
 *     tags:
 *       - Clientes
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
 *         description: CPF do cliente (com ou sem formatação)
 *     responses:
 *       200:
 *         description: Cliente encontrado
 *       404:
 *         description: Cliente não encontrado
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

    // 3. Buscar cliente
    const cliente = await obterClientePorCpf(cpf);

    if (!cliente) {
      return NextResponse.json(
        { error: 'Cliente não encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: cliente,
    });
  } catch (error) {
    console.error('Erro ao buscar cliente por CPF:', error);
    const erroMsg = error instanceof Error ? error.message : 'Erro interno do servidor';
    return NextResponse.json(
      { error: erroMsg },
      { status: 500 }
    );
  }
}

