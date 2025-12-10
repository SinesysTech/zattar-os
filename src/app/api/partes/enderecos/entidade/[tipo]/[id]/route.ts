/**
 * API Route: /api/partes/enderecos/entidade/[tipo]/[id]
 * Busca endereços de uma entidade específica
 */

import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/backend/auth/api-auth';
import { buscarEnderecosPorEntidade } from '@/backend/partes/services/enderecos-persistence.service';
import type { BuscarEnderecosPorEntidadeParams } from '@/backend/types/partes/enderecos-types';

type RouteContext = {
  params: Promise<{
    tipo: string;
    id: string;
  }>;
};

/**
 * @swagger
 * /api/partes/enderecos/entidade/{tipo}/{id}:
 *   get:
 *     summary: Busca endereços de uma entidade
 *     tags: [Endereços]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: tipo
 *         required: true
 *         schema:
 *           type: string
 *           enum: [cliente, parte_contraria, terceiro, representante]
 *         description: Tipo de entidade
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID da entidade
 *       - in: query
 *         name: correspondencia
 *         schema:
 *           type: boolean
 *         description: Filtrar apenas endereços de correspondência
 *       - in: query
 *         name: ativo
 *         schema:
 *           type: boolean
 *         description: Filtrar apenas endereços ativos
 *     responses:
 *       200:
 *         description: Lista de endereços da entidade
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Endereco'
 *       400:
 *         description: Parâmetros inválidos
 *       401:
 *         description: Não autorizado
 *       500:
 *         description: Erro interno do servidor
 */
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    // Authenticate
    const authResult = await authenticateRequest(request);
    if (!authResult.authenticated) {
      return NextResponse.json(
        { success: false, error: 'Não autorizado' },
        { status: 401 }
      );
    }

    // Parse path parameters
    const { tipo, id } = await context.params;
    const entidadeId = parseInt(id);

    if (isNaN(entidadeId) || entidadeId <= 0) {
      return NextResponse.json(
        { success: false, error: 'ID inválido' },
        { status: 400 }
      );
    }

    const validTipos = ['cliente', 'parte_contraria', 'terceiro', 'representante'];
    if (!validTipos.includes(tipo)) {
      return NextResponse.json(
        { success: false, error: 'Tipo de entidade inválido' },
        { status: 400 }
      );
    }

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const params: BuscarEnderecosPorEntidadeParams = {
      entidade_tipo: tipo as BuscarEnderecosPorEntidadeParams['entidade_tipo'],
      entidade_id: entidadeId,
      correspondencia: searchParams.get('correspondencia') === 'true' ? true : searchParams.get('correspondencia') === 'false' ? false : undefined,
      ativo: searchParams.get('ativo') === 'true' ? true : searchParams.get('ativo') === 'false' ? false : undefined,
    };

    // Find enderecos
    const enderecos = await buscarEnderecosPorEntidade(params);

    return NextResponse.json({ success: true, data: enderecos }, { status: 200 });
  } catch (error) {
    console.error('Erro ao buscar endereços por entidade:', error);
    return NextResponse.json(
      { success: false, error: 'Erro ao buscar endereços por entidade' },
      { status: 500 }
    );
  }
}
