/**
 * API Route para Projeção Orçamentária
 * GET: Retorna projeção de execução do orçamento
 */

import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/backend/auth/api-auth';
import {
  buscarProjecaoOrcamentaria,
  buscarComparativoAnual,
} from '@/backend/financeiro/orcamento/services/persistence/analise-orcamentaria-persistence.service';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * @swagger
 * /api/financeiro/orcamentos/{id}/projecao:
 *   get:
 *     summary: Projeção orçamentária
 *     description: Retorna projeção de execução do orçamento baseada em tendências
 *     tags:
 *       - Orçamentos
 *     security:
 *       - bearerAuth: []
 *       - sessionAuth: []
 *       - serviceApiKey: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *       - in: query
 *         name: incluirComparativoAnual
 *         schema:
 *           type: boolean
 *           default: false
 *     responses:
 *       200:
 *         description: Projeção retornada com sucesso
 *       401:
 *         description: Não autenticado
 *       404:
 *         description: Orçamento não encontrado
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

    // 2. Obter ID do orçamento
    const { id } = await params;
    const orcamentoId = parseInt(id, 10);

    if (isNaN(orcamentoId) || orcamentoId <= 0) {
      return NextResponse.json(
        { error: 'ID do orçamento inválido' },
        { status: 400 }
      );
    }

    // 3. Obter parâmetros opcionais
    const { searchParams } = new URL(request.url);
    const incluirComparativoAnual = searchParams.get('incluirComparativoAnual') === 'true';

    // 4. Buscar projeção
    const projecao = await buscarProjecaoOrcamentaria(orcamentoId);

    // 5. Buscar comparativo anual se solicitado
    let comparativoAnual = null;
    if (incluirComparativoAnual) {
      // Buscar o ano do orçamento atual para comparar com anos anteriores
      comparativoAnual = await buscarComparativoAnual(new Date().getFullYear());
    }

    return NextResponse.json({
      success: true,
      data: {
        projecao,
        comparativoAnual,
      },
    });
  } catch (error) {
    console.error('Erro ao buscar projeção orçamentária:', error);
    const erroMsg =
      error instanceof Error ? error.message : 'Erro interno do servidor';

    if (erroMsg.includes('não encontrado')) {
      return NextResponse.json({ error: erroMsg }, { status: 404 });
    }

    return NextResponse.json({ error: erroMsg }, { status: 500 });
  }
}
