/**
 * API Route para Análise Orçamentária
 * GET: Retorna análise detalhada do orçamento vs realizado
 */

import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/backend/auth/api-auth';
import {
  buscarAnaliseOrcamentaria,
} from '@/backend/financeiro/orcamento/services/persistence/analise-orcamentaria-persistence.service';
import {
  mapAnaliseToUI,
} from '@/backend/financeiro/orcamento/services/orcamento/relatorios-orcamento.service';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * @swagger
 * /api/financeiro/orcamentos/{id}/analise:
 *   get:
 *     summary: Análise orçamentária
 *     description: Retorna análise detalhada do orçamento vs realizado
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
 *         name: incluirResumo
 *         schema:
 *           type: boolean
 *           default: true
 *       - in: query
 *         name: incluirAlertas
 *         schema:
 *           type: boolean
 *           default: true
 *       - in: query
 *         name: incluirEvolucao
 *         schema:
 *           type: boolean
 *           default: false
 *     responses:
 *       200:
 *         description: Análise retornada com sucesso
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
    const incluirResumo = searchParams.get('incluirResumo') !== 'false';
    const incluirAlertas = searchParams.get('incluirAlertas') !== 'false';
    const incluirEvolucao = searchParams.get('incluirEvolucao') === 'true';

    // 4. Buscar análise completa
    const analise = await buscarAnaliseOrcamentaria({ orcamentoId });

    if (!analise) {
      return NextResponse.json(
        { error: 'Orçamento não encontrado ou sem dados de análise' },
        { status: 404 }
      );
    }

    // 5. Mapear para estrutura da UI
    const analiseUI = mapAnaliseToUI(analise);

    // 6. Retornar dados conforme parâmetros solicitados
    return NextResponse.json({
      success: true,
      data: {
        itens: analiseUI.itens,
        resumo: incluirResumo ? analiseUI.resumo : null,
        alertas: incluirAlertas ? analiseUI.alertas : null,
        evolucao: incluirEvolucao ? analiseUI.evolucao : null,
      },
    });
  } catch (error) {
    console.error('Erro ao buscar análise orçamentária:', error);
    const erroMsg =
      error instanceof Error ? error.message : 'Erro interno do servidor';

    if (erroMsg.includes('não encontrado')) {
      return NextResponse.json({ error: erroMsg }, { status: 404 });
    }

    return NextResponse.json({ error: erroMsg }, { status: 500 });
  }
}
