// Rota de API para operações em cliente específico
// GET: Buscar cliente por ID | PATCH: Atualizar cliente

import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/backend/utils/auth/api-auth';
import { obterClientePorId } from '@/backend/clientes/services/clientes/buscar-cliente.service';
import { atualizarCliente } from '@/backend/clientes/services/clientes/atualizar-cliente.service';
import type { ClienteDados } from '@/backend/clientes/services/persistence/cliente-persistence.service';

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
    // 1. Autenticação
    const authResult = await authenticateRequest(request);
    if (!authResult.authenticated) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // 2. Obter ID do parâmetro
    const { id } = await params;
    const clienteId = parseInt(id, 10);

    if (isNaN(clienteId)) {
      return NextResponse.json(
        { error: 'ID inválido' },
        { status: 400 }
      );
    }

    // 3. Buscar cliente
    const cliente = await obterClientePorId(clienteId);

    if (!cliente) {
      return NextResponse.json(
        { error: 'Cliente não encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: cliente,
    });
  } catch (error) {
    console.error('Erro ao buscar cliente:', error);
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

    // 2. Obter ID do parâmetro
    const { id } = await params;
    const clienteId = parseInt(id, 10);

    if (isNaN(clienteId)) {
      return NextResponse.json(
        { error: 'ID inválido' },
        { status: 400 }
      );
    }

    // 3. Validar e parsear body da requisição
    const body = await request.json();
    const dadosAtualizacao = body as Partial<ClienteDados>;

    // 4. Atualizar cliente
    const resultado = await atualizarCliente(clienteId, dadosAtualizacao);

    if (!resultado.sucesso) {
      if (resultado.erro?.includes('não encontrado')) {
        return NextResponse.json(
          { error: resultado.erro },
          { status: 404 }
        );
      }
      return NextResponse.json(
        { error: resultado.erro || 'Erro ao atualizar cliente' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      data: resultado.cliente,
    });
  } catch (error) {
    console.error('Erro ao atualizar cliente:', error);
    const erroMsg = error instanceof Error ? error.message : 'Erro interno do servidor';
    return NextResponse.json(
      { error: erroMsg },
      { status: 500 }
    );
  }
}

