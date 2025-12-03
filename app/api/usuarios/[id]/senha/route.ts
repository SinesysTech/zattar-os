import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/backend/auth/require-permission';
import { createServiceClient } from '@/backend/utils/supabase/service-client';
import { obterUsuarioPorId } from '@/backend/usuarios/services/usuarios/buscar-usuario.service';

/**
 * @swagger
 * /api/usuarios/{id}/senha:
 *   patch:
 *     summary: Redefinir senha de um usuário (admin)
 *     description: Permite que um administrador com permissão usuarios.editar redefina a senha de qualquer usuário
 *     tags:
 *       - Usuários
 *     security:
 *       - bearerAuth: []
 *       - sessionAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID do usuário na tabela usuarios
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - novaSenha
 *             properties:
 *               novaSenha:
 *                 type: string
 *                 minLength: 8
 *                 maxLength: 72
 *                 description: Nova senha do usuário
 *     responses:
 *       200:
 *         description: Senha redefinida com sucesso
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
 *         description: Senha inválida, usuário sem auth_user_id, ou erro na redefinição
 *       401:
 *         description: Não autenticado
 *       403:
 *         description: Sem permissão usuarios.editar
 *       404:
 *         description: Usuário não encontrado
 *       500:
 *         description: Erro interno do servidor
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 1. Verificar permissão: usuarios.editar
    const authOrError = await requirePermission(request, 'usuarios', 'editar');
    if (authOrError instanceof NextResponse) {
      return authOrError;
    }

    // 2. Obter ID do usuário alvo
    const { id } = await params;
    const usuarioId = parseInt(id, 10);

    if (isNaN(usuarioId)) {
      return NextResponse.json(
        { error: 'ID inválido' },
        { status: 400 }
      );
    }

    // 3. Buscar usuário e seu auth_user_id
    const usuario = await obterUsuarioPorId(usuarioId);

    if (!usuario) {
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 404 }
      );
    }

    if (!usuario.authUserId) {
      return NextResponse.json(
        { error: 'Usuário não possui conta de autenticação vinculada' },
        { status: 400 }
      );
    }

    // 4. Validar body
    const body = await request.json();
    const { novaSenha } = body;

    if (!novaSenha || typeof novaSenha !== 'string') {
      return NextResponse.json(
        { error: 'Nova senha é obrigatória' },
        { status: 400 }
      );
    }

    // Validar comprimento
    if (novaSenha.length < 8) {
      return NextResponse.json(
        { error: 'Senha deve ter no mínimo 8 caracteres' },
        { status: 400 }
      );
    }

    if (novaSenha.length > 72) {
      return NextResponse.json(
        { error: 'Senha deve ter no máximo 72 caracteres' },
        { status: 400 }
      );
    }

    // 5. Atualizar senha usando Admin API
    const supabase = createServiceClient();
    const { error } = await supabase.auth.admin.updateUserById(
      usuario.authUserId,
      { password: novaSenha }
    );

    if (error) {
      console.error('Erro ao redefinir senha:', error);
      return NextResponse.json(
        { error: error.message || 'Erro ao redefinir senha' },
        { status: 400 }
      );
    }

    // 6. Log de auditoria
    console.log(
      `[AUDITORIA] Senha redefinida - Admin: ${authOrError.usuarioId}, Usuário alvo: ${usuarioId} (${usuario.nomeExibicao}), IP: ${request.headers.get('x-forwarded-for') || 'unknown'}`
    );

    return NextResponse.json({
      success: true,
      message: 'Senha redefinida com sucesso',
    });
  } catch (error) {
    console.error('Erro ao processar redefinição de senha:', error);
    const erroMsg = error instanceof Error ? error.message : 'Erro interno do servidor';
    return NextResponse.json(
      { error: erroMsg },
      { status: 500 }
    );
  }
}
