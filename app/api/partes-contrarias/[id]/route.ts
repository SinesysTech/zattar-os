// Rota de API para operações em parte contrária específica
// GET: Buscar parte contrária por ID | PATCH: Atualizar parte contrária

import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/backend/utils/auth/api-auth';
import { obterParteContrariaPorId } from '@/backend/partes-contrarias/services/partes-contrarias/buscar-parte-contraria.service';
import { atualizarParteContraria } from '@/backend/partes-contrarias/services/partes-contrarias/atualizar-parte-contraria.service';
import type { AtualizarParteContrariaParams } from '@/backend/types/partes';

/**
 * @swagger
 * /api/partes-contrarias/{id}:
 *   get:
 *     summary: Busca uma parte contrária por ID
 *     description: Retorna os dados completos de uma parte contrária específica
 *     tags:
 *       - Partes Contrárias
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
 *         description: ID da parte contrária
 *     responses:
 *       200:
 *         description: Parte contrária encontrada
 *       404:
 *         description: Parte contrária não encontrada
 *       401:
 *         description: Não autenticado
 *       500:
 *         description: Erro interno do servidor
 *   patch:
 *     summary: Atualiza uma parte contrária parcialmente
 *     description: Atualiza campos específicos de uma parte contrária existente
 *     tags:
 *       - Partes Contrárias
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
 *         description: ID da parte contrária
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
 *         description: Parte contrária atualizada com sucesso
 *       400:
 *         description: Dados inválidos ou duplicados
 *       404:
 *         description: Parte contrária não encontrada
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
    const authResult = await authenticateRequest(request);
    if (!authResult.authenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const parteId = parseInt(id, 10);

    if (isNaN(parteId)) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
    }

    const parteContraria = await obterParteContrariaPorId(parteId);

    if (!parteContraria) {
      return NextResponse.json({ error: 'Parte contrária não encontrada' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: parteContraria,
    });
  } catch (error) {
    console.error('Erro ao buscar parte contrária:', error);
    const erroMsg = error instanceof Error ? error.message : 'Erro interno do servidor';
    return NextResponse.json({ error: erroMsg }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await authenticateRequest(request);
    if (!authResult.authenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const parteId = parseInt(id, 10);

    if (isNaN(parteId)) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
    }

    const body = await request.json();
    const dadosAtualizacao: AtualizarParteContrariaParams = {
      id: parteId,
      ...body,
    };

    const resultado = await atualizarParteContraria(dadosAtualizacao);

    if (!resultado.sucesso) {
      if (resultado.erro?.includes('não encontrada')) {
        return NextResponse.json({ error: resultado.erro }, { status: 404 });
      }
      return NextResponse.json(
        { error: resultado.erro || 'Erro ao atualizar parte contrária' },
        { status: 400 },
      );
    }

    return NextResponse.json({
      success: true,
      data: resultado.parteContraria,
    });
  } catch (error) {
    console.error('Erro ao atualizar parte contrária:', error);
    const erroMsg = error instanceof Error ? error.message : 'Erro interno do servidor';
    return NextResponse.json({ error: erroMsg }, { status: 500 });
  }
}

