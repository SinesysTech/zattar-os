// Rota de API para buscar permissões do usuário logado
// GET: Retorna permissões do usuário autenticado, opcionalmente filtradas por recurso

import { NextRequest, NextResponse } from 'next/server';
import { requireAuthentication } from '@/backend/auth/require-permission';
import { listarPermissoesUsuario } from '@/backend/permissoes/services/persistence/permissao-persistence.service';
import type { Permissao } from '@/backend/types/permissoes/types';
import { obterUsuarioPorId } from '@/backend/usuarios/services/usuarios/buscar-usuario.service';

/**
 * @swagger
 * /api/permissoes/minhas:
 *   get:
 *     summary: Busca permissões do usuário logado
 *     description: Retorna as permissões do usuário autenticado, opcionalmente filtradas por recurso
 *     tags:
 *       - Permissões
 *     security:
 *       - bearerAuth: []
 *       - sessionAuth: []
 *     parameters:
 *       - in: query
 *         name: recurso
 *         schema:
 *           type: string
 *         description: Filtrar por recurso específico (ex: assistentes)
 *     responses:
 *       200:
 *         description: Permissões retornadas com sucesso
 *       401:
 *         description: Não autenticado
 *       500:
 *         description: Erro interno do servidor
 */
export async function GET(request: NextRequest) {
  try {
    // 1. Verificar autenticação
    const authOrError = await requireAuthentication(request);
    if (authOrError instanceof NextResponse) {
      return authOrError;
    }

    const { usuarioId } = authOrError;

    // 2. Buscar informações do usuário (inclui isSuperAdmin)
    const usuario = await obterUsuarioPorId(usuarioId);
    if (!usuario) {
      return NextResponse.json(
        { success: false, error: 'Usuário não encontrado' },
        { status: 404 }
      );
    }

    // 3. Buscar permissões do usuário
    const permissoes = await listarPermissoesUsuario(usuarioId);

    // 4. Filtrar por recurso se especificado
    const { searchParams } = new URL(request.url);
    const recurso = searchParams.get('recurso');

    let permissoesFiltradas = permissoes;
    if (recurso) {
      permissoesFiltradas = permissoes.filter((p: Permissao) => p.recurso === (recurso as any));
    }

    // 5. Se for super admin, todas as operações são permitidas
    // Retornar flag isSuperAdmin para o frontend tratar isso
    return NextResponse.json({
      success: true,
      data: {
        usuarioId,
        isSuperAdmin: usuario.isSuperAdmin,
        permissoes: permissoesFiltradas.map((p: Permissao) => ({
          recurso: p.recurso,
          operacao: p.operacao,
          permitido: p.permitido,
        })),
      },
    });
  } catch (error) {
    console.error('Erro ao buscar permissões:', error);
    const erroMsg = error instanceof Error ? error.message : 'Erro interno do servidor';
    return NextResponse.json(
      { success: false, error: erroMsg },
      { status: 500 }
    );
  }
}
