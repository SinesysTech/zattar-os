/**
 * API Route para Resumo de Obrigações Financeiras
 * GET: Obtém métricas consolidadas de obrigações
 */

import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/backend/auth/api-auth';
import {
  obterResumoObrigacoes,
  obterAlertasObrigacoes,
  obterEstatisticasObrigacoes,
} from '@/backend/financeiro/obrigacoes/services/obrigacoes/listar-obrigacoes.service';
import type { ListarObrigacoesParams } from '@/backend/types/financeiro/obrigacoes.types';

/**
 * @swagger
 * /api/financeiro/obrigacoes/resumo:
 *   get:
 *     summary: Obtém resumo consolidado de obrigações
 *     description: Retorna métricas consolidadas de obrigações financeiras para dashboard
 *     tags:
 *       - Obrigações Financeiras
 *     security:
 *       - bearerAuth: []
 *       - sessionAuth: []
 *       - serviceApiKey: []
 *     parameters:
 *       - in: query
 *         name: dataVencimentoInicio
 *         schema:
 *           type: string
 *           format: date
 *         description: Filtrar por data de vencimento inicial
 *       - in: query
 *         name: dataVencimentoFim
 *         schema:
 *           type: string
 *           format: date
 *         description: Filtrar por data de vencimento final
 *       - in: query
 *         name: clienteId
 *         schema:
 *           type: integer
 *         description: Filtrar por cliente específico
 *       - in: query
 *         name: incluirAlertas
 *         schema:
 *           type: boolean
 *           default: false
 *         description: Incluir detalhes de alertas (vencidas, vencendo, inconsistentes)
 *       - in: query
 *         name: incluirEstatisticas
 *         schema:
 *           type: boolean
 *           default: false
 *         description: Incluir estatísticas avançadas
 *     responses:
 *       200:
 *         description: Resumo de obrigações retornado com sucesso
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
 *                     resumo:
 *                       type: object
 *                       properties:
 *                         totalObrigacoes:
 *                           type: integer
 *                         valorTotal:
 *                           type: number
 *                         pendentes:
 *                           type: object
 *                         vencidas:
 *                           type: object
 *                         efetivadas:
 *                           type: object
 *                         vencendoHoje:
 *                           type: object
 *                         vencendoEm7Dias:
 *                           type: object
 *                         porTipo:
 *                           type: array
 *                         sincronizacao:
 *                           type: object
 *                     alertas:
 *                       type: object
 *                       description: Apenas se incluirAlertas=true
 *                     estatisticas:
 *                       type: object
 *                       description: Apenas se incluirEstatisticas=true
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

    // 2. Obter parâmetros da query string
    const { searchParams } = new URL(request.url);

    const filtros: Partial<ListarObrigacoesParams> = {
      dataVencimentoInicio: searchParams.get('dataVencimentoInicio') || undefined,
      dataVencimentoFim: searchParams.get('dataVencimentoFim') || undefined,
      clienteId: searchParams.get('clienteId')
        ? parseInt(searchParams.get('clienteId')!, 10)
        : undefined,
      processoId: searchParams.get('processoId')
        ? parseInt(searchParams.get('processoId')!, 10)
        : undefined,
    };

    const incluirAlertas = searchParams.get('incluirAlertas') === 'true';
    const incluirEstatisticas = searchParams.get('incluirEstatisticas') === 'true';

    // 3. Obter resumo
    const resumo = await obterResumoObrigacoes(filtros);

    // 4. Montar resposta
    const resposta: {
      resumo: typeof resumo;
      alertas?: Awaited<ReturnType<typeof obterAlertasObrigacoes>>;
      estatisticas?: Awaited<ReturnType<typeof obterEstatisticasObrigacoes>>;
    } = {
      resumo,
    };

    // 5. Incluir alertas se solicitado
    if (incluirAlertas) {
      resposta.alertas = await obterAlertasObrigacoes();
    }

    // 6. Incluir estatísticas se solicitado
    if (incluirEstatisticas) {
      resposta.estatisticas = await obterEstatisticasObrigacoes();
    }

    return NextResponse.json({
      success: true,
      data: resposta,
    });
  } catch (error) {
    console.error('Erro ao obter resumo de obrigações:', error);
    const erroMsg = error instanceof Error ? error.message : 'Erro interno do servidor';
    return NextResponse.json({ error: erroMsg }, { status: 500 });
  }
}
