/**
 * API Route para Evolução do DRE
 * GET: Retorna evolução mensal do DRE para um ano
 */

import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/backend/auth/api-auth';
import { calcularEvolucaoAnual } from '@/backend/financeiro/dre/services/dre/calcular-dre.service';

/**
 * @swagger
 * /api/financeiro/dre/evolucao:
 *   get:
 *     summary: Evolução do DRE
 *     description: Retorna a evolução mensal do DRE para um ano específico
 *     tags:
 *       - DRE
 *     security:
 *       - bearerAuth: []
 *       - sessionAuth: []
 *       - serviceApiKey: []
 *     parameters:
 *       - in: query
 *         name: ano
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 2020
 *           maximum: 2100
 *         description: Ano para buscar a evolução
 *     responses:
 *       200:
 *         description: Evolução retornada com sucesso
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
 *                     evolucao:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           mes:
 *                             type: integer
 *                           mesNome:
 *                             type: string
 *                           ano:
 *                             type: integer
 *                           receitaLiquida:
 *                             type: number
 *                           lucroOperacional:
 *                             type: number
 *                           lucroLiquido:
 *                             type: number
 *                           margemLiquida:
 *                             type: number
 *                     ano:
 *                       type: integer
 *                     geradoEm:
 *                       type: string
 *                       format: date-time
 *       400:
 *         description: Parâmetro ano inválido
 *       401:
 *         description: Não autenticado
 *       500:
 *         description: Erro interno do servidor
 */
export async function GET(request: NextRequest) {
  try {
    // 1. Autenticação
    const authResult = await authenticateRequest(request);
    if (!authResult.authenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Obter parâmetro ano
    const { searchParams } = new URL(request.url);
    const anoStr = searchParams.get('ano');

    if (!anoStr) {
      return NextResponse.json(
        { error: 'Parâmetro ano é obrigatório' },
        { status: 400 }
      );
    }

    const ano = parseInt(anoStr, 10);

    // 3. Validar ano
    if (isNaN(ano) || ano < 2020 || ano > 2100) {
      return NextResponse.json(
        { error: 'Ano inválido. Deve estar entre 2020 e 2100.' },
        { status: 400 }
      );
    }

    // 4. Buscar evolução
    const evolucao = await calcularEvolucaoAnual(ano);

    // 5. Retornar resposta
    return NextResponse.json({
      success: true,
      data: {
        evolucao,
        ano,
        geradoEm: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Erro ao buscar evolução DRE:', error);
    const erroMsg = error instanceof Error ? error.message : 'Erro interno do servidor';

    return NextResponse.json({ error: erroMsg }, { status: 500 });
  }
}
