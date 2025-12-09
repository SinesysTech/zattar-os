// API route para gerenciamento de avatar de usuários
// POST: Faz upload de novo avatar
// DELETE: Remove avatar existente

import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/backend/auth/api-auth';
import { uploadAvatar, getAvatarPublicUrl } from '@/backend/usuarios/services/avatar/upload-avatar.service';
import { removerAvatar } from '@/backend/usuarios/services/avatar/remover-avatar.service';
import { buscarUsuarioPorId } from '@/backend/usuarios/services/persistence/usuario-persistence.service';

/**
 * @swagger
 * /api/usuarios/{id}/avatar:
 *   post:
 *     summary: Faz upload de avatar para um usuário
 *     description: Permite que o próprio usuário ou um admin faça upload de foto de perfil
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
 *         description: ID do usuário
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: Arquivo de imagem (JPEG, PNG ou WebP, max 2MB)
 *     responses:
 *       200:
 *         description: Avatar atualizado com sucesso
 *       400:
 *         description: Arquivo inválido ou erro de validação
 *       401:
 *         description: Não autenticado
 *       403:
 *         description: Sem permissão para alterar avatar deste usuário
 *       404:
 *         description: Usuário não encontrado
 *       500:
 *         description: Erro interno do servidor
 */
export async function POST(
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

    // 2. Obter ID do usuário alvo
    const { id } = await params;
    const usuarioAlvoId = parseInt(id, 10);
    if (isNaN(usuarioAlvoId)) {
      return NextResponse.json(
        { error: 'ID de usuário inválido' },
        { status: 400 }
      );
    }

    // 3. Verificar permissão (próprio usuário OU admin)
    const usuarioLogado = await buscarUsuarioPorId(authResult.usuarioId!);
    if (!usuarioLogado) {
      return NextResponse.json(
        { error: 'Usuário logado não encontrado' },
        { status: 404 }
      );
    }

    const isProprio = usuarioLogado.id === usuarioAlvoId;
    const isAdmin = usuarioLogado.isSuperAdmin;

    if (!isProprio && !isAdmin) {
      return NextResponse.json(
        { error: 'Sem permissão para alterar avatar deste usuário' },
        { status: 403 }
      );
    }

    // 4. Obter arquivo do FormData
    const formData = await request.formData();
    const file = formData.get('file');

    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { error: 'Arquivo não encontrado no formulário' },
        { status: 400 }
      );
    }

    // 5. Converter File para Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 6. Fazer upload
    const resultado = await uploadAvatar({
      usuarioId: usuarioAlvoId,
      file: buffer,
      mimeType: file.type,
      fileName: file.name,
    });

    if (!resultado.sucesso) {
      return NextResponse.json(
        { error: resultado.erro },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        avatarUrl: resultado.avatarUrl,
      },
    });
  } catch (error) {
    console.error('Erro ao fazer upload do avatar:', error);
    const erroMsg = error instanceof Error ? error.message : 'Erro interno do servidor';
    return NextResponse.json(
      { error: erroMsg },
      { status: 500 }
    );
  }
}

/**
 * @swagger
 * /api/usuarios/{id}/avatar:
 *   delete:
 *     summary: Remove avatar de um usuário
 *     description: Permite que o próprio usuário ou um admin remova a foto de perfil
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
 *         description: ID do usuário
 *     responses:
 *       200:
 *         description: Avatar removido com sucesso
 *       401:
 *         description: Não autenticado
 *       403:
 *         description: Sem permissão para remover avatar deste usuário
 *       404:
 *         description: Usuário não encontrado
 *       500:
 *         description: Erro interno do servidor
 */
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

    // 2. Obter ID do usuário alvo
    const { id } = await params;
    const usuarioAlvoId = parseInt(id, 10);
    if (isNaN(usuarioAlvoId)) {
      return NextResponse.json(
        { error: 'ID de usuário inválido' },
        { status: 400 }
      );
    }

    // 3. Verificar permissão (próprio usuário OU admin)
    const usuarioLogado = await buscarUsuarioPorId(authResult.usuarioId!);
    if (!usuarioLogado) {
      return NextResponse.json(
        { error: 'Usuário logado não encontrado' },
        { status: 404 }
      );
    }

    const isProprio = usuarioLogado.id === usuarioAlvoId;
    const isAdmin = usuarioLogado.isSuperAdmin;

    if (!isProprio && !isAdmin) {
      return NextResponse.json(
        { error: 'Sem permissão para remover avatar deste usuário' },
        { status: 403 }
      );
    }

    // 4. Remover avatar
    const resultado = await removerAvatar(usuarioAlvoId);

    if (!resultado.sucesso) {
      return NextResponse.json(
        { error: resultado.erro },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Avatar removido com sucesso',
    });
  } catch (error) {
    console.error('Erro ao remover avatar:', error);
    const erroMsg = error instanceof Error ? error.message : 'Erro interno do servidor';
    return NextResponse.json(
      { error: erroMsg },
      { status: 500 }
    );
  }
}
