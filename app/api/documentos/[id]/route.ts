/**
 * API Routes para documento específico
 *
 * GET /api/documentos/[id] - Busca documento
 * PUT /api/documentos/[id] - Atualiza documento
 * PATCH /api/documentos/[id] - Atualiza parcialmente
 * DELETE /api/documentos/[id] - Soft delete documento
 */

import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/backend/auth/api-auth';
import {
  buscarDocumentoComUsuario,
  atualizarDocumento,
  deletarDocumento,
  verificarAcessoDocumento,
} from '@/backend/documentos/services/persistence/documentos-persistence.service';
import type { AtualizarDocumentoParams } from '@/backend/types/documentos/types';

/**
 * GET /api/documentos/[id]
 * Busca um documento específico
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
    const documento_id = parseInt(id);
    if (isNaN(documento_id)) {
      return NextResponse.json(
        { success: false, error: 'ID inválido' },
        { status: 400 }
      );
    }

    // Verificar acesso
    const { temAcesso, permissao } = await verificarAcessoDocumento(
      documento_id,
      authResult.usuario.id
    );

    if (!temAcesso) {
      return NextResponse.json(
        { success: false, error: 'Acesso negado' },
        { status: 403 }
      );
    }

    const documento = await buscarDocumentoComUsuario(documento_id);

    if (!documento) {
      return NextResponse.json(
        { success: false, error: 'Documento não encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        ...documento,
        permissao_usuario: permissao,
      },
    });
  } catch (error) {
    console.error('Erro ao buscar documento:', error);
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
 * PUT/PATCH /api/documentos/[id]
 * Atualiza um documento
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return await updateDocumento(request, params);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return await updateDocumento(request, params);
}

async function updateDocumento(
  request: NextRequest,
  params: Promise<{ id: string }>
) {
  try {
    const authResult = await authenticateRequest(request);
    if (!authResult.authenticated || !authResult.usuario) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const documento_id = parseInt(id);
    if (isNaN(documento_id)) {
      return NextResponse.json(
        { success: false, error: 'ID inválido' },
        { status: 400 }
      );
    }

    // Verificar permissão de edição
    const { temAcesso, permissao } = await verificarAcessoDocumento(
      documento_id,
      authResult.usuario.id
    );

    if (!temAcesso || (permissao !== 'proprietario' && permissao !== 'editar')) {
      return NextResponse.json(
        { success: false, error: 'Sem permissão para editar' },
        { status: 403 }
      );
    }

    const body: AtualizarDocumentoParams = await request.json();

    // Validação
    if (body.titulo !== undefined && body.titulo.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'Título não pode ser vazio' },
        { status: 400 }
      );
    }

    if (body.titulo && body.titulo.length > 500) {
      return NextResponse.json(
        { success: false, error: 'Título muito longo (máximo 500 caracteres)' },
        { status: 400 }
      );
    }

    const documento = await atualizarDocumento(
      documento_id,
      body,
      authResult.usuario.id
    );

    return NextResponse.json({ success: true, data: documento });
  } catch (error) {
    console.error('Erro ao atualizar documento:', error);
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
 * DELETE /api/documentos/[id]
 * Soft delete de um documento
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
    const documento_id = parseInt(id);
    if (isNaN(documento_id)) {
      return NextResponse.json(
        { success: false, error: 'ID inválido' },
        { status: 400 }
      );
    }

    // Verificar se é proprietário
    const { temAcesso, permissao } = await verificarAcessoDocumento(
      documento_id,
      authResult.usuario.id
    );

    if (!temAcesso || permissao !== 'proprietario') {
      return NextResponse.json(
        { success: false, error: 'Apenas o proprietário pode deletar' },
        { status: 403 }
      );
    }

    await deletarDocumento(documento_id);

    return NextResponse.json({
      success: true,
      message: 'Documento movido para lixeira',
    });
  } catch (error) {
    console.error('Erro ao deletar documento:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Erro interno',
      },
      { status: 500 }
    );
  }
}
