// Rota de API para operações em usuário específico
// GET: Buscar usuário por ID | PATCH: Atualizar usuário

import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/backend/auth/require-permission';
import { obterUsuarioPorId } from '@/backend/usuarios/services/usuarios/buscar-usuario.service';
import { atualizarUsuario } from '@/backend/usuarios/services/usuarios/atualizar-usuario.service';
import { desativarUsuarioComDesatribuicao } from '@/backend/usuarios/services/usuarios/desativar-usuario.service';
import type { UsuarioDados } from '@/backend/usuarios/services/persistence/usuario-persistence.service';

/**
 * @swagger
 * /api/usuarios/{id}:
 *   get:
 *     summary: Busca um usuário por ID
 *     description: Retorna os dados completos de um usuário específico
 *     tags:
 *       - Usuários
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
 *         description: ID do usuário
 *     responses:
 *       200:
 *         description: Usuário encontrado
 *       404:
 *         description: Usuário não encontrado
 *       401:
 *         description: Não autenticado
 *       500:
 *         description: Erro interno do servidor
 *   patch:
 *     summary: Atualiza um usuário parcialmente
 *     description: Atualiza campos específicos de um usuário existente
 *     tags:
 *       - Usuários
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
 *         description: ID do usuário
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nomeCompleto:
 *                 type: string
 *               nomeExibicao:
 *                 type: string
 *               cpf:
 *                 type: string
 *               rg:
 *                 type: string
 *               dataNascimento:
 *                 type: string
 *                 format: date
 *               genero:
 *                 type: string
 *                 enum: [masculino, feminino, outro, prefiro_nao_informar]
 *               oab:
 *                 type: string
 *               ufOab:
 *                 type: string
 *               emailPessoal:
 *                 type: string
 *               emailCorporativo:
 *                 type: string
 *               telefone:
 *                 type: string
 *               ramal:
 *                 type: string
 *               endereco:
 *                 type: object
 *               ativo:
 *                 type: boolean
 *               isSuperAdmin:
 *                 type: boolean
 *                 description: Indica se o usuário é super admin (apenas super admins podem alterar)
 *     responses:
 *       200:
 *         description: Usuário atualizado com sucesso
 *       400:
 *         description: Dados inválidos ou duplicados
 *       404:
 *         description: Usuário não encontrado
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
    // 1. Verificar permissão: usuarios.visualizar
    const authOrError = await requirePermission(request, 'usuarios', 'visualizar');
    if (authOrError instanceof NextResponse) {
      return authOrError;
    }

    // 2. Obter ID do parâmetro
    const { id } = await params;
    const usuarioId = parseInt(id, 10);

    if (isNaN(usuarioId)) {
      return NextResponse.json(
        { error: 'ID inválido' },
        { status: 400 }
      );
    }

    // 3. Buscar usuário
    const usuario = await obterUsuarioPorId(usuarioId);

    if (!usuario) {
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: usuario,
    });
  } catch (error) {
    console.error('Erro ao buscar usuário:', error);
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
    // 1. Verificar permissão: usuarios.editar
    const authOrError = await requirePermission(request, 'usuarios', 'editar');
    if (authOrError instanceof NextResponse) {
      return authOrError;
    }

    // 2. Obter ID do parâmetro
    const { id } = await params;
    const usuarioId = parseInt(id, 10);

    if (isNaN(usuarioId)) {
      return NextResponse.json(
        { error: 'ID inválido' },
        { status: 400 }
      );
    }

    // 3. Validar e parsear body da requisição
    const body = await request.json();
    const dadosAtualizacao = body as Partial<UsuarioDados>;

    // 4. Validações de segurança para Super Admin
    if ('isSuperAdmin' in dadosAtualizacao) {
      // 4.1. Buscar usuário logado para verificar se é super admin
      const usuarioLogado = await obterUsuarioPorId(authOrError.usuarioId!);

      if (!usuarioLogado?.isSuperAdmin) {
        return NextResponse.json(
          { error: 'Apenas Super Admins podem alterar o status de Super Admin' },
          { status: 403 }
        );
      }

      // 4.2. Impedir que usuário remova seu próprio status de super admin
      if (usuarioId === authOrError.usuarioId && dadosAtualizacao.isSuperAdmin === false) {
        return NextResponse.json(
          { error: 'Você não pode remover seu próprio status de Super Admin' },
          { status: 403 }
        );
      }

      console.log(`[API] Super Admin ${usuarioLogado.nomeExibicao} alterando status de super admin do usuário ${usuarioId}`);
    }

    // 5. Detectar desativação: ativo mudando de true para false
    if (dadosAtualizacao.ativo === false) {
      const usuarioAtual = await obterUsuarioPorId(usuarioId);

      if (!usuarioAtual) {
        return NextResponse.json(
          { error: 'Usuário não encontrado' },
          { status: 404 }
        );
      }

      // Se estava ativo e agora está sendo desativado
      if (usuarioAtual.ativo === true) {
        console.log(`[API] Detectado desativação do usuário ${usuarioId}`);

        // Usar service de desativação com desatribuição
        const resultadoDesativacao = await desativarUsuarioComDesatribuicao(
          usuarioId,
          authOrError.usuarioId!
        );

        if (!resultadoDesativacao.sucesso) {
          return NextResponse.json(
            { error: resultadoDesativacao.erro },
            { status: 500 }
          );
        }

        // Retornar usuário atualizado + contagens de desatribuição
        const usuarioAtualizado = await obterUsuarioPorId(usuarioId);

        return NextResponse.json({
          success: true,
          data: usuarioAtualizado,
          itensDesatribuidos: resultadoDesativacao.itensDesatribuidos,
        });
      }
    }

    // 6. Fluxo normal para outras atualizações (incluindo reativação)
    const resultado = await atualizarUsuario(usuarioId, dadosAtualizacao);

    if (!resultado.sucesso) {
      if (resultado.erro?.includes('não encontrado')) {
        return NextResponse.json(
          { error: resultado.erro },
          { status: 404 }
        );
      }
      return NextResponse.json(
        { error: resultado.erro || 'Erro ao atualizar usuário' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      data: resultado.usuario,
    });
  } catch (error) {
    console.error('Erro ao atualizar usuário:', error);
    const erroMsg = error instanceof Error ? error.message : 'Erro interno do servidor';
    return NextResponse.json(
      { error: erroMsg },
      { status: 500 }
    );
  }
}

