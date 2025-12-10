/**
 * API Routes para compartilhamentos de documento
 *
 * GET /api/documentos/[id]/compartilhamentos - Lista compartilhamentos
 * POST /api/documentos/[id]/compartilhamentos - Cria compartilhamento
 */

import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/backend/auth/api-auth';
import {
  listarCompartilhamentos,
  compartilharDocumento,
} from '@/backend/documentos/services/persistence/compartilhamento-persistence.service';
import { verificarAcessoDocumento } from '@/backend/documentos/services/persistence/documentos-persistence.service';

/**
 * GET /api/documentos/[id]/compartilhamentos
 * Lista compartilhamentos de um documento
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

    // Verificar se tem acesso ao documento
    const { temAcesso } = await verificarAcessoDocumento(
      documento_id,
      authResult.usuario.id
    );

    if (!temAcesso) {
      return NextResponse.json(
        { success: false, error: 'Acesso negado' },
        { status: 403 }
      );
    }

    const compartilhamentos = await listarCompartilhamentos({ documento_id });

    return NextResponse.json({
      success: true,
      data: compartilhamentos,
    });
  } catch (error) {
    console.error('Erro ao listar compartilhamentos:', error);
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
 * POST /api/documentos/[id]/compartilhamentos
 * Compartilha documento com um usuário
 */
export async function POST(
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

    // Verificar se é proprietário ou tem permissão de editar
    const { temAcesso, permissao } = await verificarAcessoDocumento(
      documento_id,
      authResult.usuario.id
    );

    if (!temAcesso || permissao === 'visualizar') {
      return NextResponse.json(
        { success: false, error: 'Sem permissão para compartilhar' },
        { status: 403 }
      );
    }

    const body = await request.json();

    // Validação
    if (!body.usuario_id || typeof body.usuario_id !== 'number') {
      return NextResponse.json(
        { success: false, error: 'ID do usuário é obrigatório' },
        { status: 400 }
      );
    }

    if (!body.permissao || !['visualizar', 'editar'].includes(body.permissao)) {
      return NextResponse.json(
        { success: false, error: 'Permissão inválida' },
        { status: 400 }
      );
    }

    // Não permitir compartilhar consigo mesmo
    if (body.usuario_id === authResult.usuario.id) {
      return NextResponse.json(
        { success: false, error: 'Não é possível compartilhar consigo mesmo' },
        { status: 400 }
      );
    }

    const compartilhamento = await compartilharDocumento(
      {
        documento_id,
        usuario_id: body.usuario_id,
        permissao: body.permissao,
        pode_deletar: body.pode_deletar === true,
      },
      authResult.usuario.id
    );

    return NextResponse.json(
      { success: true, data: compartilhamento },
      { status: 201 }
    );
  } catch (error) {
    console.error('Erro ao compartilhar documento:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Erro interno',
      },
      { status: 500 }
    );
  }
}
