/**
 * API Routes para documentos
 *
 * GET /api/documentos - Lista documentos
 * POST /api/documentos - Cria novo documento
 */

import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/backend/utils/auth/api-auth';
import {
  listarDocumentos,
  criarDocumento,
} from '@/backend/documentos/services/persistence/documentos-persistence.service';
import type {
  CriarDocumentoParams,
  ListarDocumentosParams,
} from '@/backend/types/documentos/types';

/**
 * GET /api/documentos
 * Lista documentos com filtros
 */
export async function GET(request: NextRequest) {
  try {
    const authResult = await authenticateRequest(request);
    if (!authResult.authenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);

    const params: ListarDocumentosParams = {
      pasta_id: searchParams.get('pasta_id')
        ? searchParams.get('pasta_id') === 'null'
          ? null
          : parseInt(searchParams.get('pasta_id')!)
        : undefined,
      busca: searchParams.get('busca') ?? undefined,
      tags: searchParams.get('tags')?.split(',') ?? undefined,
      criado_por: searchParams.get('criado_por')
        ? parseInt(searchParams.get('criado_por')!)
        : undefined,
      incluir_deletados: searchParams.get('incluir_deletados') === 'true',
      limit: searchParams.get('limit')
        ? parseInt(searchParams.get('limit')!)
        : undefined,
      offset: searchParams.get('offset')
        ? parseInt(searchParams.get('offset')!)
        : undefined,
    };

    const { documentos, total } = await listarDocumentos(params);

    return NextResponse.json({
      success: true,
      data: documentos,
      pagination: {
        total,
        limit: params.limit ?? 50,
        offset: params.offset ?? 0,
        hasMore: (params.offset ?? 0) + documentos.length < total,
      },
    });
  } catch (error) {
    console.error('Erro ao listar documentos:', error);
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
 * POST /api/documentos
 * Cria um novo documento
 */
export async function POST(request: NextRequest) {
  try {
    const authResult = await authenticateRequest(request);
    if (!authResult.authenticated || !authResult.usuario) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body: CriarDocumentoParams = await request.json();

    // Validação básica
    if (!body.titulo || body.titulo.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'Título é obrigatório' },
        { status: 400 }
      );
    }

    if (body.titulo.length > 500) {
      return NextResponse.json(
        { success: false, error: 'Título muito longo (máximo 500 caracteres)' },
        { status: 400 }
      );
    }

    const documento = await criarDocumento(body, authResult.usuario.id);

    return NextResponse.json(
      { success: true, data: documento },
      { status: 201 }
    );
  } catch (error) {
    console.error('Erro ao criar documento:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Erro interno',
      },
      { status: 500 }
    );
  }
}
