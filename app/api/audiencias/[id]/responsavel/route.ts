// Rota de API para atribuir responsável a audiência
// PATCH: Atribuir/transferir/desatribuir responsável

import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/backend/utils/auth/require-permission';
import { atribuirResponsavelAudiencia } from '@/backend/audiencias/services/atribuir-responsavel.service';

/**
 * @swagger
 * /api/audiencias/{id}/responsavel:
 *   patch:
 *     summary: Atribui responsável a uma audiência
 *     description: |
 *       Atribui, transfere ou desatribui um responsável de uma audiência.
 *       Todas as alterações são automaticamente registradas em logs_alteracao.
 *       
 *       **Tipos de operação:**
 *       - Atribuição: quando audiência não tem responsável e um é atribuído
 *       - Transferência: quando audiência tem responsável e é atribuído a outro
 *       - Desatribuição: quando responsavelId é null
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
 *             $ref: '#/components/schemas/AtribuirResponsavelRequest'
 *           example:
 *             responsavelId: 15
 *     responses:
 *       200:
 *         description: Responsável atribuído com sucesso
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
 *                   description: Dados atualizados da audiência
 *                   properties:
 *                     id:
 *                       type: integer
 *                     responsavel_id:
 *                       type: integer
 *                       nullable: true
 *       400:
 *         description: Dados inválidos
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               error: "Audiência não encontrada"
 *       401:
 *         description: Não autenticado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Erro interno do servidor
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 1. Verificar permissão: audiencias.atribuir_responsavel
    const authOrError = await requirePermission(request, 'audiencias', 'atribuir_responsavel');
    if (authOrError instanceof NextResponse) {
      return authOrError;
    }
    const { usuarioId } = authOrError;

    // 2. Obter ID da audiência
    const { id } = await params;
    const audienciaId = parseInt(id, 10);

    if (isNaN(audienciaId)) {
      return NextResponse.json(
        { error: 'ID da audiência inválido' },
        { status: 400 }
      );
    }

    // 3. Obter body da requisição
    const body = await request.json();
    const { responsavelId } = body;

    // Validar responsavelId (deve ser número positivo ou null/undefined)
    if (responsavelId !== null && responsavelId !== undefined) {
      if (typeof responsavelId !== 'number' || responsavelId <= 0 || !Number.isInteger(responsavelId)) {
        return NextResponse.json(
          { error: 'responsavelId deve ser um número inteiro positivo ou null' },
          { status: 400 }
        );
      }
    }

    // 4. Executar atribuição
    const resultado = await atribuirResponsavelAudiencia({
      audienciaId,
      responsavelId: responsavelId ?? null,
      usuarioExecutouId: usuarioId,
    });

    if (!resultado.success) {
      const statusCode = resultado.error?.includes('não encontrado') ? 404 : 400;
      return NextResponse.json(
        { error: resultado.error || 'Erro ao atribuir responsável' },
        { status: statusCode }
      );
    }

    // 5. Retornar resultado
    return NextResponse.json({
      success: true,
      data: resultado.data,
    });

  } catch (error) {
    console.error('Error in atribuir responsavel audiencia:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

