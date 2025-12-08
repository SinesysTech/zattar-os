/**
 * API Route para Geração de Contas a Pagar Recorrentes
 * POST: Gerar contas recorrentes baseadas em templates
 * GET: Preview das contas que serão geradas
 */

import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/backend/auth/api-auth';
import {
  gerarContasPagarRecorrentes,
  previewContasRecorrentes,
  estatisticasRecorrencia,
} from '@/backend/financeiro/contas-pagar/services/contas-pagar/gerar-recorrentes.service';

/**
 * @swagger
 * /api/financeiro/contas-pagar/recorrentes/gerar:
 *   post:
 *     summary: Gera contas a pagar recorrentes
 *     description: Gera automaticamente novas contas baseadas em templates recorrentes ativos
 *     tags:
 *       - Contas a Pagar
 *     security:
 *       - bearerAuth: []
 *       - sessionAuth: []
 *       - serviceApiKey: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               dataReferencia:
 *                 type: string
 *                 format: date
 *                 description: Data de referência para cálculo (padrão - hoje)
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
 *   get:
 *     summary: Preview de contas recorrentes a serem geradas
 *     description: Retorna uma prévia das contas que serão geradas, sem efetivamente criá-las
 *     tags:
 *       - Contas a Pagar
 *     security:
 *       - bearerAuth: []
 *       - sessionAuth: []
 *       - serviceApiKey: []
 *     parameters:
 *       - in: query
 *         name: dataReferencia
 *         schema:
 *           type: string
 *           format: date
 *         description: Data de referência para cálculo (padrão - hoje)
 *       - in: query
 *         name: incluirEstatisticas
 *         schema:
 *           type: boolean
 *         description: Incluir estatísticas de recorrência
 *     responses:
 *       200:
 *         description: Preview retornado com sucesso
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

    // 2. Obter dados do body
    let dataReferencia: Date | undefined;
    try {
      const body = await request.json();
      if (body.dataReferencia) {
        dataReferencia = new Date(body.dataReferencia);
        if (isNaN(dataReferencia.getTime())) {
          return NextResponse.json(
            { error: 'Data de referência inválida' },
            { status: 400 }
          );
        }
      }
    } catch {
      // Body vazio ou inválido, usar data atual
    }

    // 3. Gerar contas recorrentes
    const resultado = await gerarContasPagarRecorrentes(dataReferencia);

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

export async function GET(request: NextRequest) {
  try {
    // 1. Autenticação
    const authResult = await authenticateRequest(request);
    if (!authResult.authenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Obter parâmetros
    const { searchParams } = new URL(request.url);
    const dataReferenciaStr = searchParams.get('dataReferencia');
    const incluirEstatisticas = searchParams.get('incluirEstatisticas') === 'true';

    let dataReferencia: Date | undefined;
    if (dataReferenciaStr) {
      dataReferencia = new Date(dataReferenciaStr);
      if (isNaN(dataReferencia.getTime())) {
        return NextResponse.json(
          { error: 'Data de referência inválida' },
          { status: 400 }
        );
      }
    }

    // 3. Obter preview
    const preview = await previewContasRecorrentes(dataReferencia);

    // 4. Incluir estatísticas se solicitado
    let estatisticas;
    if (incluirEstatisticas) {
      estatisticas = await estatisticasRecorrencia();
    }

    return NextResponse.json({
      success: true,
      data: {
        templates: preview.templates,
        contasAGerar: preview.contasAGerar,
        totalAGerar: preview.contasAGerar.length,
        estatisticas,
      },
    });
  } catch (error) {
    console.error('Erro ao obter preview de recorrentes:', error);
    const erroMsg =
      error instanceof Error ? error.message : 'Erro interno do servidor';
    return NextResponse.json({ error: erroMsg }, { status: 500 });
  }
}
