/**
 * API Route para auto-save de documentos
 *
 * POST /api/documentos/[id]/auto-save - Salva automaticamente o documento
 */

import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/backend/utils/auth/api-auth';
import {
  atualizarDocumento,
  verificarAcessoDocumento,
  incrementarVersaoDocumento,
} from '@/backend/documentos/services/persistence/documentos-persistence.service';
import { criarVersao } from '@/backend/documentos/services/persistence/versoes-persistence.service';
import type { AutoSavePayload } from '@/backend/types/documentos/types';

/**
 * POST /api/documentos/[id]/auto-save
 * Salva automaticamente o documento (debounced no frontend)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = await authenticateRequest(request);
    if (!authResult.authenticated || !authResult.usuario) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const documento_id = parseInt(params.id);
    if (isNaN(documento_id)) {
      return NextResponse.json(
        { success: false, error: 'ID inválido' },
        { status: 400 }
      );
    }

    // Verificar permissão de edição
    const { temAcesso, permissao } = await verificarAcessoDocumento(
      documento_id,
      authResult.usuario.id
    );

    if (!temAcesso || (permissao !== 'proprietario' && permissao !== 'editar')) {
      return NextResponse.json(
        { success: false, error: 'Sem permissão para editar' },
        { status: 403 }
      );
    }

    const body: AutoSavePayload = await request.json();

    if (!body.conteudo) {
      return NextResponse.json(
        { success: false, error: 'Conteúdo é obrigatório' },
        { status: 400 }
      );
    }

    // Atualizar documento
    const documento = await atualizarDocumento(
      documento_id,
      {
        conteudo: body.conteudo,
        titulo: body.titulo,
      },
      authResult.usuario.id
    );

    // Criar snapshot de versão a cada 10 auto-saves
    // (isso pode ser ajustado ou baseado em tempo)
    const createSnapshot = Math.random() < 0.1; // 10% de chance

    if (createSnapshot) {
      await criarVersao(
        {
          documento_id,
          versao: documento.versao,
          conteudo: body.conteudo,
          titulo: body.titulo ?? documento.titulo,
        },
        authResult.usuario.id
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        id: documento.id,
        versao: documento.versao,
        updated_at: documento.updated_at,
        snapshot_criado: createSnapshot,
      },
    });
  } catch (error) {
    console.error('Erro ao auto-salvar documento:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Erro interno',
      },
      { status: 500 }
    );
  }
}
