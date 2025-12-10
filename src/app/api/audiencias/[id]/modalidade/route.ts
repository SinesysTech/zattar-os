// Rota de API para atualizar modalidade da audiência manualmente

import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/backend/auth/require-permission';
import { createServiceClient } from '@/backend/utils/supabase/service-client';
import { deletePattern } from '@/backend/utils/redis/cache-utils';
import { CACHE_PREFIXES } from '@/backend/utils/redis/cache-utils';
import type { ModalidadeAudiencia } from '@/backend/types/audiencias/types';

const MODALIDADES_VALIDAS: ModalidadeAudiencia[] = ['virtual', 'presencial', 'hibrida'];

/**
 * @swagger
 * /api/audiencias/{id}/modalidade:
 *   patch:
 *     summary: Atualiza modalidade da audiência manualmente
 *     description: |
 *       Atualiza a modalidade de uma audiência.
 *       Útil especialmente para definir audiências híbridas, que não são detectadas automaticamente.
 *
 *       **Nota:** A modalidade também é atualizada automaticamente por um trigger no banco quando:
 *       - `virtual`: URL de audiência virtual preenchida OU tipo contém "videoconfer"
 *       - `presencial`: Endereço presencial preenchido
 *       - `hibrida`: Somente pode ser definida manualmente através desta rota
 *     tags:
 *       - Audiências
 *     security:
 *       - bearerAuth: []
 *       - sessionAuth: []
 *       - serviceApiKey: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID da audiência
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - modalidade
 *             properties:
 *               modalidade:
 *                 type: string
 *                 enum: [virtual, presencial, hibrida]
 *                 description: Nova modalidade da audiência
 *     responses:
 *       200:
 *         description: Modalidade atualizada com sucesso
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
 *                   properties:
 *                     id:
 *                       type: number
 *                     modalidade:
 *                       type: string
 *       400:
 *         description: Dados inválidos
 *       404:
 *         description: Audiência não encontrada
 *       401:
 *         description: Não autenticado
 *       403:
 *         description: Sem permissão
 *       500:
 *         description: Erro interno do servidor
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 1. Verificar permissão: audiencias.editar
    const authOrError = await requirePermission(request, 'audiencias', 'editar');
    if (authOrError instanceof NextResponse) {
      return authOrError;
    }

    // 2. Await params e validar ID
    const { id: idParam } = await params;
    const audienciaId = parseInt(idParam, 10);
    if (isNaN(audienciaId) || audienciaId <= 0) {
      return NextResponse.json(
        { error: 'ID inválido' },
        { status: 400 }
      );
    }

    // 3. Obter dados do body
    const body = await request.json();
    const { modalidade } = body;

    // 4. Validar modalidade
    if (!modalidade || !MODALIDADES_VALIDAS.includes(modalidade)) {
      return NextResponse.json(
        { error: `Modalidade inválida. Valores aceitos: ${MODALIDADES_VALIDAS.join(', ')}` },
        { status: 400 }
      );
    }

    // 5. Atualizar modalidade
    const supabase = createServiceClient();

    const { data, error } = await supabase
      .from('audiencias')
      .update({
        modalidade,
        updated_at: new Date().toISOString(),
      })
      .eq('id', audienciaId)
      .select('id, modalidade')
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Audiência não encontrada' },
          { status: 404 }
        );
      }
      throw error;
    }

    // 6. Invalidar cache de audiências
    try {
      await deletePattern(`${CACHE_PREFIXES.audiencias}:*`);
    } catch (cacheError) {
      console.warn('Erro ao invalidar cache de audiências:', cacheError);
    }

    return NextResponse.json({
      success: true,
      message: 'Modalidade da audiência atualizada com sucesso',
      data,
    });
  } catch (error) {
    console.error('Erro ao atualizar modalidade da audiência:', error);
    const erroMsg = error instanceof Error ? error.message : 'Erro interno do servidor';

    return NextResponse.json(
      { error: erroMsg },
      { status: 500 }
    );
  }
}
