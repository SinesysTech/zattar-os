/**
 * @swagger
 * /api/acordos-condenacoes/{id}/parcelas/{parcelaId}:
 *   put:
 *     summary: Atualiza uma parcela
 *     description: Atualiza os valores de uma parcela específica de um acordo/condenação
 *     tags:
 *       - Acordos e Condenações
 *     security:
 *       - bearerAuth: []
 *       - sessionAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID do acordo/condenação
 *       - in: path
 *         name: parcelaId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID da parcela
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               valorBrutoCreditoPrincipal:
 *                 type: number
 *                 description: Valor bruto do crédito principal (deve ser > 0)
 *               honorariosSucumbenciais:
 *                 type: number
 *                 description: Valor dos honorários sucumbenciais (>= 0)
 *               dataVencimento:
 *                 type: string
 *                 format: date
 *                 description: Data de vencimento da parcela
 *     responses:
 *       200:
 *         description: Parcela atualizada com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *       400:
 *         description: Dados inválidos
 *       401:
 *         description: Não autenticado
 */

import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/backend/auth/api-auth';
import { atualizarParcela } from '@/backend/acordos-condenacoes/services/persistence/parcela-persistence.service';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; parcelaId: string }> }
) {
  try {
    const authResult = await authenticateRequest(request);
    if (!authResult.authenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { parcelaId: parcelaIdStr } = await params;
    const parcelaId = parseInt(parcelaIdStr, 10);

    const body = await request.json();

    // Validações
    if (body.valorBrutoCreditoPrincipal !== undefined && body.valorBrutoCreditoPrincipal <= 0) {
      return NextResponse.json(
        { error: 'Valor bruto do crédito principal deve ser maior que zero' },
        { status: 400 }
      );
    }

    if (body.honorariosSucumbenciais !== undefined && body.honorariosSucumbenciais < 0) {
      return NextResponse.json(
        { error: 'Honorários sucumbenciais não podem ser negativos' },
        { status: 400 }
      );
    }

    const resultado = await atualizarParcela(parcelaId, body);

    if (!resultado) {
      return NextResponse.json(
        { error: 'Erro ao atualizar parcela' },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true, data: resultado });
  } catch (error) {
    console.error('Erro ao atualizar parcela:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
