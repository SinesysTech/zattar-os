// Rota de API para atualizar status da audiência (marcar como realizada)

import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/backend/auth/require-permission';
import { createServiceClient } from '@/backend/utils/supabase/service-client';
import { deletePattern } from '@/backend/utils/redis/cache-utils';
import { CACHE_PREFIXES } from '@/backend/utils/redis/cache-utils';

/**
 * @swagger
 * /api/audiencias/{id}/status:
 *   patch:
 *     summary: Atualiza status da audiência
 *     description: |
 *       Atualiza o status de uma audiência.
 *       Usado principalmente para marcar audiências como realizadas.
 *       - M = Designada
 *       - F = Realizada
 *       - C = Cancelada
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
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [M, F, C]
 *                 description: Novo status da audiência (M=Designada, F=Realizada, C=Cancelada)
 *     responses:
 *       200:
 *         description: Status atualizado com sucesso
 *       400:
 *         description: Dados inválidos
 *       404:
 *         description: Audiência não encontrada
 *       401:
 *         description: Não autenticado
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
    const { status } = body;

    // Validar status
    const statusValidos = ['M', 'F', 'C'];
    if (!status || !statusValidos.includes(status)) {
      return NextResponse.json(
        { error: 'Status inválido. Use M (Designada), F (Realizada) ou C (Cancelada)' },
        { status: 400 }
      );
    }

    // Mapeamento de status para descrição
    const statusDescricao: Record<string, string> = {
      'M': 'Designada',
      'F': 'Realizada',
      'C': 'Cancelada',
    };

    // 4. Preparar dados para atualização
    const supabase = createServiceClient();
    const updateData = {
      status,
      status_descricao: statusDescricao[status],
      designada: status === 'M',
      updated_at: new Date().toISOString(),
    };

    // 5. Atualizar status da audiência
    const { data, error } = await supabase
      .from('audiencias')
      .update(updateData)
      .eq('id', audienciaId)
      .select()
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
      message: `Audiência marcada como ${statusDescricao[status]}`,
      data,
    });
  } catch (error) {
    console.error('Erro ao atualizar status da audiência:', error);
    const erroMsg = error instanceof Error ? error.message : 'Erro interno do servidor';

    return NextResponse.json(
      { error: erroMsg },
      { status: 500 }
    );
  }
}

