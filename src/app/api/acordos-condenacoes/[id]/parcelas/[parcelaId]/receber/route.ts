/**
 * @swagger
 * /api/acordos-condenacoes/{id}/parcelas/{parcelaId}/receber:
 *   post:
 *     summary: Marca parcela como recebida ou paga
 *     description: Atualiza o status de uma parcela para recebida ou paga
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
 *             required:
 *               - tipo
 *             properties:
 *               tipo:
 *                 type: string
 *                 enum: [recebida, paga]
 *                 description: Tipo de marcação (recebida para créditos, paga para débitos)
 *     responses:
 *       200:
 *         description: Parcela marcada com sucesso
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
 *         description: Erro ao marcar parcela
 *       401:
 *         description: Não autenticado
 */

import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/backend/auth/api-auth';
import { marcarComoRecebida, marcarComoPaga } from '@/backend/acordos-condenacoes/services/parcelas/marcar-como-recebida.service';

export async function POST(
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
    const { tipo } = body; // 'recebida' ou 'paga'

    const resultado =
      tipo === 'paga'
        ? await marcarComoPaga(parcelaId)
        : await marcarComoRecebida(parcelaId);

    if (!resultado.sucesso) {
      return NextResponse.json({ error: resultado.erro }, { status: 400 });
    }

    return NextResponse.json({ success: true, data: resultado.parcela });
  } catch (error) {
    console.error('Erro ao marcar parcela:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
