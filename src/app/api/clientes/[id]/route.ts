// Rota de API para operacoes em cliente especifico
// GET: Buscar cliente por ID | PATCH: Atualizar cliente

import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/backend/auth/api-auth';
import {
  buscarCliente,
  atualizarCliente,
  type UpdateClienteInput,
  toAppError,
  errorCodeToHttpStatus,
  isPartesError,
} from '@/core/partes';

/**
 * @swagger
 * /api/clientes/{id}:
 *   get:
 *     summary: Busca um cliente por ID
 *     description: Retorna os dados completos de um cliente específico
 *     tags:
 *       - Clientes
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
 *         description: ID do cliente
 *     responses:
 *       200:
 *         description: Cliente encontrado
 *       404:
 *         description: Cliente não encontrado
 *       401:
 *         description: Não autenticado
 *       500:
 *         description: Erro interno do servidor
 *   patch:
 *     summary: Atualiza um cliente parcialmente
 *     description: Atualiza campos específicos de um cliente existente
 *     tags:
 *       - Clientes
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
 *         description: ID do cliente
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nome:
 *                 type: string
 *               nomeFantasia:
 *                 type: string
 *               cpf:
 *                 type: string
 *               cnpj:
 *                 type: string
 *               rg:
 *                 type: string
 *               dataNascimento:
 *                 type: string
 *                 format: date
 *               genero:
 *                 type: string
 *                 enum: [masculino, feminino, outro, prefiro_nao_informar]
 *               estadoCivil:
 *                 type: string
 *                 enum: [solteiro, casado, divorciado, viuvo, uniao_estavel, outro]
 *               nacionalidade:
 *                 type: string
 *               naturalidade:
 *                 type: string
 *               inscricaoEstadual:
 *                 type: string
 *               email:
 *                 type: string
 *               telefonePrimario:
 *                 type: string
 *               telefoneSecundario:
 *                 type: string
 *               endereco:
 *                 type: object
 *               observacoes:
 *                 type: string
 *               ativo:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Cliente atualizado com sucesso
 *       400:
 *         description: Dados inválidos ou duplicados
 *       404:
 *         description: Cliente não encontrado
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
    // 1. Autenticacao
    const authResult = await authenticateRequest(request);
    if (!authResult.authenticated) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // 2. Obter ID do parametro
    const { id } = await params;
    const clienteId = parseInt(id, 10);

    if (isNaN(clienteId)) {
      return NextResponse.json(
        { error: 'ID invalido', code: 'VALIDATION_ERROR' },
        { status: 400 }
      );
    }

    // 3. Buscar cliente via core service (Result pattern)
    const result = await buscarCliente(clienteId);

    if (!result.success) {
      const status = errorCodeToHttpStatus(result.error.code);
      return NextResponse.json(
        {
          error: result.error.message,
          code: result.error.code,
          details: result.error.details,
        },
        { status }
      );
    }

    if (!result.data) {
      return NextResponse.json(
        { error: 'Cliente nao encontrado', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: result.data,
    });
  } catch (error) {
    console.error('Erro ao buscar cliente:', error);

    // Converter erros de dominio para AppError
    if (isPartesError(error)) {
      const appErr = toAppError(error);
      const status = errorCodeToHttpStatus(appErr.code);
      return NextResponse.json(
        { error: appErr.message, code: appErr.code, details: appErr.details },
        { status }
      );
    }

    const erroMsg = error instanceof Error ? error.message : 'Erro interno do servidor';
    return NextResponse.json(
      { error: erroMsg, code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 1. Autenticacao
    const authResult = await authenticateRequest(request);
    if (!authResult.authenticated) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // 2. Obter ID do parametro
    const { id } = await params;
    const clienteId = parseInt(id, 10);

    if (isNaN(clienteId)) {
      return NextResponse.json(
        { error: 'ID invalido', code: 'VALIDATION_ERROR' },
        { status: 400 }
      );
    }

    // 3. Validar e parsear body da requisicao
    const body = await request.json();
    const input = body as UpdateClienteInput;

    // 4. Atualizar cliente via core service (Result pattern)
    // O service faz validacao completa via Zod e retorna Result<Cliente>
    const result = await atualizarCliente(clienteId, input);

    if (!result.success) {
      const status = errorCodeToHttpStatus(result.error.code);
      return NextResponse.json(
        {
          error: result.error.message,
          code: result.error.code,
          details: result.error.details,
        },
        { status }
      );
    }

    return NextResponse.json({
      success: true,
      data: result.data,
    });
  } catch (error) {
    console.error('Erro ao atualizar cliente:', error);

    // Converter erros de dominio para AppError
    if (isPartesError(error)) {
      const appErr = toAppError(error);
      const status = errorCodeToHttpStatus(appErr.code);
      return NextResponse.json(
        { error: appErr.message, code: appErr.code, details: appErr.details },
        { status }
      );
    }

    const erroMsg = error instanceof Error ? error.message : 'Erro interno do servidor';
    return NextResponse.json(
      { error: erroMsg, code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}

