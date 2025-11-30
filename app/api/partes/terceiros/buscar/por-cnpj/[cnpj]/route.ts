// Rota de API para buscar terceiro por CNPJ
// GET: Busca um terceiro pelo CNPJ

import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/backend/auth/api-auth';
import { buscarTerceiroPorCNPJ } from '@/backend/terceiros/services/terceiros/buscar-terceiro-por-cnpj.service';

/**
 * @swagger
 * /api/partes/terceiros/buscar/por-cnpj/{cnpj}:
 *   get:
 *     summary: Busca um terceiro por CNPJ
 *     description: Retorna os dados completos de um terceiro específico pelo CNPJ
 *     tags:
 *       - Terceiros
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
 *         description: CNPJ do terceiro (com ou sem formatação)
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

    // 3. Buscar terceiro
    const terceiro = await buscarTerceiroPorCNPJ(cnpj);

    if (!terceiro) {
      return NextResponse.json(
        { error: 'Terceiro não encontrado com este CNPJ' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: terceiro,
    });
  } catch (error) {
    console.error('Erro ao buscar terceiro por CNPJ:', error);
    const erroMsg = error instanceof Error ? error.message : 'Erro interno do servidor';
    return NextResponse.json(
      { error: erroMsg },
      { status: 500 }
    );
  }
}
