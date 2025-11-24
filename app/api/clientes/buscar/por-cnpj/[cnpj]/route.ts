// Rota de API para buscar cliente por CNPJ
// GET: Busca um cliente pelo CNPJ

import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/backend/auth/api-auth';
import { obterClientePorCnpj } from '@/backend/clientes/services/clientes/buscar-cliente.service';

/**
 * @swagger
 * /api/clientes/buscar/por-cnpj/{cnpj}:
 *   get:
 *     summary: Busca um cliente por CNPJ
 *     description: Retorna os dados completos de um cliente específico pelo CNPJ
 *     tags:
 *       - Clientes
 *     security:
 *       - bearerAuth: []
 *       - sessionAuth: []
 *       - serviceApiKey: []
 *     parameters:
 *       - in: path
 *         name: cnpj
 *         required: true
 *         schema:
 *           type: string
 *         description: CNPJ do cliente (com ou sem formatação)
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
  { params }: { params: Promise<{ cnpj: string }> }
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

    // 2. Obter CNPJ do parâmetro
    const { cnpj } = await params;

    if (!cnpj || !cnpj.trim()) {
      return NextResponse.json(
        { error: 'CNPJ é obrigatório' },
        { status: 400 }
      );
    }

    // 3. Buscar cliente
    const cliente = await obterClientePorCnpj(cnpj);

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
    console.error('Erro ao buscar cliente por CNPJ:', error);
    const erroMsg = error instanceof Error ? error.message : 'Erro interno do servidor';
    return NextResponse.json(
      { error: erroMsg },
      { status: 500 }
    );
  }
}

