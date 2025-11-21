/**
 * API para reverter baixa de expediente manual
 * POST: Reverter a baixa (remover marcação de concluído)
 */

import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/backend/utils/auth/api-auth';
import { verificarPermissoes } from '@/backend/permissoes/services/persistence/permissao-persistence.service';
import { reverterBaixaExpedienteManual } from '@/backend/expedientes/services/persistence/expedientes-manuais-persistence.service';

/**
 * POST /api/expedientes-manuais/[id]/reverter-baixa
 * Reverter baixa de expediente manual
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Autenticação
    const { user } = await authenticateRequest();
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Não autenticado' },
        { status: 401 }
      );
    }

    // Permissão
    const temPermissao = await verificarPermissoes(
      user.id,
      'expedientes_manuais',
      'update'
    );
    if (!temPermissao) {
      return NextResponse.json(
        { success: false, error: 'Sem permissão para reverter baixa de expedientes manuais' },
        { status: 403 }
      );
    }

    const { id } = await params;
    const expedienteId = parseInt(id);

    if (isNaN(expedienteId)) {
      return NextResponse.json(
        { success: false, error: 'ID inválido' },
        { status: 400 }
      );
    }

    // Reverter baixa
    const expediente = await reverterBaixaExpedienteManual(expedienteId);

    return NextResponse.json({ success: true, data: expediente }, { status: 200 });
  } catch (error: any) {
    console.error('[API] Erro ao reverter baixa de expediente manual:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Erro ao reverter baixa de expediente manual' },
      { status: 500 }
    );
  }
}
