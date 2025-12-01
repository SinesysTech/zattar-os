/**
 * API Routes para template específico
 *
 * GET /api/templates/[id] - Busca template
 * PUT /api/templates/[id] - Atualiza template
 * DELETE /api/templates/[id] - Deleta template
 */

import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/backend/auth/api-auth';
import {
  buscarTemplateComUsuario,
  atualizarTemplate,
  deletarTemplate,
  verificarPermissaoTemplate,
} from '@/backend/documentos/services/persistence/templates-persistence.service';
import type { AtualizarTemplateParams } from '@/backend/types/documentos/types';

/**
 * GET /api/templates/[id]
 * Busca um template específico
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await authenticateRequest(request);
    if (!authResult.authenticated || !authResult.usuario) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const template_id = parseInt(id);
    if (isNaN(template_id)) {
      return NextResponse.json(
        { success: false, error: 'ID inválido' },
        { status: 400 }
      );
    }

    const template = await buscarTemplateComUsuario(template_id);

    if (!template) {
      return NextResponse.json(
        { success: false, error: 'Template não encontrado' },
        { status: 404 }
      );
    }

    // Verificar se tem acesso (público ou próprio)
    if (
      template.visibilidade === 'privado' &&
      template.criado_por !== authResult.usuario.id
    ) {
      return NextResponse.json(
        { success: false, error: 'Acesso negado' },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      data: template,
    });
  } catch (error) {
    console.error('Erro ao buscar template:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Erro interno',
      },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/templates/[id]
 * Atualiza um template
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await authenticateRequest(request);
    if (!authResult.authenticated || !authResult.usuario) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const template_id = parseInt(id);
    if (isNaN(template_id)) {
      return NextResponse.json(
        { success: false, error: 'ID inválido' },
        { status: 400 }
      );
    }

    // Verificar permissão
    const temPermissao = await verificarPermissaoTemplate(
      template_id,
      authResult.usuario.id
    );

    if (!temPermissao) {
      return NextResponse.json(
        { success: false, error: 'Apenas o criador pode editar' },
        { status: 403 }
      );
    }

    const body: AtualizarTemplateParams = await request.json();

    // Validação
    if (body.titulo !== undefined && body.titulo.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'Título não pode ser vazio' },
        { status: 400 }
      );
    }

    if (body.titulo && body.titulo.length > 200) {
      return NextResponse.json(
        { success: false, error: 'Título muito longo (máximo 200 caracteres)' },
        { status: 400 }
      );
    }

    if (
      body.visibilidade &&
      !['publico', 'privado'].includes(body.visibilidade)
    ) {
      return NextResponse.json(
        { success: false, error: 'Visibilidade inválida (publico ou privado)' },
        { status: 400 }
      );
    }

    const template = await atualizarTemplate(template_id, body);

    return NextResponse.json({ success: true, data: template });
  } catch (error) {
    console.error('Erro ao atualizar template:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Erro interno',
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/templates/[id]
 * Deleta um template permanentemente
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await authenticateRequest(request);
    if (!authResult.authenticated || !authResult.usuario) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const template_id = parseInt(id);
    if (isNaN(template_id)) {
      return NextResponse.json(
        { success: false, error: 'ID inválido' },
        { status: 400 }
      );
    }

    // Verificar permissão
    const temPermissao = await verificarPermissaoTemplate(
      template_id,
      authResult.usuario.id
    );

    if (!temPermissao) {
      return NextResponse.json(
        { success: false, error: 'Apenas o criador pode deletar' },
        { status: 403 }
      );
    }

    await deletarTemplate(template_id);

    return NextResponse.json({
      success: true,
      message: 'Template deletado com sucesso',
    });
  } catch (error) {
    console.error('Erro ao deletar template:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Erro interno',
      },
      { status: 500 }
    );
  }
}
