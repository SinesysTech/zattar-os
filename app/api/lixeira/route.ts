/**
 * API Routes para lixeira (soft deleted)
 *
 * GET /api/lixeira - Lista documentos na lixeira
 * POST /api/lixeira/[id]/restaurar - Restaura documento
 * DELETE /api/lixeira/[id] - Deleta permanentemente
 */

import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/backend/auth/api-auth';
import {
  listarDocumentosLixeira,
  restaurarDocumento,
  deletarDocumentoPermanentemente,
  verificarAcessoDocumento,
} from '@/backend/documentos/services/persistence/documentos-persistence.service';

/**
 * GET /api/lixeira
 * Lista documentos na lixeira do usuário
 */
export async function GET(request: NextRequest) {
  try {
    const authResult = await authenticateRequest(request);
    if (!authResult.authenticated || !authResult.usuario) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Lista apenas documentos deletados do próprio usuário
    const documentos = await listarDocumentosLixeira(authResult.usuario.id);

    return NextResponse.json({
      success: true,
      data: documentos,
    });
  } catch (error) {
    console.error('Erro ao listar lixeira:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Erro interno',
      },
      { status: 500 }
    );
  }
}
