/**
 * API Route para DRE (Demonstração de Resultado do Exercício)
 * GET: Retorna DRE para um período com comparativos opcionais
 */

import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/backend/auth/require-permission';
import {
  calcularDRE,
  calcularComparativoDRE,
} from '@/backend/financeiro/dre/services/dre/calcular-dre.service';
import { validarGerarDREDTO, isPeriodoDREValido } from '@/backend/types/financeiro/dre.types';
import type { PeriodoDRE } from '@/backend/types/financeiro/dre.types';

/**
 * @swagger
 * /api/financeiro/dre:
 *   get:
 *     summary: Gerar DRE
 *     description: Retorna a Demonstração de Resultado do Exercício para um período
 *     tags:
 *       - DRE
 *     security:
 *       - bearerAuth: []
 *       - sessionAuth: []
 *       - serviceApiKey: []
 *     parameters:
 *       - in: query
 *         name: dataInicio
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *         description: Data inicial do período (YYYY-MM-DD)
 *       - in: query
 *         name: dataFim
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *         description: Data final do período (YYYY-MM-DD)
 *       - in: query
 *         name: tipo
 *         schema:
 *           type: string
 *           enum: [mensal, trimestral, anual]
 *         description: Tipo de período (opcional, será detectado automaticamente)
 *       - in: query
 *         name: incluirComparativo
 *         schema:
 *           type: boolean
 *           default: false
 *         description: Incluir comparativo com período anterior
 *       - in: query
 *         name: incluirOrcado
 *         schema:
 *           type: boolean
 *           default: false
 *         description: Incluir comparativo com orçamento
 *     responses:
 *       200:
 *         description: DRE gerado com sucesso
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
 *                     dre:
 *                       type: object
 *                     comparativo:
 *                       type: object
 *                     geradoEm:
 *                       type: string
 *                       format: date-time
 *       400:
 *         description: Parâmetros inválidos
 *       401:
 *         description: Não autenticado
 *       500:
 *         description: Erro interno do servidor
 */
export async function GET(request: NextRequest) {
  try {
    // 1. Autenticação e autorização - requer permissão dre:visualizar
    const authOrError = await requirePermission(request, 'dre', 'visualizar');
    if (authOrError instanceof NextResponse) {
      return authOrError;
    }

    // 2. Obter parâmetros da URL
    const { searchParams } = new URL(request.url);
    const dataInicio = searchParams.get('dataInicio');
    const dataFim = searchParams.get('dataFim');
    const tipo = searchParams.get('tipo') as PeriodoDRE | null;
    const incluirComparativo = searchParams.get('incluirComparativo') === 'true';
    const incluirOrcado = searchParams.get('incluirOrcado') === 'true';

    // 3. Validar parâmetros obrigatórios
    if (!dataInicio || !dataFim) {
      return NextResponse.json(
        { error: 'Parâmetros dataInicio e dataFim são obrigatórios' },
        { status: 400 }
      );
    }

    // 4. Validar datas
    const dto = {
      dataInicio,
      dataFim,
      tipo: tipo && isPeriodoDREValido(tipo) ? tipo : undefined,
      incluirComparativo,
      incluirOrcado,
    };

    if (!validarGerarDREDTO(dto)) {
      return NextResponse.json(
        { error: 'Parâmetros inválidos. Verifique as datas e o tipo de período.' },
        { status: 400 }
      );
    }

    // 5. Gerar DRE (com ou sem comparativo)
    let responseData;

    if (incluirComparativo || incluirOrcado) {
      const comparativo = await calcularComparativoDRE(dto);
      responseData = {
        dre: comparativo.periodoAtual,
        comparativo: {
          periodoAnterior: comparativo.periodoAnterior,
          orcado: comparativo.orcado,
          variacoes: comparativo.variacoes,
          variacoesOrcado: comparativo.variacoesOrcado,
        },
        geradoEm: new Date().toISOString(),
      };
    } else {
      const dre = await calcularDRE(dto);
      responseData = {
        dre,
        geradoEm: new Date().toISOString(),
      };
    }

    // 6. Retornar resposta
    return NextResponse.json({
      success: true,
      data: responseData,
    });
  } catch (error) {
    console.error('Erro ao gerar DRE:', error);
    const erroMsg = error instanceof Error ? error.message : 'Erro interno do servidor';

    return NextResponse.json({ error: erroMsg }, { status: 500 });
  }
}
