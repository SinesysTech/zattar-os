/**
 * @swagger
 * /api/pendentes-manifestacao/{id}/observacoes:
 *   patch:
 *     summary: Atualiza observações de expediente pendente
 *     description: Atualiza as observações de um expediente pendente de manifestação
 *     tags:
 *       - Pendentes Manifestação
 *     security:
 *       - bearerAuth: []
 *       - sessionAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID do expediente pendente
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               observacoes:
 *                 type: string
 *                 nullable: true
 *                 description: Novas observações ou null para remover
 *     responses:
 *       200:
 *         description: Observações atualizadas com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *       400:
 *         description: Dados inválidos
 *       401:
 *         description: Não autenticado
 *       403:
 *         description: Sem permissão
 *       404:
 *         description: Expediente não encontrado
 */

import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/backend/auth/require-permission';
import { createServiceClient } from '@/backend/utils/supabase/service-client';
import { deletePattern, CACHE_PREFIXES } from '@/backend/utils/redis/cache-utils';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authOrError = await requirePermission(request, 'pendentes', 'editar_tipo_descricao');
    if (authOrError instanceof NextResponse) {
      return authOrError;
    }

    const { id: idParam } = await params;
    const expedienteId = parseInt(idParam, 10);
    if (isNaN(expedienteId) || expedienteId <= 0) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
    }

    const body = await request.json();
    const { observacoes } = body as { observacoes: string | null };

    if (observacoes !== null && observacoes !== undefined && observacoes !== '') {
      if (typeof observacoes !== 'string') {
        return NextResponse.json({ error: 'Observações devem ser uma string' }, { status: 400 });
      }
    }

    const supabase = createServiceClient();

    const { data, error } = await supabase
      .from('expedientes')
      .update({ observacoes: observacoes || null, updated_at: new Date().toISOString() })
      .eq('id', expedienteId)
      .select()
      .single();

    if (error) {
      if ((error as { code?: string }).code === 'PGRST116') {
        return NextResponse.json({ error: 'Expediente não encontrado' }, { status: 404 });
      }
      throw error;
    }

    try {
      await deletePattern(`${CACHE_PREFIXES.pendentes}:*`);
    } catch {}

    return NextResponse.json({ success: true, message: 'Observações atualizadas com sucesso', data });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Erro interno do servidor';
    if (msg.includes('não encontrado')) {
      return NextResponse.json({ error: msg }, { status: 404 });
    }
    if (msg.includes('inválido') || msg.includes('inválida')) {
      return NextResponse.json({ error: msg }, { status: 400 });
    }
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

