import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/backend/auth/api-auth';
import { createClient } from '@/backend/utils/supabase/server';

/**
 * @swagger
 * /api/perfil/senha:
 *   patch:
 *     summary: Alterar senha do usuário logado
 *     description: Permite que o usuário autenticado altere sua própria senha
 *     tags:
 *       - Perfil
 *     security:
 *       - bearerAuth: []
 *       - sessionAuth: []
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
 *         description: Senha atualizada com sucesso
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
 *         description: Senha inválida ou erro na atualização
 *       401:
 *         description: Não autenticado
 *       500:
 *         description: Erro interno do servidor
 */
export async function PATCH(request: NextRequest) {
  try {
    // 1. Autenticar usuário
    const authResult = await authenticateRequest(request);
    if (!authResult.authenticated) {
      return NextResponse.json(
        { error: 'Não autenticado' },
        { status: 401 }
      );
    }

    // 2. Validar body
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

    // 3. Atualizar senha no Supabase Auth
    const supabase = await createClient();
    const { error } = await supabase.auth.updateUser({
      password: novaSenha,
    });

    if (error) {
      console.error('Erro ao atualizar senha:', error);
      return NextResponse.json(
        { error: error.message || 'Erro ao atualizar senha' },
        { status: 400 }
      );
    }

    // 4. Log de auditoria
    console.log(`Senha alterada com sucesso - Usuário: ${authResult.userId}`);

    return NextResponse.json({
      success: true,
      message: 'Senha atualizada com sucesso',
    });
  } catch (error) {
    console.error('Erro ao processar alteração de senha:', error);
    const erroMsg = error instanceof Error ? error.message : 'Erro interno do servidor';
    return NextResponse.json(
      { error: erroMsg },
      { status: 500 }
    );
  }
}
