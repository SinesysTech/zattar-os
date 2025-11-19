// Rota de API para atualizar observações de audiência

import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/backend/utils/auth/require-permission';
import { createClient } from '@/lib/supabase/server';

/**
 * @swagger
 * /api/audiencias/{id}/observacoes:
 *   patch:
 *     summary: Atualiza observações da audiência
 *     description: Atualiza as observações de uma audiência
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
 *               observacoes:
 *                 type: string
 *                 nullable: true
 *                 description: Observações da audiência (null para remover)
 *                 example: "Cliente solicitou adiamento"
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
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Observações da audiência atualizadas com sucesso"
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
    const { observacoes } = body;

    // Validar tipo
    if (observacoes !== null && observacoes !== undefined && observacoes !== '') {
      if (typeof observacoes !== 'string') {
        return NextResponse.json(
          { error: 'Observações devem ser uma string' },
          { status: 400 }
        );
      }
    }

    // 4. Atualizar observações da audiência
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('audiencias')
      .update({
        observacoes: observacoes || null,
        updated_at: new Date().toISOString(),
      })
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

    return NextResponse.json({
      success: true,
      message: 'Observações da audiência atualizadas com sucesso',
      data,
    });
  } catch (error) {
    console.error('Erro ao atualizar observações da audiência:', error);
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
