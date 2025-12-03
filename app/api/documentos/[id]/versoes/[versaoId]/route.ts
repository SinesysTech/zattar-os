/**
 * API Routes para versão específica de documento
 *
 * GET /api/documentos/[id]/versoes/[versaoId] - Busca versão
 * POST /api/documentos/[id]/versoes/[versaoId]/restaurar - Restaura versão
 */

import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/backend/auth/api-auth';
import {
  buscarVersaoPorId,
} from '@/backend/documentos/services/persistence/versoes-persistence.service';
import { verificarAcessoDocumento } from '@/backend/documentos/services/persistence/documentos-persistence.service';

/**
 * GET /api/documentos/[id]/versoes/[versaoId]
 * Busca uma versão específica
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; versaoId: string }> }
) {
  try {
    const authResult = await authenticateRequest(request);
    if (!authResult.authenticated || !authResult.usuario) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id, versaoId } = await params;
    const documento_id = parseInt(id);
    const versao_id = parseInt(versaoId);

    if (isNaN(documento_id) || isNaN(versao_id)) {
      return NextResponse.json(
        { success: false, error: 'IDs inválidos' },
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

    const versao = await buscarVersaoPorId(versao_id);

    if (!versao) {
      return NextResponse.json(
        { success: false, error: 'Versão não encontrada' },
        { status: 404 }
      );
    }

    // Verificar se a versão pertence ao documento
    if (versao.documento_id !== documento_id) {
      return NextResponse.json(
        { success: false, error: 'Versão não pertence ao documento' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      data: versao,
    });
  } catch (error) {
    console.error('Erro ao buscar versão:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Erro interno',
      },
      { status: 500 }
    );
  }
}
