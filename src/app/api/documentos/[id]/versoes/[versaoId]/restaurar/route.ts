/**
 * API Route para restaurar versão de documento
 *
 * POST /api/documentos/[id]/versoes/[versaoId]/restaurar - Restaura versão
 */

import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/backend/auth/api-auth';
import { restaurarVersao, buscarVersaoPorId } from '@/backend/documentos/services/persistence/versoes-persistence.service';
import { verificarAcessoDocumento } from '@/backend/documentos/services/persistence/documentos-persistence.service';

/**
 * POST /api/documentos/[id]/versoes/[versaoId]/restaurar
 * Restaura uma versão anterior do documento
 */
export async function POST(
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

    // Verificar se tem permissão de edição
    const { temAcesso, permissao } = await verificarAcessoDocumento(
      documento_id,
      authResult.usuario.id
    );

    if (!temAcesso || permissao === 'visualizar') {
      return NextResponse.json(
        { success: false, error: 'Sem permissão para restaurar versão' },
        { status: 403 }
      );
    }

    // Buscar versão por ID
    const versao = await buscarVersaoPorId(versao_id);
    if (!versao || versao.documento_id !== documento_id) {
      return NextResponse.json(
        { success: false, error: 'Versão não encontrada' },
        { status: 404 }
      );
    }

    // Restaurar versão
    const resultado = await restaurarVersao(
      documento_id,
      versao.versao,
      authResult.usuario.id
    );

    return NextResponse.json({
      success: true,
      data: resultado,
      message: 'Versão restaurada com sucesso',
    });
  } catch (error) {
    console.error('Erro ao restaurar versão:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Erro interno',
      },
      { status: 500 }
    );
  }
}
