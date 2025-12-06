/**
 * API Route para Folha de Pagamento por Período
 * GET: Buscar folha por período (mês/ano)
 */

import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/backend/auth/api-auth';
import { buscarFolhaPorPeriodo } from '@/backend/rh/salarios/services/persistence/folhas-pagamento-persistence.service';

interface RouteParams {
  params: Promise<{ ano: string; mes: string }>;
}

/**
 * @swagger
 * /api/rh/folhas-pagamento/periodo/{ano}/{mes}:
 *   get:
 *     summary: Busca folha de pagamento por período
 *     description: Retorna a folha de pagamento de um mês/ano específico
 *     tags:
 *       - Folhas de Pagamento
 *     security:
 *       - bearerAuth: []
 *       - sessionAuth: []
 *     parameters:
 *       - in: path
 *         name: ano
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 2020
 *       - in: path
 *         name: mes
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 12
 *     responses:
 *       200:
 *         description: Folha encontrada
 *       404:
 *         description: Não existe folha para o período
 *       400:
 *         description: Período inválido
 *       401:
 *         description: Não autenticado
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const authResult = await authenticateRequest(request);
    if (!authResult.authenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { ano: anoStr, mes: mesStr } = await params;
    const ano = parseInt(anoStr, 10);
    const mes = parseInt(mesStr, 10);

    // Validar ano
    if (isNaN(ano) || ano < 2020) {
      return NextResponse.json(
        { error: 'Ano inválido. Deve ser maior ou igual a 2020' },
        { status: 400 }
      );
    }

    // Validar mês
    if (isNaN(mes) || mes < 1 || mes > 12) {
      return NextResponse.json(
        { error: 'Mês inválido. Deve estar entre 1 e 12' },
        { status: 400 }
      );
    }

    const folha = await buscarFolhaPorPeriodo(mes, ano);

    if (!folha) {
      // Importar labels para formatar mensagem
      const { MESES_LABELS } = await import('@/backend/types/financeiro/salarios.types');
      const mesNome = MESES_LABELS[mes] || mes;

      return NextResponse.json(
        {
          error: `Não existe folha de pagamento para ${mesNome}/${ano}`,
          data: null,
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: folha,
    });
  } catch (error) {
    console.error('Erro ao buscar folha por período:', error);
    const erroMsg =
      error instanceof Error ? error.message : 'Erro interno do servidor';
    return NextResponse.json({ error: erroMsg }, { status: 500 });
  }
}
