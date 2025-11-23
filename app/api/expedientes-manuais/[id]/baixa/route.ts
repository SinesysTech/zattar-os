/**
 * API para baixar expediente manual (marcar como concluído)
 * POST: Baixar expediente (protocolo OU justificativa obrigatória)
 */

import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/backend/utils/auth/api-auth';
import { verificarPermissoes } from '@/backend/permissoes/services/persistence/permissao-persistence.service';
import { baixarExpedienteManual } from '@/backend/expedientes/services/persistence/expedientes-manuais-persistence.service';
import { BaixarExpedienteManualParams } from '@/backend/types/expedientes-manuais/types';

/**
 * POST /api/expedientes-manuais/[id]/baixa
 * Baixar expediente manual (concluir)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Autenticação
    const authResult = await authenticateRequest(request);
    if (!authResult.authenticated || !authResult.usuarioId) {
      return NextResponse.json(
        { success: false, error: 'Não autenticado' },
        { status: 401 }
      );
    }

    // Permissão
    const temPermissao = await verificarPermissoes(
      authResult.usuarioId,
      'expedientes_manuais',
      'baixar_expediente'
    );
    if (!temPermissao) {
      return NextResponse.json(
        { success: false, error: 'Sem permissão para baixar expedientes manuais' },
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

    // Body da requisição
    const body: BaixarExpedienteManualParams = await request.json();

    // Validação: protocolo_id OU justificativa_baixa obrigatória
    if (!body.protocolo_id && !body.justificativa_baixa) {
      return NextResponse.json(
        {
          success: false,
          error: 'É obrigatório informar o protocolo ou a justificativa para baixar o expediente',
        },
        { status: 400 }
      );
    }

    // Baixar expediente
    const expediente = await baixarExpedienteManual(expedienteId, body);

    return NextResponse.json({ success: true, data: expediente }, { status: 200 });
  } catch (error: any) {
    console.error('[API] Erro ao baixar expediente manual:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Erro ao baixar expediente manual' },
      { status: 500 }
    );
  }
}
