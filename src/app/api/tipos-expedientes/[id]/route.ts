// Rota de API para operações em tipos de expedientes por ID
// GET: Buscar tipo por ID | PATCH: Atualizar tipo | DELETE: Deletar tipo

import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/backend/auth/api-auth';
import { buscarTipoExpediente } from '@/backend/tipos-expedientes/services/tipos-expedientes/buscar-tipo-expediente.service';
import { atualizarTipoExpediente } from '@/backend/tipos-expedientes/services/tipos-expedientes/atualizar-tipo-expediente.service';
import { deletarTipoExpediente } from '@/backend/tipos-expedientes/services/tipos-expedientes/deletar-tipo-expediente.service';
import type { AtualizarTipoExpedienteParams } from '@/backend/types/tipos-expedientes/types';

/**
 * @swagger
 * /api/tipos-expedientes/{id}:
 *   get:
 *     summary: Busca um tipo de expediente por ID
 *     description: Retorna os dados completos de um tipo de expediente específico
 *     tags:
 *       - Tipos de Expedientes
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
 *         description: ID do tipo de expediente
 *     responses:
 *       200:
 *         description: Tipo de expediente retornado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/TipoExpediente'
 *       404:
 *         description: Tipo de expediente não encontrado
 *       401:
 *         description: Não autenticado
 *       500:
 *         description: Erro interno do servidor
 *   patch:
 *     summary: Atualiza um tipo de expediente
 *     description: Atualiza os dados de um tipo de expediente existente
 *     tags:
 *       - Tipos de Expedientes
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
 *         description: ID do tipo de expediente
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               tipo_expediente:
 *                 type: string
 *                 description: Novo nome do tipo de expediente (deve ser único)
 *                 example: "Audiência Judicial"
 *     responses:
 *       200:
 *         description: Tipo de expediente atualizado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/TipoExpediente'
 *       400:
 *         description: Dados inválidos ou tipo já existe
 *       404:
 *         description: Tipo de expediente não encontrado
 *       401:
 *         description: Não autenticado
 *       500:
 *         description: Erro interno do servidor
 *   delete:
 *     summary: Deleta um tipo de expediente
 *     description: Remove um tipo de expediente do sistema. Não permite deletar tipos que estão em uso.
 *     tags:
 *       - Tipos de Expedientes
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
 *         description: ID do tipo de expediente
 *     responses:
 *       200:
 *         description: Tipo de expediente deletado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       400:
 *         description: Tipo de expediente não pode ser deletado pois está em uso
 *       404:
 *         description: Tipo de expediente não encontrado
 *       401:
 *         description: Não autenticado
 *       500:
 *         description: Erro interno do servidor
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 1. Autenticação
    const authResult = await authenticateRequest(request);
    if (!authResult.authenticated) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // 2. Await params e validar ID
    const { id: idParam } = await params;
    const id = parseInt(idParam, 10);
    if (isNaN(id) || id <= 0) {
      return NextResponse.json(
        { error: 'ID inválido' },
        { status: 400 }
      );
    }

    // 3. Buscar tipo de expediente
    const tipoExpediente = await buscarTipoExpediente(id);

    if (!tipoExpediente) {
      return NextResponse.json(
        { error: 'Tipo de expediente não encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: tipoExpediente,
    });
  } catch (error) {
    console.error('Erro ao buscar tipo de expediente:', error);
    const erroMsg = error instanceof Error ? error.message : 'Erro interno do servidor';
    return NextResponse.json(
      { error: erroMsg },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 1. Autenticação
    const authResult = await authenticateRequest(request);
    if (!authResult.authenticated) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // 2. Await params e validar ID
    const { id: idParam } = await params;
    const id = parseInt(idParam, 10);
    if (isNaN(id) || id <= 0) {
      return NextResponse.json(
        { error: 'ID inválido' },
        { status: 400 }
      );
    }

    // 3. Obter dados do body
    const body = await request.json();
    const updateParams: AtualizarTipoExpedienteParams = {};

    if (body.tipo_expediente !== undefined) {
      if (typeof body.tipo_expediente !== 'string') {
        return NextResponse.json(
          { error: 'Campo tipo_expediente deve ser uma string' },
          { status: 400 }
        );
      }
      updateParams.tipo_expediente = body.tipo_expediente;
    }

    // 4. Atualizar tipo de expediente
    const tipoExpediente = await atualizarTipoExpediente(id, updateParams);

    return NextResponse.json({
      success: true,
      data: tipoExpediente,
    });
  } catch (error) {
    console.error('Erro ao atualizar tipo de expediente:', error);
    const erroMsg = error instanceof Error ? error.message : 'Erro interno do servidor';
    
    // Verificar tipo de erro
    if (erroMsg.includes('não encontrado')) {
      return NextResponse.json(
        { error: erroMsg },
        { status: 404 }
      );
    }
    
    if (erroMsg.includes('já cadastrado') || erroMsg.includes('inválido')) {
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

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 1. Autenticação
    const authResult = await authenticateRequest(request);
    if (!authResult.authenticated) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // 2. Await params e validar ID
    const { id: idParam } = await params;
    const id = parseInt(idParam, 10);
    if (isNaN(id) || id <= 0) {
      return NextResponse.json(
        { error: 'ID inválido' },
        { status: 400 }
      );
    }

    // 3. Deletar tipo de expediente
    await deletarTipoExpediente(id);

    return NextResponse.json({
      success: true,
      message: 'Tipo de expediente deletado com sucesso',
    });
  } catch (error) {
    console.error('Erro ao deletar tipo de expediente:', error);
    const erroMsg = error instanceof Error ? error.message : 'Erro interno do servidor';
    
    // Verificar tipo de erro
    if (erroMsg.includes('não encontrado')) {
      return NextResponse.json(
        { error: erroMsg },
        { status: 404 }
      );
    }
    
    if (erroMsg.includes('em uso') || erroMsg.includes('não pode ser deletado')) {
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

