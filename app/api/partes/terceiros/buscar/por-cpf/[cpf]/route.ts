// Rota de API para buscar terceiro por CPF
// GET: Busca um terceiro pelo CPF

import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/backend/auth/api-auth';
import { buscarTerceiroPorCPF } from '@/backend/terceiros/services/terceiros/buscar-terceiro-por-cpf.service';

/**
 * @swagger
 * /api/partes/terceiros/buscar/por-cpf/{cpf}:
 *   get:
 *     summary: Busca um terceiro por CPF
 *     description: Retorna os dados completos de um terceiro específico pelo CPF
 *     tags:
 *       - Terceiros
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
 *         description: CPF do terceiro (com ou sem formatação)
 *     responses:
 *       200:
 *         description: Terceiro encontrado
 *       404:
 *         description: Terceiro não encontrado
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

    // 3. Buscar terceiro
    const terceiro = await buscarTerceiroPorCPF(cpf);

    if (!terceiro) {
      return NextResponse.json(
        { error: 'Terceiro não encontrado com este CPF' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: terceiro,
    });
  } catch (error) {
    console.error('Erro ao buscar terceiro por CPF:', error);
    const erroMsg = error instanceof Error ? error.message : 'Erro interno do servidor';
    return NextResponse.json(
      { error: erroMsg },
      { status: 500 }
    );
  }
}
