/**
 * API Route para compartilhamento de documentos
 *
 * POST /api/documentos/[id]/compartilhar - Compartilha documento com usuário
 * GET /api/documentos/[id]/compartilhar - Lista compartilhamentos
 * DELETE /api/documentos/[id]/compartilhar - Remove compartilhamento
 */

import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/backend/utils/auth/api-auth';
import { verificarAcessoDocumento } from '@/backend/documentos/services/persistence/documentos-persistence.service';
import {
  compartilharDocumento,
  listarCompartilhamentos,
  removerCompartilhamento,
  compartilharDocumentoComMultiplosUsuarios,
} from '@/backend/documentos/services/persistence/compartilhamento-persistence.service';
import type { CompartilharDocumentoParams } from '@/backend/types/documentos/types';

/**
 * GET /api/documentos/[id]/compartilhar
 * Lista compartilhamentos do documento
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = await authenticateRequest(request);
    if (!authResult.authenticated || !authResult.usuario) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const documento_id = parseInt(params.id);
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
        { success: false, error: 'Apenas o proprietário pode ver compartilhamentos' },
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
 * POST /api/documentos/[id]/compartilhar
 * Compartilha documento com um ou mais usuários
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = await authenticateRequest(request);
    if (!authResult.authenticated || !authResult.usuario) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const documento_id = parseInt(params.id);
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
        { success: false, error: 'Apenas o proprietário pode compartilhar' },
        { status: 403 }
      );
    }

    const body = await request.json();

    // Validação
    if (!body.permissao || !['visualizar', 'editar'].includes(body.permissao)) {
      return NextResponse.json(
        { success: false, error: 'Permissão inválida (visualizar ou editar)' },
        { status: 400 }
      );
    }

    // Compartilhar com múltiplos usuários ou um único
    if (Array.isArray(body.usuario_ids)) {
      if (body.usuario_ids.length === 0) {
        return NextResponse.json(
          { success: false, error: 'Lista de usuários vazia' },
          { status: 400 }
        );
      }

      const compartilhamentos = await compartilharDocumentoComMultiplosUsuarios(
        documento_id,
        body.usuario_ids,
        body.permissao,
        authResult.usuario.id
      );

      return NextResponse.json({
        success: true,
        data: compartilhamentos,
        message: `Documento compartilhado com ${compartilhamentos.length} usuário(s)`,
      });
    } else if (body.usuario_id) {
      const params: CompartilharDocumentoParams = {
        documento_id,
        usuario_id: body.usuario_id,
        permissao: body.permissao,
      };

      const compartilhamento = await compartilharDocumento(
        params,
        authResult.usuario.id
      );

      return NextResponse.json(
        {
          success: true,
          data: compartilhamento,
          message: 'Documento compartilhado com sucesso',
        },
        { status: 201 }
      );
    } else {
      return NextResponse.json(
        { success: false, error: 'usuario_id ou usuario_ids é obrigatório' },
        { status: 400 }
      );
    }
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

/**
 * DELETE /api/documentos/[id]/compartilhar
 * Remove compartilhamento de um usuário
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = await authenticateRequest(request);
    if (!authResult.authenticated || !authResult.usuario) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const documento_id = parseInt(params.id);
    if (isNaN(documento_id)) {
      return NextResponse.json(
        { success: false, error: 'ID inválido' },
        { status: 400 }
      );
    }

    const { searchParams } = new URL(request.url);
    const usuario_id = searchParams.get('usuario_id');

    if (!usuario_id) {
      return NextResponse.json(
        { success: false, error: 'usuario_id é obrigatório' },
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
        { success: false, error: 'Apenas o proprietário pode remover compartilhamentos' },
        { status: 403 }
      );
    }

    await removerCompartilhamento(documento_id, parseInt(usuario_id));

    return NextResponse.json({
      success: true,
      message: 'Compartilhamento removido com sucesso',
    });
  } catch (error) {
    console.error('Erro ao remover compartilhamento:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Erro interno',
      },
      { status: 500 }
    );
  }
}
