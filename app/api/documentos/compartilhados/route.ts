/**
 * API Route para documentos compartilhados com o usuário
 *
 * GET /api/documentos/compartilhados - Lista documentos compartilhados com o usuário
 */

import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/backend/auth/api-auth';
import { listarDocumentosCompartilhadosComUsuario } from '@/backend/documentos/services/persistence/documentos-persistence.service';

/**
 * GET /api/documentos/compartilhados
 * Lista documentos compartilhados com o usuário autenticado
 */
export async function GET(request: NextRequest) {
  try {
    const authResult = await authenticateRequest(request);
    if (!authResult.authenticated || !authResult.usuario) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const documentos = await listarDocumentosCompartilhadosComUsuario(
      authResult.usuario.id
    );

    return NextResponse.json({
      success: true,
      data: documentos,
    });
  } catch (error) {
    console.error('Erro ao listar documentos compartilhados:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Erro interno',
      },
      { status: 500 }
    );
  }
}
