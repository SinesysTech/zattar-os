/**
 * API Route: /api/partes/enderecos/[id]/principal
 * Define endereço como principal (correspondência)
 */

import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/backend/auth/api-auth';
import {
  buscarEnderecoPorId,
  definirEnderecoPrincipal,
} from '@/backend/partes/services/enderecos-persistence.service';

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

/**
 * @swagger
 * /api/partes/enderecos/{id}/principal:
 *   patch:
 *     summary: Define endereço como principal (correspondência)
 *     description: Remove a flag de correspondência de todos os endereços da entidade e define o endereço especificado como principal
 *     tags: [Endereços]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID do endereço a ser definido como principal
 *     responses:
 *       200:
 *         description: Endereço definido como principal com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *       400:
 *         description: ID inválido
 *       401:
 *         description: Não autorizado
 *       404:
 *         description: Endereço não encontrado
 *       500:
 *         description: Erro interno do servidor
 */
export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    // Authenticate
    const authResult = await authenticateRequest(request);
    if (!authResult.authenticated) {
      return NextResponse.json(
        { success: false, error: 'Não autorizado' },
        { status: 401 }
      );
    }

    // Parse ID
    const { id } = await context.params;
    const enderecoId = parseInt(id);

    if (isNaN(enderecoId) || enderecoId <= 0) {
      return NextResponse.json(
        { success: false, error: 'ID inválido' },
        { status: 400 }
      );
    }

    // First check if endereco exists
    const endereco = await buscarEnderecoPorId(enderecoId);
    if (!endereco) {
      return NextResponse.json(
        { success: false, error: 'Endereço não encontrado' },
        { status: 404 }
      );
    }

    // Set as principal
    const result = await definirEnderecoPrincipal({
      id: enderecoId,
      entidade_tipo: endereco.entidade_tipo,
      entidade_id: endereco.entidade_id,
    });

    if (!result.sucesso) {
      return NextResponse.json(
        { success: false, error: result.erro },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('Erro ao definir endereço principal:', error);
    return NextResponse.json(
      { success: false, error: 'Erro ao definir endereço principal' },
      { status: 500 }
    );
  }
}
