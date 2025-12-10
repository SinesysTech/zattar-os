/**
 * @swagger
 * /api/permissoes/usuarios/{id}:
 *   get:
 *     summary: Lista permissões de um usuário
 *     description: Retorna todas as permissões atribuídas a um usuário específico
 *     tags:
 *       - Permissões
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
 *         description: Permissões retornadas com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     usuario_id:
 *                       type: integer
 *                     is_super_admin:
 *                       type: boolean
 *                     permissoes:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           recurso:
 *                             type: string
 *                           operacao:
 *                             type: string
 *                           permitido:
 *                             type: boolean
 *       401:
 *         description: Não autenticado
 *       403:
 *         description: Sem permissão
 *       404:
 *         description: Usuário não encontrado
 *   post:
 *     summary: Atribui permissões em lote
 *     description: Adiciona múltiplas permissões a um usuário de uma só vez
 *     tags:
 *       - Permissões
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
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - permissoes
 *             properties:
 *               permissoes:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     recurso:
 *                       type: string
 *                     operacao:
 *                       type: string
 *                     permitido:
 *                       type: boolean
 *     responses:
 *       201:
 *         description: Permissões atribuídas com sucesso
 *       400:
 *         description: Dados inválidos
 *       401:
 *         description: Não autenticado
 *       403:
 *         description: Sem permissão
 *   put:
 *     summary: Substitui todas as permissões
 *     description: Remove todas as permissões existentes e atribui as novas permissões especificadas
 *     tags:
 *       - Permissões
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
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - permissoes
 *             properties:
 *               permissoes:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     recurso:
 *                       type: string
 *                     operacao:
 *                       type: string
 *                     permitido:
 *                       type: boolean
 *     responses:
 *       200:
 *         description: Permissões substituídas com sucesso
 *       400:
 *         description: Dados inválidos
 *       401:
 *         description: Não autenticado
 *       403:
 *         description: Sem permissão
 */

import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/backend/auth/require-permission';
import { createServiceClient } from '@/backend/utils/supabase/service-client';
import {
  listarPermissoesUsuario,
  atribuirPermissoesBatch,
  substituirPermissoes,
} from '@/backend/permissoes/services/persistence/permissao-persistence.service';
import {
  obterTodasPermissoes,
  validarAtribuirPermissoesDTO,
} from '@/backend/types/permissoes/types';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Verificar permissão: usuarios.visualizar
    const authOrError = await requirePermission(request, 'usuarios', 'visualizar');
    if (authOrError instanceof NextResponse) {
      return authOrError;
    }

    const { id } = await params;
    const usuarioId = parseInt(id, 10);

    // Buscar usuário para verificar se é super admin
    const supabase = createServiceClient();
    const { data: usuario, error } = await supabase
      .from('usuarios')
      .select('id, is_super_admin')
      .eq('id', usuarioId)
      .single();

    if (error || !usuario) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
    }

    // Se super admin, retornar todas as permissões
    if (usuario.is_super_admin) {
      const todasPermissoes = obterTodasPermissoes();
      return NextResponse.json(
        {
          success: true,
          data: {
            usuario_id: usuarioId,
            is_super_admin: true,
            permissoes: todasPermissoes.map((p) => ({
              recurso: p.recurso,
              operacao: p.operacao,
              permitido: true,
            })),
          },
        },
        { status: 200 }
      );
    }

    // Caso contrário, buscar permissões da tabela
    const permissoes = await listarPermissoesUsuario(usuarioId);

    return NextResponse.json(
      {
        success: true,
        data: {
          usuario_id: usuarioId,
          is_super_admin: false,
          permissoes: permissoes.map((p) => ({
            recurso: p.recurso,
            operacao: p.operacao,
            permitido: p.permitido,
          })),
        },
      },
      { status: 200 }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro interno';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Verificar permissão: usuarios.gerenciar_permissoes
    const authOrError = await requirePermission(request, 'usuarios', 'gerenciar_permissoes');
    if (authOrError instanceof NextResponse) {
      return authOrError;
    }
    const { usuarioId: executadoPor } = authOrError;

    const { id } = await params;
    const usuarioId = parseInt(id, 10);
    const body = await request.json();

    if (!validarAtribuirPermissoesDTO(body)) {
      return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 });
    }

    const permissoes = await atribuirPermissoesBatch(usuarioId, body.permissoes, executadoPor);

    return NextResponse.json({ success: true, data: permissoes }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro interno';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Verificar permissão: usuarios.gerenciar_permissoes
    const authOrError = await requirePermission(request, 'usuarios', 'gerenciar_permissoes');
    if (authOrError instanceof NextResponse) {
      return authOrError;
    }
    const { usuarioId: executadoPor } = authOrError;

    const { id } = await params;
    const usuarioId = parseInt(id, 10);
    const body = await request.json();

    if (!validarAtribuirPermissoesDTO(body)) {
      return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 });
    }

    const permissoes = await substituirPermissoes(usuarioId, body.permissoes, executadoPor);

    return NextResponse.json({ success: true, data: permissoes }, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro interno';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
