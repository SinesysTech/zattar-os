/**
 * API Route para Projeção Orçamentária
 * GET: Retorna projeção de execução do orçamento
 */

import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/backend/auth/api-auth';
import {
  buscarAnaliseOrcamentaria,
  buscarComparativoAnual,
} from '@/backend/financeiro/orcamento/services/persistence/analise-orcamentaria-persistence.service';
import {
  buscarOrcamentoPorId,
} from '@/backend/financeiro/orcamento/services/persistence/orcamento-persistence.service';
import {
  mapAnaliseToUI,
} from '@/backend/financeiro/orcamento/services/orcamento/relatorios-orcamento.service';

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

    // 4. Buscar orçamento para obter o ano
    const orcamento = await buscarOrcamentoPorId(orcamentoId);
    if (!orcamento) {
      return NextResponse.json(
        { error: 'Orçamento não encontrado' },
        { status: 404 }
      );
    }

    // 5. Buscar análise completa e mapear para UI (gera projeção por conta)
    const analise = await buscarAnaliseOrcamentaria({ orcamentoId });
    const analiseUI = mapAnaliseToUI(analise);

    // 6. Buscar comparativo anual se solicitado (usando ano do orçamento)
    let comparativoAnual = null;
    if (incluirComparativoAnual) {
      // Usar o ano do orçamento (não o ano atual) para comparativo
      const anoOrcamento = orcamento.ano;
      const anoAnterior = anoOrcamento - 1;
      // Garantir que não buscamos anos muito antigos (limite de 5 anos)
      const anoMinimo = Math.max(anoAnterior, new Date().getFullYear() - 5);
      comparativoAnual = await buscarComparativoAnual([anoMinimo, anoOrcamento]);
    }

    return NextResponse.json({
      success: true,
      data: {
        projecao: analiseUI.projecao, // Retorna ProjecaoItem[] (lista por conta)
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
