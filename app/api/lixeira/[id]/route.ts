/**
 * API Routes para documento específico na lixeira
 *
 * DELETE /api/lixeira/[id] - Deleta permanentemente
 */

import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/backend/auth/api-auth';
import {
  deletarDocumentoPermanentemente,
  verificarAcessoDocumento,
} from '@/backend/documentos/services/persistence/documentos-persistence.service';

/**
 * DELETE /api/lixeira/[id]
 * Deleta um documento permanentemente (hard delete)
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
    const documento_id = parseInt(id);
    if (isNaN(documento_id)) {
      return NextResponse.json(
        { success: false, error: 'ID inválido' },
        { status: 400 }
      );
    }

    // Verificar se é proprietário (mesmo para documentos deletados)
    const { temAcesso, permissao } = await verificarAcessoDocumento(
      documento_id,
      authResult.usuario.id
    );

    // Para hard delete, verifica apenas se criou o documento
    // (verificarAcessoDocumento não considera deleted_at para proprietário)
    if (!temAcesso || permissao !== 'proprietario') {
      return NextResponse.json(
        { success: false, error: 'Apenas o proprietário pode deletar permanentemente' },
        { status: 403 }
      );
    }

    await deletarDocumentoPermanentemente(documento_id);

    return NextResponse.json({
      success: true,
      message: 'Documento deletado permanentemente',
    });
  } catch (error) {
    console.error('Erro ao deletar documento permanentemente:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Erro interno',
      },
      { status: 500 }
    );
  }
}
