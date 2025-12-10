/**
 * API Route para Geração de Contas Recorrentes
 * POST: Gerar contas a receber recorrentes
 */

import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/backend/auth/api-auth';
import {
  gerarContasReceberRecorrentes,
  previewContasRecorrentes,
} from '@/backend/financeiro/contas-receber/services/contas-receber/gerar-recorrentes.service';

/**
 * @swagger
 * /api/financeiro/contas-receber/recorrentes/gerar:
 *   post:
 *     summary: Gera contas a receber recorrentes
 *     description: Processa todos os templates recorrentes e gera novas contas conforme frequência configurada
 *     tags:
 *       - Contas a Receber
 *     security:
 *       - bearerAuth: []
 *       - sessionAuth: []
 *       - serviceApiKey: []
 *     parameters:
 *       - in: query
 *         name: preview
 *         schema:
 *           type: boolean
 *           default: false
 *         description: Se true, retorna apenas preview das contas que seriam geradas (dry run)
 *     responses:
 *       200:
 *         description: Contas geradas com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     contasGeradas:
 *                       type: array
 *                     total:
 *                       type: integer
 *                     erros:
 *                       type: array
 *       401:
 *         description: Não autenticado
 *       500:
 *         description: Erro interno do servidor
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Autenticação
    const authResult = await authenticateRequest(request);
    if (!authResult.authenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Verificar se é modo preview
    const { searchParams } = new URL(request.url);
    const isPreview = searchParams.get('preview') === 'true';

    if (isPreview) {
      // Modo preview: retorna apenas o que seria gerado
      const preview = await previewContasRecorrentes();

      return NextResponse.json({
        success: true,
        data: {
          preview: true,
          templates: preview.templates.length,
          contasAGerar: preview.contasAGerar,
          totalAGerar: preview.contasAGerar.length,
          valorTotalAGerar: preview.contasAGerar.reduce((acc, c) => acc + c.valor, 0),
        },
      });
    }

    // 3. Gerar contas recorrentes
    const resultado = await gerarContasReceberRecorrentes();

    return NextResponse.json({
      success: resultado.sucesso,
      data: {
        contasGeradas: resultado.contasGeradas,
        total: resultado.total,
        erros: resultado.erros,
      },
      message: resultado.sucesso
        ? `${resultado.total} conta(s) gerada(s) com sucesso`
        : `Geração concluída com ${resultado.erros?.length || 0} erro(s)`,
    });
  } catch (error) {
    console.error('Erro ao gerar contas recorrentes:', error);
    const erroMsg =
      error instanceof Error ? error.message : 'Erro interno do servidor';
    return NextResponse.json({ error: erroMsg }, { status: 500 });
  }
}

/**
 * @swagger
 * /api/financeiro/contas-receber/recorrentes/gerar:
 *   get:
 *     summary: Preview de contas recorrentes a gerar
 *     description: Retorna uma lista das contas que seriam geradas (dry run)
 *     tags:
 *       - Contas a Receber
 *     security:
 *       - bearerAuth: []
 *       - sessionAuth: []
 *       - serviceApiKey: []
 *     responses:
 *       200:
 *         description: Preview retornado com sucesso
 *       401:
 *         description: Não autenticado
 */
export async function GET(request: NextRequest) {
  try {
    // 1. Autenticação
    const authResult = await authenticateRequest(request);
    if (!authResult.authenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Gerar preview
    const preview = await previewContasRecorrentes();

    return NextResponse.json({
      success: true,
      data: {
        templates: preview.templates.length,
        contasAGerar: preview.contasAGerar,
        totalAGerar: preview.contasAGerar.length,
        valorTotalAGerar: preview.contasAGerar.reduce((acc, c) => acc + c.valor, 0),
      },
    });
  } catch (error) {
    console.error('Erro ao gerar preview de recorrentes:', error);
    const erroMsg =
      error instanceof Error ? error.message : 'Erro interno do servidor';
    return NextResponse.json({ error: erroMsg }, { status: 500 });
  }
}
