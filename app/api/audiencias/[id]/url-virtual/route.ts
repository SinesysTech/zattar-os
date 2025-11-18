// Rota de API para atualizar URL de audiência virtual

import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/backend/utils/auth/require-permission';
import { atualizarUrlVirtualAudiencia } from '@/backend/audiencias/services/atualizar-url-virtual.service';

/**
 * @swagger
 * /api/audiencias/{id}/url-virtual:
 *   patch:
 *     summary: Atualiza URL da audiência virtual
 *     description: Atualiza o link da audiência virtual de uma audiência
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
 *             properties:
 *               urlAudienciaVirtual:
 *                 type: string
 *                 nullable: true
 *                 description: URL da audiência virtual (null para remover)
 *                 example: "https://meet.google.com/abc-defg-hij"
 *     responses:
 *       200:
 *         description: URL atualizada com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "URL da audiência virtual atualizada com sucesso"
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
    // 1. Verificar permissão: audiencias.editar_url_virtual
    const authOrError = await requirePermission(request, 'audiencias', 'editar_url_virtual');
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
    const { urlAudienciaVirtual } = body;

    // Validar tipo
    if (urlAudienciaVirtual !== null && urlAudienciaVirtual !== undefined && urlAudienciaVirtual !== '') {
      if (typeof urlAudienciaVirtual !== 'string') {
        return NextResponse.json(
          { error: 'URL deve ser uma string' },
          { status: 400 }
        );
      }
    }

    // 4. Atualizar URL da audiência usando service layer
    const data = await atualizarUrlVirtualAudiencia({
      audienciaId,
      urlAudienciaVirtual: urlAudienciaVirtual || null,
    });

    return NextResponse.json({
      success: true,
      message: 'URL da audiência virtual atualizada com sucesso',
      data,
    });
  } catch (error) {
    console.error('Erro ao atualizar URL da audiência virtual:', error);
    const erroMsg = error instanceof Error ? error.message : 'Erro interno do servidor';

    // Verificar tipo de erro
    if (erroMsg.includes('não encontrada')) {
      return NextResponse.json(
        { error: erroMsg },
        { status: 404 }
      );
    }

    if (erroMsg.includes('inválido') || erroMsg.includes('inválida')) {
      return NextResponse.json(
        { error: erroMsg },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: erroMsg },
      { status: 500 }
    );
  }
}
