/**
 * API Routes: /api/permissoes/usuarios/[id]
 * GET - Listar permissões de um usuário
 * POST - Atribuir múltiplas permissões (batch)
 * PUT - Substituir todas as permissões
 */

import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/backend/utils/auth/require-permission';
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
  { params }: { params: { id: string } }
) {
  try {
    // Verificar permissão: usuarios.visualizar
    const authOrError = await requirePermission(request, 'usuarios', 'visualizar');
    if (authOrError instanceof NextResponse) {
      return authOrError;
    }

    const usuarioId = parseInt(params.id, 10);

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
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verificar permissão: usuarios.gerenciar_permissoes
    const authOrError = await requirePermission(request, 'usuarios', 'gerenciar_permissoes');
    if (authOrError instanceof NextResponse) {
      return authOrError;
    }
    const { usuarioId: executadoPor } = authOrError;

    const usuarioId = parseInt(params.id, 10);
    const body = await request.json();

    if (!validarAtribuirPermissoesDTO({ permissoes: body })) {
      return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 });
    }

    const permissoes = await atribuirPermissoesBatch(usuarioId, body, executadoPor);

    return NextResponse.json({ success: true, data: permissoes }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verificar permissão: usuarios.gerenciar_permissoes
    const authOrError = await requirePermission(request, 'usuarios', 'gerenciar_permissoes');
    if (authOrError instanceof NextResponse) {
      return authOrError;
    }
    const { usuarioId: executadoPor } = authOrError;

    const usuarioId = parseInt(params.id, 10);
    const body = await request.json();

    if (!validarAtribuirPermissoesDTO({ permissoes: body })) {
      return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 });
    }

    const permissoes = await substituirPermissoes(usuarioId, body, executadoPor);

    return NextResponse.json({ success: true, data: permissoes }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
