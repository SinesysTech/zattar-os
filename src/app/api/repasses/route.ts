/**
 * @swagger
 * /api/repasses:
 *   get:
 *     summary: Lista repasses pendentes
 *     description: Retorna lista de repasses pendentes com filtros opcionais
 *     tags:
 *       - Acordos e Condenações
 *     security:
 *       - bearerAuth: []
 *       - sessionAuth: []
 *     parameters:
 *       - in: query
 *         name: statusRepasse
 *         schema:
 *           type: string
 *           enum: [pendente, efetuado, cancelado]
 *         description: Filtrar por status do repasse
 *       - in: query
 *         name: processoId
 *         schema:
 *           type: integer
 *         description: Filtrar por ID do processo
 *       - in: query
 *         name: dataInicio
 *         schema:
 *           type: string
 *           format: date
 *         description: Data de início do período
 *       - in: query
 *         name: dataFim
 *         schema:
 *           type: string
 *           format: date
 *         description: Data fim do período
 *       - in: query
 *         name: valorMinimo
 *         schema:
 *           type: number
 *         description: Valor mínimo do repasse
 *       - in: query
 *         name: valorMaximo
 *         schema:
 *           type: number
 *         description: Valor máximo do repasse
 *     responses:
 *       200:
 *         description: Lista de repasses pendentes
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
 *                     $ref: '#/components/schemas/RepassePendente'
 *       401:
 *         description: Não autenticado
 */

import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/backend/auth/api-auth';
import { listarRepassesPendentes, type FiltrosRepassesPendentes } from '@/backend/acordos-condenacoes/services/persistence/repasse-persistence.service';

export async function GET(request: NextRequest) {
  try {
    const authResult = await authenticateRequest(request);
    if (!authResult.authenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const filtros: FiltrosRepassesPendentes = {
      statusRepasse: searchParams.get('statusRepasse') as FiltrosRepassesPendentes['statusRepasse'],
      processoId: searchParams.get('processoId')
        ? parseInt(searchParams.get('processoId')!, 10)
        : undefined,
      dataInicio: searchParams.get('dataInicio') || undefined,
      dataFim: searchParams.get('dataFim') || undefined,
      valorMinimo: searchParams.get('valorMinimo')
        ? parseFloat(searchParams.get('valorMinimo')!)
        : undefined,
      valorMaximo: searchParams.get('valorMaximo')
        ? parseFloat(searchParams.get('valorMaximo')!)
        : undefined,
    };

    const repasses = await listarRepassesPendentes(filtros);

    return NextResponse.json({ success: true, data: repasses });
  } catch (error) {
    console.error('Erro ao listar repasses pendentes:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
