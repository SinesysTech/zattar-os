/**
 * API Routes para Sincronização de Obrigações Financeiras
 * POST: Sincroniza parcelas/acordos com o sistema financeiro
 */

import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/backend/auth/api-auth';
import {
  sincronizarParcelaParaFinanceiro,
  sincronizarAcordoCompleto,
  sincronizarAcordosEmLote,
} from '@/backend/financeiro/obrigacoes/services/integracao/obrigacoes-integracao.service';

/**
 * @swagger
 * /api/financeiro/obrigacoes/sincronizar:
 *   post:
 *     summary: Sincroniza obrigações com o sistema financeiro
 *     description: |
 *       Sincroniza parcelas de acordos com lançamentos financeiros.
 *       Pode sincronizar uma parcela específica, um acordo completo ou múltiplos acordos.
 *       A sincronização automática já é feita via trigger, mas este endpoint permite
 *       sincronização manual em casos de inconsistência.
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
 *             properties:
 *               parcelaId:
 *                 type: integer
 *                 description: ID da parcela a sincronizar (opcional)
 *               acordoId:
 *                 type: integer
 *                 description: ID do acordo a sincronizar (opcional)
 *               acordoIds:
 *                 type: array
 *                 items:
 *                   type: integer
 *                 description: IDs de múltiplos acordos para sincronização em lote
 *               forcar:
 *                 type: boolean
 *                 default: false
 *                 description: Força recriação de lançamentos mesmo se já existirem
 *             example:
 *               acordoId: 123
 *               forcar: false
 *     responses:
 *       200:
 *         description: Sincronização executada com sucesso
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
 *                     sucesso:
 *                       type: boolean
 *                     totalProcessados:
 *                       type: integer
 *                     totalSucessos:
 *                       type: integer
 *                     totalErros:
 *                       type: integer
 *                     itens:
 *                       type: array
 *                     erros:
 *                       type: array
 *                       items:
 *                         type: string
 *                     warnings:
 *                       type: array
 *                       items:
 *                         type: string
 *       400:
 *         description: Parâmetros inválidos
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
    const body = await request.json();
    const { parcelaId, acordoId, acordoIds, forcar = false } = body;

    // 3. Validar parâmetros (ao menos um deve ser fornecido)
    if (!parcelaId && !acordoId && (!acordoIds || acordoIds.length === 0)) {
      return NextResponse.json(
        {
          error: 'Parâmetros inválidos. Forneça parcelaId, acordoId ou acordoIds[]',
        },
        { status: 400 }
      );
    }

    let resultado;

    // 4. Executar sincronização conforme parâmetro
    if (parcelaId) {
      // Sincronizar parcela específica
      const itemResult = await sincronizarParcelaParaFinanceiro(parcelaId, forcar);
      resultado = {
        sucesso: itemResult.sucesso,
        totalProcessados: 1,
        totalSucessos: itemResult.sucesso ? 1 : 0,
        totalErros: itemResult.sucesso ? 0 : 1,
        itens: [itemResult],
        erros: itemResult.sucesso ? [] : [itemResult.mensagem || 'Erro desconhecido'],
        warnings: [],
      };
    } else if (acordoId) {
      // Sincronizar acordo completo
      resultado = await sincronizarAcordoCompleto(acordoId, forcar);
    } else if (acordoIds && acordoIds.length > 0) {
      // Sincronizar múltiplos acordos
      resultado = await sincronizarAcordosEmLote(acordoIds, forcar);
    }

    return NextResponse.json({
      success: resultado?.sucesso || false,
      data: resultado,
    });
  } catch (error) {
    console.error('Erro ao sincronizar obrigações:', error);
    const erroMsg = error instanceof Error ? error.message : 'Erro interno do servidor';
    return NextResponse.json({ error: erroMsg }, { status: 500 });
  }
}
