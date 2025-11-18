// Rota de API para atualizar credencial por ID
// PATCH: Atualizar credencial

import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/backend/utils/auth/api-auth';
import { atualizarCredencial } from '@/backend/advogados/services/credenciais/atualizar-credencial.service';
import type { AtualizarCredencialParams } from '@/backend/types/credenciais/types';

/**
 * @swagger
 * /api/advogados/{id}/credenciais/{credentialId}:
 *   patch:
 *     summary: Atualiza uma credencial parcialmente
 *     description: Atualiza campos específicos de uma credencial existente
 *     tags:
 *       - Credenciais
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
 *       - in: path
 *         name: credentialId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID da credencial
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               tribunal:
 *                 type: string
 *                 example: "TRT3"
 *               grau:
 *                 type: string
 *                 enum: [primeiro_grau, segundo_grau]
 *               senha:
 *                 type: string
 *               active:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Credencial atualizada com sucesso
 *       400:
 *         description: Dados inválidos ou credencial duplicada
 *       404:
 *         description: Credencial não encontrada
 *       401:
 *         description: Não autenticado
 *       500:
 *         description: Erro interno do servidor
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; credentialId: string }> }
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

    // 2. Obter IDs dos parâmetros
    const { id, credentialId } = await params;
    const advogadoId = parseInt(id, 10);
    const credencialIdNum = parseInt(credentialId, 10);

    if (isNaN(advogadoId) || isNaN(credencialIdNum)) {
      return NextResponse.json(
        { error: 'ID inválido' },
        { status: 400 }
      );
    }

    // 3. Obter e validar body
    const body = await request.json();
    const paramsUpdate: AtualizarCredencialParams = {};
    
    if (body.tribunal !== undefined) paramsUpdate.tribunal = body.tribunal;
    if (body.grau !== undefined) paramsUpdate.grau = body.grau;
    if (body.senha !== undefined) paramsUpdate.senha = body.senha;
    if (body.active !== undefined) paramsUpdate.active = body.active;

    // 4. Atualizar credencial
    const credencial = await atualizarCredencial(credencialIdNum, paramsUpdate);

    return NextResponse.json({
      success: true,
      data: credencial,
    });
  } catch (error) {
    console.error('Erro ao atualizar credencial:', error);
    const erroMsg = error instanceof Error ? error.message : 'Erro interno do servidor';
    
    // Verificar tipo de erro
    if (erroMsg.includes('não encontrada')) {
      return NextResponse.json(
        { error: erroMsg },
        { status: 404 }
      );
    }
    
    if (erroMsg.includes('já existe') || erroMsg.includes('obrigatório') || erroMsg.includes('inválido')) {
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

