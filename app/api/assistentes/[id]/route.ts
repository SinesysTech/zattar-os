// Rota de API para operações em assistente específico
// GET: Buscar assistente por ID | PATCH: Atualizar assistente | DELETE: Deletar assistente

import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/backend/auth/require-permission';
import { buscarAssistentePorId } from '@/backend/assistentes/services/assistente-persistence.service';
import { atualizarAssistente } from '@/backend/assistentes/services/atualizar-assistente.service';
import { deletarAssistente } from '@/backend/assistentes/services/deletar-assistente.service';
import type { AtualizarAssistenteData } from '@/app/_lib/types/assistentes';

/**
 * @swagger
 * /api/assistentes/{id}:
 *   get:
 *     summary: Busca um assistente por ID
 *     description: Retorna os dados completos de um assistente específico
 *     tags:
 *       - Assistentes
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
 *         description: ID do assistente
 *     responses:
 *       200:
 *         description: Assistente encontrado
 *       403:
 *         description: Sem permissão (requer assistentes.visualizar)
 *       404:
 *         description: Assistente não encontrado
 *       401:
 *         description: Não autenticado
 *       500:
 *         description: Erro interno do servidor
 *   patch:
 *     summary: Atualiza um assistente parcialmente
 *     description: Atualiza campos específicos de um assistente existente
 *     tags:
 *       - Assistentes
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
 *         description: ID do assistente
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nome:
 *                 type: string
 *               descricao:
 *                 type: string
 *               iframe_code:
 *                 type: string
 *               ativo:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Assistente atualizado com sucesso
 *       400:
 *         description: Dados inválidos
 *       403:
 *         description: Acesso negado - apenas super admins
 *       404:
 *         description: Assistente não encontrado
 *       401:
 *         description: Não autenticado
 *       500:
 *         description: Erro interno do servidor
 *   delete:
 *     summary: Deleta um assistente
 *     description: Remove permanentemente um assistente do sistema
 *     tags:
 *       - Assistentes
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
 *         description: ID do assistente
 *     responses:
 *       200:
 *         description: Assistente deletado com sucesso
 *       403:
 *         description: Acesso negado - apenas super admins
 *       404:
 *         description: Assistente não encontrado
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
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // 2. Verificar se é super admin
    if (!(await isSuperAdmin())) {
      return NextResponse.json(
        { success: false, error: 'Acesso negado: apenas super admins podem acessar assistentes' },
        { status: 403 }
      );
    }

    // 3. Obter ID do parâmetro
    const { id } = await params;
    const assistenteId = parseInt(id, 10);

    if (isNaN(assistenteId)) {
      return NextResponse.json(
        { success: false, error: 'ID inválido' },
        { status: 400 }
      );
    }

    // 4. Buscar assistente
    const assistente = await buscarAssistentePorId(assistenteId);

    if (!assistente) {
      return NextResponse.json(
        { success: false, error: 'Assistente não encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: assistente,
    });
  } catch (error) {
    console.error('Erro ao buscar assistente:', error);
    const erroMsg = error instanceof Error ? error.message : 'Erro interno do servidor';
    return NextResponse.json(
      { success: false, error: erroMsg },
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
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // 2. Verificar se é super admin
    if (!(await isSuperAdmin())) {
      return NextResponse.json(
        { success: false, error: 'Acesso negado: apenas super admins podem editar assistentes' },
        { status: 403 }
      );
    }

    // 3. Obter ID do parâmetro
    const { id } = await params;
    const assistenteId = parseInt(id, 10);

    if (isNaN(assistenteId)) {
      return NextResponse.json(
        { success: false, error: 'ID inválido' },
        { status: 400 }
      );
    }

    // 4. Validar e parsear body da requisição
    const body = await request.json();
    const dadosAtualizacao = body as Partial<AtualizarAssistenteData>;

    // 5. Atualizar assistente
    const resultado = await atualizarAssistente(assistenteId, dadosAtualizacao);

    if (!resultado.sucesso) {
      if (resultado.erro?.includes('não encontrado')) {
        return NextResponse.json(
          { success: false, error: resultado.erro },
          { status: 404 }
        );
      }
      return NextResponse.json(
        { success: false, error: resultado.erro || 'Erro ao atualizar assistente' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      data: resultado.assistente,
    });
  } catch (error) {
    console.error('Erro ao atualizar assistente:', error);
    const erroMsg = error instanceof Error ? error.message : 'Erro interno do servidor';
    return NextResponse.json(
      { success: false, error: erroMsg },
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
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // 2. Verificar se é super admin
    if (!(await isSuperAdmin())) {
      return NextResponse.json(
        { success: false, error: 'Acesso negado: apenas super admins podem deletar assistentes' },
        { status: 403 }
      );
    }

    // 3. Obter ID do parâmetro
    const { id } = await params;
    const assistenteId = parseInt(id, 10);

    if (isNaN(assistenteId)) {
      return NextResponse.json(
        { success: false, error: 'ID inválido' },
        { status: 400 }
      );
    }

    // 4. Deletar assistente
    const resultado = await deletarAssistente(assistenteId);

    if (!resultado.sucesso) {
      return NextResponse.json(
        { success: false, error: resultado.erro || 'Assistente não encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error('Erro ao deletar assistente:', error);
    const erroMsg = error instanceof Error ? error.message : 'Erro interno do servidor';
    return NextResponse.json(
      { success: false, error: erroMsg },
      { status: 500 }
    );
  }
}