// Rota de API para buscar parte contrária por CPF

import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/backend/auth/api-auth';
import { obterParteContrariaPorCpf } from '@/backend/partes-contrarias/services/partes-contrarias/buscar-parte-contraria.service';

/**
 * @swagger
 * /api/partes-contrarias/buscar/por-cpf/{cpf}:
 *   get:
 *     summary: Busca uma parte contrária por CPF
 *     description: Retorna os dados completos de uma parte contrária específica pelo CPF
 *     tags:
 *       - Partes Contrárias
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
 *         description: CPF da parte contrária (com ou sem formatação)
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
  { params }: { params: Promise<{ cpf: string }> }
) {
  try {
    const authResult = await authenticateRequest(request);
    if (!authResult.authenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { cpf } = await params;

    if (!cpf || !cpf.trim()) {
      return NextResponse.json({ error: 'CPF é obrigatório' }, { status: 400 });
    }

    const parteContraria = await obterParteContrariaPorCpf(cpf);

    if (!parteContraria) {
      return NextResponse.json({ error: 'Parte contrária não encontrada' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: parteContraria,
    });
  } catch (error) {
    console.error('Erro ao buscar parte contrária por CPF:', error);
    const erroMsg = error instanceof Error ? error.message : 'Erro interno do servidor';
    return NextResponse.json({ error: erroMsg }, { status: 500 });
  }
}

