/**
 * GET /api/acervo/:id/timeline
 * 
 * Obtém a timeline completa de um processo, incluindo dados do MongoDB
 */

import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/backend/utils/auth/api-auth';
import { createServiceClient } from '@/backend/utils/supabase/service-client';
import { obterTimelinePorMongoId } from '@/backend/captura/services/timeline/timeline-persistence.service';

/**
 * @swagger
 * /api/acervo/{id}/timeline:
 *   get:
 *     tags:
 *       - Acervo
 *     summary: Obtém timeline do processo
 *     description: |
 *       Retorna os dados do acervo (PostgreSQL) combinados com a timeline completa (MongoDB).
 *       A timeline inclui movimentos, documentos e links para Google Drive.
 *     security:
 *       - BearerAuth: []
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID do acervo
 *     responses:
 *       200:
 *         description: Timeline obtida com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     acervo:
 *                       type: object
 *                       description: Dados do processo (PostgreSQL)
 *                     timeline:
 *                       type: object
 *                       description: Timeline completa (MongoDB)
 *                       properties:
 *                         timeline:
 *                           type: array
 *                           description: Array de itens da timeline
 *                         metadata:
 *                           type: object
 *                           description: Metadados da timeline
 *       404:
 *         description: Acervo ou timeline não encontrado
 *       401:
 *         description: Não autenticado
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 1. Autenticar requisição
    const authResult = await authenticateRequest(request);
    if (!authResult.authenticated) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const acervoId = parseInt(id);

    if (isNaN(acervoId)) {
      return NextResponse.json(
        { error: 'ID do acervo inválido' },
        { status: 400 }
      );
    }

    console.log('[GET /api/acervo/:id/timeline] Buscando dados', { acervoId });

    // 2. Buscar dados do acervo (PostgreSQL)
    const supabase = createServiceClient();
    const { data: acervo, error: acervoError } = await supabase
      .from('acervo')
      .select('*')
      .eq('id', acervoId)
      .single();

    if (acervoError || !acervo) {
      return NextResponse.json(
        { error: 'Acervo não encontrado' },
        { status: 404 }
      );
    }

    // 3. Buscar timeline (MongoDB) - se existir
    let timelineData = null;

    if (acervo.timeline_mongodb_id) {
      try {
        const timelineDoc = await obterTimelinePorMongoId(acervo.timeline_mongodb_id);
        
        if (timelineDoc) {
          // Remover _id do MongoDB da resposta (não é serializável)
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { _id, ...timelineResto } = timelineDoc;
          timelineData = timelineResto;
        }
      } catch (error) {
        console.error('[GET /api/acervo/:id/timeline] Erro ao buscar timeline MongoDB:', error);
        // Continuar sem a timeline se houver erro
      }
    }

    // 4. Retornar dados combinados
    const resultado = {
      acervo,
      timeline: timelineData,
    };

    return NextResponse.json(
      {
        success: true,
        data: resultado,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[GET /api/acervo/:id/timeline] Erro:', error);

    const mensagem = error instanceof Error ? error.message : 'Erro ao obter timeline';

    return NextResponse.json(
      { error: mensagem },
      { status: 500 }
    );
  }
}
