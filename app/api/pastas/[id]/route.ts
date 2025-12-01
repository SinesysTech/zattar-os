/**
 * API Routes para pasta específica
 *
 * GET /api/pastas/[id] - Busca pasta
 * PUT /api/pastas/[id] - Atualiza pasta
 * DELETE /api/pastas/[id] - Soft delete pasta
 */

import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/backend/auth/api-auth';
import {
  buscarPastaPorId,
  atualizarPasta,
  deletarPasta,
  verificarAcessoPasta,
} from '@/backend/documentos/services/persistence/pastas-persistence.service';
import type { AtualizarPastaParams } from '@/backend/types/documentos/types';

/**
 * GET /api/pastas/[id]
 * Busca uma pasta específica
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
    const pasta_id = parseInt(id);
    if (isNaN(pasta_id)) {
      return NextResponse.json(
        { success: false, error: 'ID inválido' },
        { status: 400 }
      );
    }

    // Verificar acesso
    const temAcesso = await verificarAcessoPasta(pasta_id, authResult.usuario.id);

    if (!temAcesso) {
      return NextResponse.json(
        { success: false, error: 'Acesso negado' },
        { status: 403 }
      );
    }

    const pasta = await buscarPastaPorId(pasta_id);

    if (!pasta) {
      return NextResponse.json(
        { success: false, error: 'Pasta não encontrada' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: pasta,
    });
  } catch (error) {
    console.error('Erro ao buscar pasta:', error);
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
 * PUT /api/pastas/[id]
 * Atualiza uma pasta
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
    const pasta_id = parseInt(id);
    if (isNaN(pasta_id)) {
      return NextResponse.json(
        { success: false, error: 'ID inválido' },
        { status: 400 }
      );
    }

    // Verificar acesso
    const temAcesso = await verificarAcessoPasta(pasta_id, authResult.usuario.id);

    if (!temAcesso) {
      return NextResponse.json(
        { success: false, error: 'Acesso negado' },
        { status: 403 }
      );
    }

    const body: AtualizarPastaParams = await request.json();

    // Validação
    if (body.nome !== undefined && body.nome.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'Nome não pode ser vazio' },
        { status: 400 }
      );
    }

    if (body.nome && body.nome.length > 200) {
      return NextResponse.json(
        { success: false, error: 'Nome muito longo (máximo 200 caracteres)' },
        { status: 400 }
      );
    }

    const pasta = await atualizarPasta(pasta_id, body);

    return NextResponse.json({ success: true, data: pasta });
  } catch (error) {
    console.error('Erro ao atualizar pasta:', error);
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
 * DELETE /api/pastas/[id]
 * Soft delete de uma pasta
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
    const pasta_id = parseInt(id);
    if (isNaN(pasta_id)) {
      return NextResponse.json(
        { success: false, error: 'ID inválido' },
        { status: 400 }
      );
    }

    // Verificar acesso
    const temAcesso = await verificarAcessoPasta(pasta_id, authResult.usuario.id);

    if (!temAcesso) {
      return NextResponse.json(
        { success: false, error: 'Acesso negado' },
        { status: 403 }
      );
    }

    await deletarPasta(pasta_id);

    return NextResponse.json({
      success: true,
      message: 'Pasta movida para lixeira',
    });
  } catch (error) {
    console.error('Erro ao deletar pasta:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Erro interno',
      },
      { status: 500 }
    );
  }
}
