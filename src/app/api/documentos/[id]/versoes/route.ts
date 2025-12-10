/**
 * API Routes para versões de documento
 *
 * GET /api/documentos/[id]/versoes - Lista versões do documento
 * POST /api/documentos/[id]/versoes - Cria versão manualmente
 */

import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/backend/auth/api-auth';
import {
  listarVersoes,
  criarVersao,
} from '@/backend/documentos/services/persistence/versoes-persistence.service';
import {
  verificarAcessoDocumento,
  buscarDocumentoPorId,
  incrementarVersaoDocumento,
} from '@/backend/documentos/services/persistence/documentos-persistence.service';

/**
 * GET /api/documentos/[id]/versoes
 * Lista versões de um documento
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

    // Verificar acesso ao documento
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

    const { searchParams } = new URL(request.url);
    const limit = searchParams.get('limit')
      ? parseInt(searchParams.get('limit')!)
      : 50;
    const offset = searchParams.get('offset')
      ? parseInt(searchParams.get('offset')!)
      : 0;

    const { versoes, total } = await listarVersoes({
      documento_id,
      limit,
      offset,
    });

    return NextResponse.json({
      success: true,
      data: versoes,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + versoes.length < total,
      },
    });
  } catch (error) {
    console.error('Erro ao listar versões:', error);
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
 * POST /api/documentos/[id]/versoes
 * Cria uma nova versão manualmente (snapshot)
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

    // Verificar se tem permissão de edição
    const { temAcesso, permissao } = await verificarAcessoDocumento(
      documento_id,
      authResult.usuario.id
    );

    if (!temAcesso || permissao === 'visualizar') {
      return NextResponse.json(
        { success: false, error: 'Sem permissão para criar versão' },
        { status: 403 }
      );
    }

    // Buscar documento atual
    const documento = await buscarDocumentoPorId(documento_id);
    if (!documento) {
      return NextResponse.json(
        { success: false, error: 'Documento não encontrado' },
        { status: 404 }
      );
    }

    // Incrementar versão
    await incrementarVersaoDocumento(documento_id);

    // Criar versão
    const versao = await criarVersao(
      {
        documento_id,
        versao: documento.versao + 1,
        conteudo: documento.conteudo,
        titulo: documento.titulo,
      },
      authResult.usuario.id
    );

    return NextResponse.json(
      { success: true, data: versao },
      { status: 201 }
    );
  } catch (error) {
    console.error('Erro ao criar versão:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Erro interno',
      },
      { status: 500 }
    );
  }
}
