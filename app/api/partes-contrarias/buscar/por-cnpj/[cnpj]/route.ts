// Rota de API para buscar parte contrária por CNPJ

import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/backend/auth/api-auth';
import { obterParteContrariaPorCnpj } from '@/backend/partes-contrarias/services/partes-contrarias/buscar-parte-contraria.service';

/**
 * @swagger
 * /api/partes-contrarias/buscar/por-cnpj/{cnpj}:
 *   get:
 *     summary: Busca uma parte contrária por CNPJ
 *     description: Retorna os dados completos de uma parte contrária específica pelo CNPJ
 *     tags:
 *       - Partes Contrárias
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
 *         description: CNPJ da parte contrária (com ou sem formatação)
 *     responses:
 *       200:
 *         description: Parte contrária encontrada
 *       404:
 *         description: Parte contrária não encontrada
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
    const authResult = await authenticateRequest(request);
    if (!authResult.authenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { cnpj } = await params;

    if (!cnpj || !cnpj.trim()) {
      return NextResponse.json({ error: 'CNPJ é obrigatório' }, { status: 400 });
    }

    const parteContraria = await obterParteContrariaPorCnpj(cnpj);

    if (!parteContraria) {
      return NextResponse.json({ error: 'Parte contrária não encontrada' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: parteContraria,
    });
  } catch (error) {
    console.error('Erro ao buscar parte contrária por CNPJ:', error);
    const erroMsg = error instanceof Error ? error.message : 'Erro interno do servidor';
    return NextResponse.json({ error: erroMsg }, { status: 500 });
  }
}

