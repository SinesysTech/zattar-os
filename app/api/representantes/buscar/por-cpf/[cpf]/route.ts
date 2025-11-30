// Rota de API para buscar representante por CPF
// GET: Busca um representante pelo CPF

import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/backend/auth/api-auth';
import { buscarRepresentantePorCPF } from '@/backend/representantes/services/representantes/buscar-representante-por-cpf.service';

/**
 * @swagger
 * /api/representantes/buscar/por-cpf/{cpf}:
 *   get:
 *     summary: Busca um representante por CPF
 *     description: Retorna os dados completos de um representante específico pelo CPF
 *     tags:
 *       - Representantes
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
 *         description: CPF do representante (com ou sem formatação)
 *     responses:
 *       200:
 *         description: Representante encontrado
 *       404:
 *         description: Representante não encontrado
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

    // 3. Buscar representante
    const representante = await buscarRepresentantePorCPF(cpf);

    if (!representante) {
      return NextResponse.json(
        { error: 'Representante não encontrado com este CPF' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: representante,
    });
  } catch (error) {
    console.error('Erro ao buscar representante por CPF:', error);
    const erroMsg = error instanceof Error ? error.message : 'Erro interno do servidor';
    return NextResponse.json(
      { error: erroMsg },
      { status: 500 }
    );
  }
}
