/**
 * API Route: /api/partes/enderecos/[id]
 * Item endpoint - GET, PATCH, DELETE single endereco
 */

import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/backend/auth/api-auth';
import {
  buscarEnderecoPorId,
  atualizarEndereco,
  deletarEndereco,
} from '@/backend/partes/services/enderecos-persistence.service';
import type { AtualizarEnderecoParams } from '@/backend/types/partes/enderecos-types';

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

/**
 * @swagger
 * /api/partes/enderecos/{id}:
 *   get:
 *     summary: Busca endereço por ID
 *     tags: [Endereços]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID do endereço
 *     responses:
 *       200:
 *         description: Endereço encontrado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Endereco'
 *       400:
 *         description: ID inválido
 *       401:
 *         description: Não autorizado
 *       404:
 *         description: Endereço não encontrado
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

    // Parse ID
    const { id } = await context.params;
    const enderecoId = parseInt(id);

    if (isNaN(enderecoId) || enderecoId <= 0) {
      return NextResponse.json(
        { success: false, error: 'ID inválido' },
        { status: 400 }
      );
    }

    // Find endereco
    const endereco = await buscarEnderecoPorId(enderecoId);

    if (!endereco) {
      return NextResponse.json(
        { success: false, error: 'Endereço não encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: endereco }, { status: 200 });
  } catch (error) {
    console.error('Erro ao buscar endereço:', error);
    return NextResponse.json(
      { success: false, error: 'Erro ao buscar endereço' },
      { status: 500 }
    );
  }
}

/**
 * @swagger
 * /api/partes/enderecos/{id}:
 *   patch:
 *     summary: Atualiza endereço existente
 *     tags: [Endereços]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID do endereço
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               logradouro:
 *                 type: string
 *                 description: Nome da rua/avenida
 *               numero:
 *                 type: string
 *                 description: Número do imóvel
 *               complemento:
 *                 type: string
 *                 description: Complemento do endereço
 *               bairro:
 *                 type: string
 *                 description: Bairro
 *               municipio:
 *                 type: string
 *                 description: Município/cidade
 *               estado_sigla:
 *                 type: string
 *                 description: UF do estado
 *               cep:
 *                 type: string
 *                 description: CEP (apenas números)
 *               correspondencia:
 *                 type: boolean
 *                 description: Indica se é endereço de correspondência
 *               ativo:
 *                 type: boolean
 *                 description: Indica se o endereço está ativo
 *             description: Campos entidade_tipo e entidade_id não podem ser alterados
 *     responses:
 *       200:
 *         description: Endereço atualizado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Endereco'
 *       400:
 *         description: Dados inválidos ou campos imutáveis
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

    // Parse request body
    const body = await request.json();

    // Check for immutable fields
    if ('entidade_tipo' in body || 'entidade_id' in body) {
      return NextResponse.json(
        { success: false, error: 'Campos entidade_tipo e entidade_id não podem ser alterados' },
        { status: 400 }
      );
    }

    const params: AtualizarEnderecoParams = {
      id: enderecoId,
      ...body,
    };

    // Update endereco
    const result = await atualizarEndereco(params);

    if (!result.sucesso) {
      if (result.erro?.includes('não encontrado')) {
        return NextResponse.json(
          { success: false, error: result.erro },
          { status: 404 }
        );
      }

      return NextResponse.json(
        { success: false, error: result.erro },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true, data: result.endereco }, { status: 200 });
  } catch (error) {
    console.error('Erro ao atualizar endereço:', error);
    return NextResponse.json(
      { success: false, error: 'Erro ao atualizar endereço' },
      { status: 500 }
    );
  }
}

/**
 * @swagger
 * /api/partes/enderecos/{id}:
 *   delete:
 *     summary: Remove endereço
 *     tags: [Endereços]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID do endereço
 *     responses:
 *       200:
 *         description: Endereço removido com sucesso
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
export async function DELETE(request: NextRequest, context: RouteContext) {
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

    // Delete endereco
    const result = await deletarEndereco(enderecoId);

    if (!result.sucesso) {
      if (result.erro?.includes('não encontrado')) {
        return NextResponse.json(
          { success: false, error: result.erro },
          { status: 404 }
        );
      }

      return NextResponse.json(
        { success: false, error: result.erro },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('Erro ao deletar endereço:', error);
    return NextResponse.json(
      { success: false, error: 'Erro ao deletar endereço' },
      { status: 500 }
    );
  }
}
