/**
 * API Route para Relatório do Orçamento
 * GET: Gera relatório completo do orçamento
 */

import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/backend/auth/api-auth';
import {
  mapAnaliseToUI,
  gerarRelatorioCompleto,
} from '@/backend/financeiro/orcamento/services/orcamento/relatorios-orcamento.service';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * @swagger
 * /api/financeiro/orcamentos/{id}/relatorio:
 *   get:
 *     summary: Relatório do orçamento
 *     description: Gera relatório completo do orçamento com análise, alertas e projeções
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
 *         name: formato
 *         schema:
 *           type: string
 *           enum: [json, excel, pdf]
 *           default: json
 *     responses:
 *       200:
 *         description: Relatório gerado com sucesso
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

    // 3. Obter formato de saída
    const { searchParams } = new URL(request.url);
    const formato = searchParams.get('formato') || 'json';

    // 4. Gerar relatório completo usando serviço
    const relatorioCompleto = await gerarRelatorioCompleto(orcamentoId);

    if (!relatorioCompleto) {
      return NextResponse.json(
        { error: 'Orçamento não encontrado' },
        { status: 404 }
      );
    }

    // 5. Mapear análise para estrutura da UI
    const analiseUI = mapAnaliseToUI(relatorioCompleto.analise);

    // 6. Montar dados do relatório com estrutura esperada pelo frontend
    const relatorio = {
      orcamento: relatorioCompleto.orcamento,
      analise: {
        itens: analiseUI.itens,
        resumo: analiseUI.resumo,
        alertas: analiseUI.alertas,
        evolucao: analiseUI.evolucao,
        projecao: analiseUI.projecao,
      },
      geradoEm: relatorioCompleto.geradoEm,
    };

    // 6. Retornar conforme formato solicitado
    if (formato === 'json') {
      return NextResponse.json({
        success: true,
        data: relatorio,
      });
    }

    // Para Excel e PDF, retornar os dados estruturados
    // A geração do arquivo será feita no frontend
    if (formato === 'excel' || formato === 'pdf') {
      return NextResponse.json({
        success: true,
        data: relatorio,
        formato,
        message: `Dados preparados para exportação em ${formato.toUpperCase()}`,
      });
    }

    return NextResponse.json(
      { error: 'Formato não suportado' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Erro ao gerar relatório do orçamento:', error);
    const erroMsg =
      error instanceof Error ? error.message : 'Erro interno do servidor';

    if (erroMsg.includes('não encontrado')) {
      return NextResponse.json({ error: erroMsg }, { status: 404 });
    }

    return NextResponse.json({ error: erroMsg }, { status: 500 });
  }
}
