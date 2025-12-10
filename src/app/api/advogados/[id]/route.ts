// Rota de API para buscar e atualizar advogado por ID
// GET: Buscar advogado | PATCH: Atualizar advogado

import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/backend/auth/api-auth';
import { buscarAdvogado } from '@/backend/advogados/services/advogados/buscar-advogado.service';
import { atualizarAdvogado } from '@/backend/advogados/services/advogados/atualizar-advogado.service';
import type { AtualizarAdvogadoParams } from '@/backend/types/advogados/types';

/**
 * @swagger
 * /api/advogados/{id}:
 *   get:
 *     summary: Busca um advogado por ID
 *     description: Retorna os dados completos de um advogado específico
 *     tags:
 *       - Advogados
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
 *         description: ID do advogado
 *     responses:
 *       200:
 *         description: Advogado encontrado
 *       404:
 *         description: Advogado não encontrado
 *       401:
 *         description: Não autenticado
 *       500:
 *         description: Erro interno do servidor
 *   patch:
 *     summary: Atualiza um advogado parcialmente
 *     description: Atualiza campos específicos de um advogado existente
 *     tags:
 *       - Advogados
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
 *         description: ID do advogado
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nome_completo:
 *                 type: string
 *               cpf:
 *                 type: string
 *               oab:
 *                 type: string
 *               uf_oab:
 *                 type: string
 *     responses:
 *       200:
 *         description: Advogado atualizado com sucesso
 *       400:
 *         description: Dados inválidos ou duplicados
 *       404:
 *         description: Advogado não encontrado
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
    const advogadoId = parseInt(id, 10);

    if (isNaN(advogadoId)) {
      return NextResponse.json(
        { error: 'ID inválido' },
        { status: 400 }
      );
    }

    // 3. Buscar advogado
    const advogado = await buscarAdvogado(advogadoId);

    if (!advogado) {
      return NextResponse.json(
        { error: 'Advogado não encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: advogado,
    });
  } catch (error) {
    console.error('Erro ao buscar advogado:', error);
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
    const advogadoId = parseInt(id, 10);

    if (isNaN(advogadoId)) {
      return NextResponse.json(
        { error: 'ID inválido' },
        { status: 400 }
      );
    }

    // 3. Obter e validar body
    const body = await request.json();
    const paramsUpdate: AtualizarAdvogadoParams = {};
    
    if (body.nome_completo !== undefined) paramsUpdate.nome_completo = body.nome_completo;
    if (body.cpf !== undefined) paramsUpdate.cpf = body.cpf;
    if (body.oab !== undefined) paramsUpdate.oab = body.oab;
    if (body.uf_oab !== undefined) paramsUpdate.uf_oab = body.uf_oab;

    // 4. Atualizar advogado
    const advogado = await atualizarAdvogado(advogadoId, paramsUpdate);

    return NextResponse.json({
      success: true,
      data: advogado,
    });
  } catch (error) {
    console.error('Erro ao atualizar advogado:', error);
    const erroMsg = error instanceof Error ? error.message : 'Erro interno do servidor';
    
    // Verificar tipo de erro
    if (erroMsg.includes('não encontrado')) {
      return NextResponse.json(
        { error: erroMsg },
        { status: 404 }
      );
    }
    
    if (erroMsg.includes('já cadastrado') || erroMsg.includes('obrigatório') || erroMsg.includes('inválido')) {
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

