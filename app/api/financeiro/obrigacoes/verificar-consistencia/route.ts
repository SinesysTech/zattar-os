/**
 * API Route para Verificação de Consistência de Obrigações
 * POST: Verifica consistência entre parcelas e lançamentos
 */

import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/backend/auth/api-auth';
import { verificarConsistencia } from '@/backend/financeiro/obrigacoes/services/integracao/obrigacoes-integracao.service';

/**
 * @swagger
 * /api/financeiro/obrigacoes/verificar-consistencia:
 *   post:
 *     summary: Verifica consistência de um acordo
 *     description: |
 *       Verifica se todas as parcelas de um acordo estão consistentes com os lançamentos financeiros.
 *       Detecta inconsistências como: parcelas sem lançamento, valores divergentes, status divergentes.
 *     tags:
 *       - Obrigações Financeiras
 *     security:
 *       - bearerAuth: []
 *       - sessionAuth: []
 *       - serviceApiKey: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - acordoId
 *             properties:
 *               acordoId:
 *                 type: integer
 *                 description: ID do acordo a verificar
 *             example:
 *               acordoId: 123
 *     responses:
 *       200:
 *         description: Verificação executada com sucesso
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
 *                     acordoId:
 *                       type: integer
 *                     consistente:
 *                       type: boolean
 *                     totalInconsistencias:
 *                       type: integer
 *                     inconsistencias:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           tipo:
 *                             type: string
 *                             enum: [parcela_sem_lancamento, lancamento_sem_parcela, valor_divergente, status_divergente]
 *                           descricao:
 *                             type: string
 *                           parcelaId:
 *                             type: integer
 *                           lancamentoId:
 *                             type: integer
 *                           sugestao:
 *                             type: string
 *       400:
 *         description: Parâmetros inválidos
 *       401:
 *         description: Não autenticado
 *       404:
 *         description: Acordo não encontrado
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
    const body = await request.json();
    const { acordoId } = body;

    // 3. Validar parâmetros
    if (!acordoId || typeof acordoId !== 'number') {
      return NextResponse.json(
        { error: 'Parâmetro acordoId é obrigatório e deve ser um número' },
        { status: 400 }
      );
    }

    // 4. Verificar consistência
    const resultado = await verificarConsistencia(acordoId);

    return NextResponse.json({
      success: true,
      data: resultado,
    });
  } catch (error) {
    console.error('Erro ao verificar consistência:', error);
    const erroMsg = error instanceof Error ? error.message : 'Erro interno do servidor';

    // Verificar se é erro de não encontrado
    if (erroMsg.includes('não encontrado')) {
      return NextResponse.json({ error: erroMsg }, { status: 404 });
    }

    return NextResponse.json({ error: erroMsg }, { status: 500 });
  }
}
