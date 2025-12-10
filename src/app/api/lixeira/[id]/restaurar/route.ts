/**
 * API Route para restaurar documento da lixeira
 *
 * POST /api/lixeira/[id]/restaurar - Restaura documento
 */

import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/backend/auth/api-auth';
import {
  restaurarDocumento,
  verificarAcessoDocumento,
} from '@/backend/documentos/services/persistence/documentos-persistence.service';

/**
 * POST /api/lixeira/[id]/restaurar
 * Restaura um documento da lixeira
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

    // Verificar se é proprietário
    const { temAcesso, permissao } = await verificarAcessoDocumento(
      documento_id,
      authResult.usuario.id
    );

    if (!temAcesso || permissao !== 'proprietario') {
      return NextResponse.json(
        { success: false, error: 'Apenas o proprietário pode restaurar' },
        { status: 403 }
      );
    }

    const documento = await restaurarDocumento(documento_id);

    return NextResponse.json({
      success: true,
      data: documento,
      message: 'Documento restaurado com sucesso',
    });
  } catch (error) {
    console.error('Erro ao restaurar documento:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Erro interno',
      },
      { status: 500 }
    );
  }
}
