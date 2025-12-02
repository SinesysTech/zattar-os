/**
 * API Routes para compartilhamento específico
 *
 * PATCH /api/documentos/[id]/compartilhamentos/[compartilhamentoId] - Atualiza permissão
 * DELETE /api/documentos/[id]/compartilhamentos/[compartilhamentoId] - Remove compartilhamento
 */

import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/backend/auth/api-auth';
import {
  atualizarPermissaoCompartilhamentoPorId,
  removerCompartilhamentoPorId,
  buscarCompartilhamentoPorId,
} from '@/backend/documentos/services/persistence/compartilhamento-persistence.service';
import { verificarAcessoDocumento } from '@/backend/documentos/services/persistence/documentos-persistence.service';

/**
 * PATCH /api/documentos/[id]/compartilhamentos/[compartilhamentoId]
 * Atualiza a permissão de um compartilhamento
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; compartilhamentoId: string }> }
) {
  try {
    const authResult = await authenticateRequest(request);
    if (!authResult.authenticated || !authResult.usuario) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id, compartilhamentoId } = await params;
    const documento_id = parseInt(id);
    const compartilhamento_id = parseInt(compartilhamentoId);

    if (isNaN(documento_id) || isNaN(compartilhamento_id)) {
      return NextResponse.json(
        { success: false, error: 'IDs inválidos' },
        { status: 400 }
      );
    }

    // Verificar se é proprietário ou tem permissão de editar
    const { temAcesso, permissao: permissaoAcesso } = await verificarAcessoDocumento(
      documento_id,
      authResult.usuario.id
    );

    if (!temAcesso || permissaoAcesso === 'visualizar') {
      return NextResponse.json(
        { success: false, error: 'Sem permissão para modificar compartilhamentos' },
        { status: 403 }
      );
    }

    // Verificar se o compartilhamento existe e pertence ao documento
    const compartilhamento = await buscarCompartilhamentoPorId(compartilhamento_id);
    if (!compartilhamento || compartilhamento.documento_id !== documento_id) {
      return NextResponse.json(
        { success: false, error: 'Compartilhamento não encontrado' },
        { status: 404 }
      );
    }

    const body = await request.json();

    // Validar que pelo menos um campo foi enviado
    const temPermissao = body.permissao !== undefined;
    const temPodeDeletar = body.pode_deletar !== undefined;

    if (!temPermissao && !temPodeDeletar) {
      return NextResponse.json(
        { success: false, error: 'Nenhum campo para atualizar' },
        { status: 400 }
      );
    }

    // Validar permissão se foi enviada
    if (temPermissao && !['visualizar', 'editar'].includes(body.permissao)) {
      return NextResponse.json(
        { success: false, error: 'Permissão inválida' },
        { status: 400 }
      );
    }

    // Se não tem permissão, usar a permissão atual
    const permissao = temPermissao ? body.permissao : compartilhamento.permissao;
    const podeDeletar = temPodeDeletar ? body.pode_deletar === true : undefined;

    const atualizado = await atualizarPermissaoCompartilhamentoPorId(
      compartilhamento_id,
      permissao,
      podeDeletar
    );

    return NextResponse.json({ success: true, data: atualizado });
  } catch (error) {
    console.error('Erro ao atualizar compartilhamento:', error);
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
 * DELETE /api/documentos/[id]/compartilhamentos/[compartilhamentoId]
 * Remove um compartilhamento
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; compartilhamentoId: string }> }
) {
  try {
    const authResult = await authenticateRequest(request);
    if (!authResult.authenticated || !authResult.usuario) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id, compartilhamentoId } = await params;
    const documento_id = parseInt(id);
    const compartilhamento_id = parseInt(compartilhamentoId);

    if (isNaN(documento_id) || isNaN(compartilhamento_id)) {
      return NextResponse.json(
        { success: false, error: 'IDs inválidos' },
        { status: 400 }
      );
    }

    // Verificar se é proprietário ou tem permissão de editar
    const { temAcesso, permissao } = await verificarAcessoDocumento(
      documento_id,
      authResult.usuario.id
    );

    if (!temAcesso || permissao === 'visualizar') {
      return NextResponse.json(
        { success: false, error: 'Sem permissão para remover compartilhamentos' },
        { status: 403 }
      );
    }

    // Verificar se o compartilhamento existe e pertence ao documento
    const compartilhamento = await buscarCompartilhamentoPorId(compartilhamento_id);
    if (!compartilhamento || compartilhamento.documento_id !== documento_id) {
      return NextResponse.json(
        { success: false, error: 'Compartilhamento não encontrado' },
        { status: 404 }
      );
    }

    await removerCompartilhamentoPorId(compartilhamento_id);

    return NextResponse.json({
      success: true,
      message: 'Compartilhamento removido',
    });
  } catch (error) {
    console.error('Erro ao remover compartilhamento:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Erro interno',
      },
      { status: 500 }
    );
  }
}
