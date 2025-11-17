// Rota de API para atribuir responsável a processo do acervo
// PATCH: Atribuir/transferir/desatribuir responsável

import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/backend/utils/auth/api-auth';
import { atribuirResponsavelAcervo } from '@/backend/acervo/services/atribuir-responsavel.service';

/**
 * @swagger
 * /api/acervo/{id}/responsavel:
 *   patch:
 *     summary: Atribui responsável a um processo do acervo
 *     description: |
 *       Atribui, transfere ou desatribui um responsável de um processo do acervo.
 *       Todas as alterações são automaticamente registradas em logs_alteracao.
 *       
 *       **Tipos de operação:**
 *       - Atribuição: quando processo não tem responsável e um é atribuído
 *       - Transferência: quando processo tem responsável e é atribuído a outro
 *       - Desatribuição: quando responsavelId é null
 *     tags:
 *       - Acervo
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
 *         description: ID do processo no acervo
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AtribuirResponsavelRequest'
 *           example:
 *             responsavelId: 15
 *     responses:
 *       200:
 *         description: Responsável atribuído com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   description: Dados atualizados do processo
 *                   properties:
 *                     id:
 *                       type: integer
 *                     responsavel_id:
 *                       type: integer
 *                       nullable: true
 *       400:
 *         description: Dados inválidos
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               error: "Processo não encontrado"
 *       401:
 *         description: Não autenticado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Erro interno do servidor
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
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

    // 2. Obter ID do processo
    const { id } = await params;
    const processoId = parseInt(id, 10);

    if (isNaN(processoId)) {
      return NextResponse.json(
        { error: 'ID do processo inválido' },
        { status: 400 }
      );
    }

    // 3. Obter body da requisição
    const body = await request.json();
    const { responsavelId } = body;

    // Validar responsavelId (deve ser número positivo ou null/undefined)
    if (responsavelId !== null && responsavelId !== undefined) {
      if (typeof responsavelId !== 'number' || responsavelId <= 0 || !Number.isInteger(responsavelId)) {
        return NextResponse.json(
          { error: 'responsavelId deve ser um número inteiro positivo ou null' },
          { status: 400 }
        );
      }
    }

    // 4. Obter ID do usuário que está executando a ação
    // Se for sistema (service key), usar ID padrão 10 (Super Administrador)
    // Se for usuário autenticado, usar o usuarioId retornado pela autenticação
    const usuarioExecutouId = authResult.userId === 'system' 
      ? 10 // ID do Super Administrador para operações do sistema
      : authResult.usuarioId!; // usuarioId sempre existe para usuários autenticados

    // 5. Executar atribuição
    const resultado = await atribuirResponsavelAcervo({
      processoId,
      responsavelId: responsavelId ?? null,
      usuarioExecutouId,
    });

    if (!resultado.success) {
      const statusCode = resultado.error?.includes('não encontrado') ? 404 : 400;
      return NextResponse.json(
        { error: resultado.error || 'Erro ao atribuir responsável' },
        { status: statusCode }
      );
    }

    // 6. Retornar resultado
    return NextResponse.json({
      success: true,
      data: resultado.data,
    });

  } catch (error) {
    console.error('Error in atribuir responsavel acervo:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

