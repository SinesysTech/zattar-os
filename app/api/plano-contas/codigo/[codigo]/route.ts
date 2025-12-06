// Rota de API para buscar Plano de Contas por código
// GET: Buscar conta por código

import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/backend/auth/api-auth';
import { obterPlanoContaPorCodigo } from '@/backend/plano-contas/services/plano-contas/listar-plano-contas.service';

interface RouteParams {
  params: Promise<{ codigo: string }>;
}

/**
 * @swagger
 * /api/plano-contas/codigo/{codigo}:
 *   get:
 *     summary: Busca uma conta por código
 *     description: Retorna os detalhes de uma conta pelo código hierárquico
 *     tags:
 *       - Plano de Contas
 *     security:
 *       - bearerAuth: []
 *       - sessionAuth: []
 *       - serviceApiKey: []
 *     parameters:
 *       - in: path
 *         name: codigo
 *         required: true
 *         schema:
 *           type: string
 *         description: Código da conta (ex: 1.1.01)
 *     responses:
 *       200:
 *         description: Conta encontrada com sucesso
 *       404:
 *         description: Conta não encontrada
 *       401:
 *         description: Não autenticado
 *       500:
 *         description: Erro interno do servidor
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    // 1. Autenticação
    const authResult = await authenticateRequest(request);
    if (!authResult.authenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Obter código
    const { codigo } = await params;

    if (!codigo || codigo.trim() === '') {
      return NextResponse.json({ error: 'Código inválido' }, { status: 400 });
    }

    // 3. Buscar conta
    const conta = await obterPlanoContaPorCodigo(decodeURIComponent(codigo));

    if (!conta) {
      return NextResponse.json({ error: 'Conta não encontrada' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: conta,
    });
  } catch (error) {
    console.error('Erro ao buscar conta por código:', error);
    const erroMsg =
      error instanceof Error ? error.message : 'Erro interno do servidor';
    return NextResponse.json({ error: erroMsg }, { status: 500 });
  }
}
