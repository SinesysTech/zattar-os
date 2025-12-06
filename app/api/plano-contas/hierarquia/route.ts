// Rota de API para Hierarquia do Plano de Contas
// GET: Obter estrutura hierárquica completa

import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/backend/auth/api-auth';
import { obterHierarquiaPlanoContas } from '@/backend/plano-contas/services/plano-contas/obter-hierarquia.service';
import { listarContasSinteticas } from '@/backend/plano-contas/services/plano-contas/listar-plano-contas.service';

/**
 * @swagger
 * /api/plano-contas/hierarquia:
 *   get:
 *     summary: Obtém a estrutura hierárquica do plano de contas
 *     description: Retorna todas as contas ativas em formato de árvore hierárquica
 *     tags:
 *       - Plano de Contas
 *     security:
 *       - bearerAuth: []
 *       - sessionAuth: []
 *       - serviceApiKey: []
 *     parameters:
 *       - in: query
 *         name: sinteticasApenas
 *         schema:
 *           type: boolean
 *           default: false
 *         description: Se true, retorna apenas contas sintéticas (para seletores de conta pai)
 *     responses:
 *       200:
 *         description: Hierarquia retornada com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/PlanoContaHierarquico'
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

    // 2. Verificar se quer apenas sintéticas
    const { searchParams } = new URL(request.url);
    const sinteticasApenas = searchParams.get('sinteticasApenas') === 'true';

    // 3. Obter dados
    let data;
    if (sinteticasApenas) {
      data = await listarContasSinteticas();
    } else {
      data = await obterHierarquiaPlanoContas();
    }

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error('Erro ao obter hierarquia do plano de contas:', error);
    const erroMsg =
      error instanceof Error ? error.message : 'Erro interno do servidor';
    return NextResponse.json({ error: erroMsg }, { status: 500 });
  }
}
